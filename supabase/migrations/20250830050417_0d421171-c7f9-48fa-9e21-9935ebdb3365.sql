-- Update RLS policy for user_sessions to use header instead of JWT claims
DROP POLICY IF EXISTS "Users can only see their own sessions" ON public.user_sessions;

CREATE POLICY "Users can access sessions with valid session token"
ON public.user_sessions
FOR ALL
USING (
  session_token = coalesce(
    current_setting('request.headers', true)::json->>'x-session-token',
    ''
  )
);