-- 학생-시험 권한 관리 테이블 생성
CREATE TABLE public.student_test_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  test_master_id UUID NOT NULL,
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- 같은 학생이 같은 시험에 대해 중복 권한을 가지지 않도록
  UNIQUE(student_id, test_master_id)
);

-- RLS 활성화
ALTER TABLE public.student_test_permissions ENABLE ROW LEVEL SECURITY;

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_student_test_permissions_student_id ON public.student_test_permissions(student_id);
CREATE INDEX idx_student_test_permissions_test_master_id ON public.student_test_permissions(test_master_id);
CREATE INDEX idx_student_test_permissions_active ON public.student_test_permissions(is_active, expires_at);

-- RLS 정책: 관리자는 모든 권한을 관리할 수 있음
CREATE POLICY "Admins can manage all test permissions" 
ON public.student_test_permissions 
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

-- RLS 정책: 학생은 자신의 권한만 볼 수 있음
CREATE POLICY "Students can view own test permissions" 
ON public.student_test_permissions 
FOR SELECT 
USING (student_id = (
  SELECT user_sessions.user_id
  FROM user_sessions
  WHERE user_sessions.session_token = COALESCE(
    ((current_setting('request.headers'::text, true))::json ->> 'x-session-token'::text),
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'session_token'::text)
  ) 
  AND user_sessions.expires_at > now()
));

-- 교사도 학생들의 권한을 볼 수 있음
CREATE POLICY "Teachers can view student test permissions" 
ON public.student_test_permissions 
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

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_student_test_permissions_updated_at
  BEFORE UPDATE ON public.student_test_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- test_masters 테이블의 RLS 정책을 수정하여 권한 기반 접근 제어
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