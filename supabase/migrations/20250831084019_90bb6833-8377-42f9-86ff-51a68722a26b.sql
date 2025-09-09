-- Add system_type to student_profiles table
ALTER TABLE public.student_profiles 
ADD COLUMN system_type TEXT CHECK (system_type IN ('korea', 'us', 'uk'));

-- Set a default date for existing null date_of_birth values before making it mandatory
UPDATE public.users 
SET date_of_birth = '1990-01-01' 
WHERE date_of_birth IS NULL;

-- Now make date_of_birth mandatory
ALTER TABLE public.users 
ALTER COLUMN date_of_birth SET NOT NULL;