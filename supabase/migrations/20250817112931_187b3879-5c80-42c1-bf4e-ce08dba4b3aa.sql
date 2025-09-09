-- Drop all existing tables if they exist
DROP TABLE IF EXISTS public.test_answers CASCADE;
DROP TABLE IF EXISTS public.test_sessions CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any existing functions, triggers, or other objects
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;