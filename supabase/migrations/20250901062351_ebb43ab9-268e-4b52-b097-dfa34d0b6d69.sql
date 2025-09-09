-- Update RLS policy to accept x-session-token header for INSERT on test_versions
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
      current_setting('app.session_token', true),
      (current_setting('request.headers', true))::json ->> 'x-session-token',
      (current_setting('request.jwt.claims', true))::json ->> 'session_token'
    )
    AND s.expires_at > now()
    AND u.role = 'admin'
  )
);
