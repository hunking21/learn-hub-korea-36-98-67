-- Fix RLS policies for student_profiles table to use JWT claims consistently
-- This ensures proper authentication flow matching other tables

-- Drop existing RLS policies for student_profiles
DROP POLICY IF EXISTS "Teachers and admins can insert student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Teachers and admins can update student profiles" ON public.student_profiles;  
DROP POLICY IF EXISTS "Users can view own student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can update own student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Teachers and admins can view student profiles" ON public.student_profiles;

-- Create new RLS policies using JWT claims for consistency
CREATE POLICY "Teachers and admins can insert student profiles" 
ON public.student_profiles 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM (users u JOIN user_sessions s ON ((u.id = s.user_id)))
  WHERE ((s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)) 
    AND (s.expires_at > now()) 
    AND (u.role = ANY (ARRAY['teacher'::user_role, 'admin'::user_role])))
));

CREATE POLICY "Teachers and admins can update student profiles" 
ON public.student_profiles 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM (users u JOIN user_sessions s ON ((u.id = s.user_id)))
  WHERE ((s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)) 
    AND (s.expires_at > now()) 
    AND (u.role = ANY (ARRAY['teacher'::user_role, 'admin'::user_role])))
));

CREATE POLICY "Users can view own student profile" 
ON public.student_profiles 
FOR SELECT 
USING (user_id = ( 
  SELECT user_sessions.user_id
  FROM user_sessions
  WHERE ((user_sessions.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)) 
    AND (user_sessions.expires_at > now()))
));

CREATE POLICY "Users can update own student profile" 
ON public.student_profiles 
FOR UPDATE 
USING (user_id = ( 
  SELECT user_sessions.user_id
  FROM user_sessions
  WHERE ((user_sessions.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)) 
    AND (user_sessions.expires_at > now()))
));

CREATE POLICY "Teachers and admins can view student profiles" 
ON public.student_profiles 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM (users u JOIN user_sessions s ON ((u.id = s.user_id)))
  WHERE ((s.session_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)) 
    AND (s.expires_at > now()) 
    AND (u.role = ANY (ARRAY['teacher'::user_role, 'admin'::user_role])))
));