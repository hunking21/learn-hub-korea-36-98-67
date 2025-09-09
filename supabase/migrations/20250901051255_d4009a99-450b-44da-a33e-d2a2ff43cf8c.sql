-- Update RLS policies for test_masters to use more reliable authentication
DROP POLICY IF EXISTS "Admins can manage test masters" ON test_masters;

-- Create new policy that checks session more reliably
CREATE POLICY "Admins can manage test masters" ON test_masters
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'session_token'),
      current_setting('app.session_token', true)
    )
    AND s.expires_at > now()
    AND u.role = 'admin'
    AND u.is_active = true
  )
);