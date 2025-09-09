-- Fix RLS policies for student_profiles to work with x-session-token header

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can update own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Teachers and admins can view student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Teachers and admins can insert student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Teachers and admins can update student profiles" ON student_profiles;

-- Recreate policies that work with x-session-token header
CREATE POLICY "Users can view own student profile" 
ON student_profiles 
FOR SELECT 
USING (user_id = (
  SELECT user_sessions.user_id
  FROM user_sessions
  WHERE user_sessions.session_token = COALESCE(
    ((current_setting('request.headers', true))::json ->> 'x-session-token'),
    ''
  ) AND user_sessions.expires_at > now()
));

CREATE POLICY "Users can update own student profile" 
ON student_profiles 
FOR UPDATE 
USING (user_id = (
  SELECT user_sessions.user_id
  FROM user_sessions
  WHERE user_sessions.session_token = COALESCE(
    ((current_setting('request.headers', true))::json ->> 'x-session-token'),
    ''
  ) AND user_sessions.expires_at > now()
));

CREATE POLICY "Teachers and admins can view student profiles" 
ON student_profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM users u
  JOIN user_sessions s ON u.id = s.user_id
  WHERE s.session_token = COALESCE(
    ((current_setting('request.headers', true))::json ->> 'x-session-token'),
    ''
  ) AND s.expires_at > now() 
  AND u.role IN ('teacher', 'admin')
));

CREATE POLICY "Teachers and admins can insert student profiles" 
ON student_profiles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM users u
  JOIN user_sessions s ON u.id = s.user_id
  WHERE s.session_token = COALESCE(
    ((current_setting('request.headers', true))::json ->> 'x-session-token'),
    ''
  ) AND s.expires_at > now() 
  AND u.role IN ('teacher', 'admin')
));

CREATE POLICY "Teachers and admins can update student profiles" 
ON student_profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1
  FROM users u
  JOIN user_sessions s ON u.id = s.user_id
  WHERE s.session_token = COALESCE(
    ((current_setting('request.headers', true))::json ->> 'x-session-token'),
    ''
  ) AND s.expires_at > now() 
  AND u.role IN ('teacher', 'admin')
));