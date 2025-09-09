
-- 1) users 테이블에 'requires_password_change' 컬럼 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS requires_password_change boolean NOT NULL DEFAULT false;
