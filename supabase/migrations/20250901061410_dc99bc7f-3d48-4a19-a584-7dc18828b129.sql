-- test_versions 테이블에 INSERT 정책 추가
CREATE POLICY "Admins can insert test versions" ON test_versions
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM users u
  JOIN user_sessions s ON u.id = s.user_id
  WHERE s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
  AND s.expires_at > now()
  AND u.role = 'admin'
));