-- Step 1: Drop all existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS reading_test_answers CASCADE;
DROP TABLE IF EXISTS test_answers CASCADE;
DROP TABLE IF EXISTS reading_test_sessions CASCADE;
DROP TABLE IF EXISTS test_sessions CASCADE;
DROP TABLE IF EXISTS reading_questions CASCADE;
DROP TABLE IF EXISTS reading_passages_with_stats CASCADE;
DROP TABLE IF EXISTS reading_passages CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS writing_prompts CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role app_role) CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 3: Drop custom types
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Step 4: Create custom authentication system
-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');

-- Create users table for custom authentication
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Create user sessions table for login management
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id = (
        SELECT user_id FROM public.user_sessions 
        WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        AND expires_at > now()
    ));

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.user_sessions s ON u.id = s.user_id
            WHERE s.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
            AND s.expires_at > now()
            AND u.role = 'admin'
        )
    );

-- Teachers can view students
CREATE POLICY "Teachers can view students" ON public.users
    FOR SELECT USING (
        role = 'student' AND EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.user_sessions s ON u.id = s.user_id
            WHERE s.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
            AND s.expires_at > now()
            AND u.role IN ('teacher', 'admin')
        )
    );

-- Only admins can create users (for bulk student creation)
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.user_sessions s ON u.id = s.user_id
            WHERE s.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
            AND s.expires_at > now()
            AND u.role = 'admin'
        )
    );

-- RLS Policies for user_sessions table
-- Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON public.user_sessions
    FOR ALL USING (user_id = (
        SELECT user_id FROM public.user_sessions 
        WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        AND expires_at > now()
    ));

-- Create indexes for performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (password will be hashed in application)
INSERT INTO public.users (username, password_hash, full_name, role)
VALUES ('admin', 'temp_password_to_be_replaced', 'TN Academy 관리자', 'admin');

-- Insert default teacher user  
INSERT INTO public.users (username, password_hash, full_name, role)
VALUES ('teacher', 'temp_password_to_be_replaced', '선생님', 'teacher');

-- Insert default student user
INSERT INTO public.users (username, password_hash, full_name, role, date_of_birth)
VALUES ('student', 'temp_password_to_be_replaced', '김학생', 'student', '2010-05-20');