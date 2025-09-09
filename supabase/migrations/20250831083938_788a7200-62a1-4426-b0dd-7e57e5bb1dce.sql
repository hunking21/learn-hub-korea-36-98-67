-- Add system_type to student_profiles table
ALTER TABLE public.student_profiles 
ADD COLUMN system_type TEXT CHECK (system_type IN ('korea', 'us', 'uk'));

-- Make date_of_birth mandatory in users table
ALTER TABLE public.users 
ALTER COLUMN date_of_birth SET NOT NULL;