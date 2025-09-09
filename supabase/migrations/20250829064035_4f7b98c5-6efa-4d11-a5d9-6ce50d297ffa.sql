-- Fix security definer functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
    -- Insert role into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Fix handle_new_user function search_path (it was already set correctly)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
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
$$;