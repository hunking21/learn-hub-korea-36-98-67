-- Adjust policies to work with anon API key + custom session tokens
-- Recreate policies on test_masters without limiting to authenticated role

DROP POLICY IF EXISTS "Admins can manage test masters" ON test_masters;
DROP POLICY IF EXISTS "Admins and teachers can view all test masters" ON test_masters;

-- Admins can fully manage
CREATE POLICY "Admins can manage test masters"
ON test_masters
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = COALESCE(
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
    SELECT 1
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = COALESCE(
      current_setting('app.session_token', true),
      (current_setting('request.jwt.claims', true)::json ->> 'session_token')
    )
    AND s.expires_at > now()
    AND u.role = 'admin'::user_role
    AND u.is_active = true
  )
);

-- Admins and teachers can view all
CREATE POLICY "Admins and teachers can view all test masters"
ON test_masters
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = COALESCE(
      current_setting('app.session_token', true),
      (current_setting('request.jwt.claims', true)::json ->> 'session_token')
    )
    AND s.expires_at > now()
    AND u.role IN ('admin'::user_role, 'teacher'::user_role)
    AND u.is_active = true
  )
);
