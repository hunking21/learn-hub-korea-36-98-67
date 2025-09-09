-- Fix RLS policy for test_versions table to allow admin insertions
-- The current policy is not properly recognizing the session token

-- Drop and recreate the INSERT policy for test_versions
DROP POLICY IF EXISTS "Admins can insert test versions" ON public.test_versions;

CREATE POLICY "Admins can insert test versions" 
ON public.test_versions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM users u 
    JOIN user_sessions s ON u.id = s.user_id 
    WHERE s.session_token = COALESCE(
      (current_setting('app.session_token', true)), 
      ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
    )
    AND s.expires_at > now() 
    AND u.role = 'admin'
  )
);