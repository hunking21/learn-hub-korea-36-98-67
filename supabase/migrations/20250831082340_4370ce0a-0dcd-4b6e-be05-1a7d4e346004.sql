
-- 1) 성별 ENUM 생성
create type public.gender_type as enum ('male', 'female', 'other');

-- 2) 학생 상세 프로필 테이블 생성
create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  gender public.gender_type not null,
  school text,
  grade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger set_student_profiles_updated_at
before update on public.student_profiles
for each row execute procedure public.update_updated_at_column();

-- RLS 활성화
alter table public.student_profiles enable row level security;

-- 학생: 본인 프로필 조회
create policy "Users can view own student profile"
on public.student_profiles
for select
using (
  user_id = (
    select user_sessions.user_id
    from user_sessions
    where user_sessions.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
      and user_sessions.expires_at > now()
  )
);

-- 학생: 본인 프로필 수정
create policy "Users can update own student profile"
on public.student_profiles
for update
using (
  user_id = (
    select user_sessions.user_id
    from user_sessions
    where user_sessions.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
      and user_sessions.expires_at > now()
  )
);

-- 관리자/선생님: 모든 학생 프로필 조회
create policy "Teachers and admins can view student profiles"
on public.student_profiles
for select
using (
  exists (
    select 1
    from users u
    join user_sessions s on u.id = s.user_id
    where s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
      and s.expires_at > now()
      and u.role = any (array['teacher'::user_role, 'admin'::user_role])
  )
);

-- 관리자/선생님: 학생 프로필 등록
create policy "Teachers and admins can insert student profiles"
on public.student_profiles
for insert
with check (
  exists (
    select 1
    from users u
    join user_sessions s on u.id = s.user_id
    where s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
      and s.expires_at > now()
      and u.role = any (array['teacher'::user_role, 'admin'::user_role])
  )
);

-- 관리자/선생님: 학생 프로필 수정
create policy "Teachers and admins can update student profiles"
on public.student_profiles
for update
using (
  exists (
    select 1
    from users u
    join user_sessions s on u.id = s.user_id
    where s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
      and s.expires_at > now()
      and u.role = any (array['teacher'::user_role, 'admin'::user_role])
  )
);

-- 3) users.username 고유 제약
alter table public.users
  add constraint users_username_unique unique (username);

-- 4) 학생 자체 회원가입 허용(anon 가능) - 단 학생만
create policy "Students can sign up"
on public.users
for insert
with check (role = 'student'::user_role);

-- 5) 교사/관리자: 학생 계정 생성 허용
create policy "Teachers can insert students"
on public.users
for insert
with check (
  exists (
    select 1
    from user_sessions s
    where s.session_token = ((current_setting('request.jwt.claims', true))::json ->> 'session_token')
      and s.expires_at > now()
      and s.role = any (array['teacher'::user_role, 'admin'::user_role])
  )
  and role = 'student'::user_role
);
