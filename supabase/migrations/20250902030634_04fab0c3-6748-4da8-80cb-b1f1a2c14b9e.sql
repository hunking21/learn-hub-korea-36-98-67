-- Fix infinite recursion in user_sessions RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow inserting sessions during login" ON user_sessions;
DROP POLICY IF EXISTS "Delete own session via JWT" ON user_sessions;
DROP POLICY IF EXISTS "Select own active session via JWT" ON user_sessions;
DROP POLICY IF EXISTS "Update own active session via JWT" ON user_sessions;
DROP POLICY IF EXISTS "Users can access sessions with valid session token" ON user_sessions;
DROP POLICY IF EXISTS "staff read sessions" ON user_sessions;
DROP POLICY IF EXISTS "students manage own sessions" ON user_sessions;

-- Create new simplified policies without recursion
-- Allow unrestricted session creation during login
CREATE POLICY "Allow session creation" ON user_sessions
FOR INSERT 
WITH CHECK (true);

-- Allow users to access their own sessions using user_id directly
CREATE POLICY "Users can access own sessions" ON user_sessions
FOR ALL
USING (user_id = auth.uid());

-- Allow staff to read all sessions
CREATE POLICY "Staff can read all sessions" ON user_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'teacher')
    AND u.is_active = true
  )
);