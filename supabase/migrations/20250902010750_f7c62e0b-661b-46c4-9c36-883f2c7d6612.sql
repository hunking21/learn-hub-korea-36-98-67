-- Fix RLS policy for test_masters table to properly recognize admin session tokens

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage test masters" ON public.test_masters;

-- Create updated policy that checks session token more reliably
CREATE POLICY "Admins can manage test masters" ON public.test_masters
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_sessions s 
    JOIN users u ON u.id = s.user_id 
    WHERE s.session_token = COALESCE(
      current_setting('app.session_token', true),
      ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
    )
    AND s.expires_at > now() 
    AND u.role = 'admin'
    AND u.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_sessions s 
    JOIN users u ON u.id = s.user_id 
    WHERE s.session_token = COALESCE(
      current_setting('app.session_token', true),
      ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
    )
    AND s.expires_at > now() 
    AND u.role = 'admin'
    AND u.is_active = true
  )
);