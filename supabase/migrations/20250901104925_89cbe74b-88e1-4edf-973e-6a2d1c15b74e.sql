-- 더 간단하고 안전한 RLS 정책으로 업데이트

-- test_section_questions 테이블의 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Admins can manage test section questions" ON test_section_questions;

-- 새로운 정책 생성 (session token을 헤더에서 직접 확인)
CREATE POLICY "Admins can manage test section questions" 
ON test_section_questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = COALESCE(
      current_setting('request.headers', true)::json->>'x-session-token',
      ((current_setting('request.jwt.claims', true))::json->>'session_token')
    )
    AND s.expires_at > now()
    AND u.role = 'admin'
  )
);

-- test_sections 테이블도 동일하게 업데이트
DROP POLICY IF EXISTS "Admins can manage test sections" ON test_sections;

CREATE POLICY "Admins can manage test sections" 
ON test_sections 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = COALESCE(
      current_setting('request.headers', true)::json->>'x-session-token',
      ((current_setting('request.jwt.claims', true))::json->>'session_token')
    )
    AND s.expires_at > now()
    AND u.role = 'admin'
  )
);