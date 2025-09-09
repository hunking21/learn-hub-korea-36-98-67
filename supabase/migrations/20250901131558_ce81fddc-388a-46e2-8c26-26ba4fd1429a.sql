-- Recreate test_masters policies to accept x-session-token header
DROP POLICY IF EXISTS "Admins can manage test masters" ON test_masters;
DROP POLICY IF EXISTS "Admins and teachers can view all test masters" ON test_masters;

CREATE POLICY "Admins can manage test masters"
ON test_masters
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = COALESCE(
      ((current_setting('request.headers', true))::json ->> 'x-session-token'),
      current_setting('app.session_token', true),
      (current_setting('request.jwt.claims', true)::json ->> 'session_token')
    )
    AND s.expires_at > now()
    AND u.role = 'admin'::user_role
    AND u.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = COALESCE(
      ((current_setting('request.headers', true))::json ->> 'x-session-token'),
      current_setting('app.session_token', true),
      (current_setting('request.jwt.claims', true)::json ->> 'session_token')
    )
    AND s.expires_at > now()
    AND u.role = 'admin'::user_role
    AND u.is_active = true
  )
);

CREATE POLICY "Admins and teachers can view all test masters"
ON test_masters
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = COALESCE(
      ((current_setting('request.headers', true))::json ->> 'x-session-token'),
      current_setting('app.session_token', true),
      (current_setting('request.jwt.claims', true)::json ->> 'session_token')
    )
    AND s.expires_at > now()
    AND u.role IN ('admin'::user_role, 'teacher'::user_role)
    AND u.is_active = true
  )
);