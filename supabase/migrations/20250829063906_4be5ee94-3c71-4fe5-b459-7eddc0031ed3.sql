-- Create app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update profiles table to ensure proper structure
ALTER TABLE public.profiles 
    ALTER COLUMN role SET DEFAULT 'student'::app_role,
    ALTER COLUMN user_id SET NOT NULL;

-- Create trigger to automatically insert user role when profile is created
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert role into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic role syncing
DROP TRIGGER IF EXISTS sync_profile_role ON public.profiles;
CREATE TRIGGER sync_profile_role
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_role();

-- Update handle_new_user function to set default role properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, email, role, date_of_birth, gender)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name',
                 NEW.raw_user_meta_data ->> 'full_name',
                 split_part(NEW.email, '@', 1)),
        NEW.email,
        'student'::app_role,
        NULLIF(NEW.raw_user_meta_data ->> 'date_of_birth','')::date,
        NULLIF(NEW.raw_user_meta_data ->> 'gender','')
    )
    ON CONFLICT (user_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            email = EXCLUDED.email,
            updated_at = now(),
            date_of_birth = EXCLUDED.date_of_birth,
            gender = EXCLUDED.gender;

    -- Insert default student role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;