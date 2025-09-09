-- test_masters 테이블의 기존 정책 제거 및 새 정책 추가
DROP POLICY IF EXISTS "Everyone can view test masters" ON public.test_masters;
DROP POLICY IF EXISTS "Temp allow authenticated users to manage test masters" ON public.test_masters;

-- 관리자와 교사는 모든 시험을 볼 수 있음
CREATE POLICY "Admins and teachers can view all test masters" 
ON public.test_masters 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM user_sessions s 
  JOIN users u ON s.user_id = u.id 
  WHERE s.session_token = COALESCE(
    ((current_setting('request.headers'::text, true))::json ->> 'x-session-token'::text),
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)
  ) 
  AND s.expires_at > now() 
  AND u.role = ANY (ARRAY['teacher'::user_role, 'admin'::user_role])
));

-- 학생은 권한이 있는 시험만 볼 수 있음
CREATE POLICY "Students can view permitted test masters" 
ON public.test_masters 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM student_test_permissions stp
  JOIN user_sessions s ON stp.student_id = s.user_id
  WHERE s.session_token = COALESCE(
    ((current_setting('request.headers'::text, true))::json ->> 'x-session-token'::text),
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)
  ) 
  AND s.expires_at > now()
  AND stp.test_master_id = test_masters.id
  AND stp.is_active = true
  AND (stp.expires_at IS NULL OR stp.expires_at > now())
));

-- 관리자는 시험을 관리할 수 있음
CREATE POLICY "Admins can manage test masters" 
ON public.test_masters 
FOR ALL 
USING (EXISTS (
  SELECT 1 
  FROM user_sessions s 
  JOIN users u ON s.user_id = u.id 
  WHERE s.session_token = COALESCE(
    ((current_setting('request.headers'::text, true))::json ->> 'x-session-token'::text),
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)
  ) 
  AND s.expires_at > now() 
  AND u.role = 'admin'::user_role
));