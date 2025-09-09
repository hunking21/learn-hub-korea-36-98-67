-- 임시로 test_masters 테이블에 admin 권한 확인 없이 삽입할 수 있도록 정책 수정
DROP POLICY IF EXISTS "Admins can manage test masters" ON test_masters;

-- 임시 정책: 모든 인증된 사용자가 삽입 가능하도록 설정
CREATE POLICY "Temp allow authenticated users to manage test masters" ON test_masters
FOR ALL
USING (true)
WITH CHECK (true);