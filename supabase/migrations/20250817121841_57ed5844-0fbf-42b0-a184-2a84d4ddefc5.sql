
-- 1) 카테고리별 질문 테이블 4개 생성
-- 공통 스키마:
-- - id, created_at, updated_at
-- - subject, system_type, grade_level
-- - question_type: 'multiple_choice' | 'subjective'
-- - question_text, explanation, options(jsonb), correct_answer
-- - points, difficulty_level
-- - 객관식일 때는 options가 배열이며 2개 이상이어야 함

create table if not exists public.category1_questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  system_type text not null,
  grade_level text not null,
  question_type text not null check (question_type in ('multiple_choice', 'subjective')),
  question_text text not null,
  explanation text not null,
  options jsonb,
  correct_answer text,
  points integer not null default 1,
  difficulty_level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (question_type = 'multiple_choice' and options is not null and jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2)
    or
    (question_type = 'subjective')
  )
);

create table if not exists public.category2_questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  system_type text not null,
  grade_level text not null,
  question_type text not null check (question_type in ('multiple_choice', 'subjective')),
  question_text text not null,
  explanation text not null,
  options jsonb,
  correct_answer text,
  points integer not null default 1,
  difficulty_level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (question_type = 'multiple_choice' and options is not null and jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2)
    or
    (question_type = 'subjective')
  )
);

create table if not exists public.category3_questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  system_type text not null,
  grade_level text not null,
  question_type text not null check (question_type in ('multiple_choice', 'subjective')),
  question_text text not null,
  explanation text not null,
  options jsonb,
  correct_answer text,
  points integer not null default 1,
  difficulty_level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (question_type = 'multiple_choice' and options is not null and jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2)
    or
    (question_type = 'subjective')
  )
);

create table if not exists public.category4_questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  system_type text not null,
  grade_level text not null,
  question_type text not null check (question_type in ('multiple_choice', 'subjective')),
  question_text text not null,
  explanation text not null,
  options jsonb,
  correct_answer text,
  points integer not null default 1,
  difficulty_level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (question_type = 'multiple_choice' and options is not null and jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2)
    or
    (question_type = 'subjective')
  )
);

-- 2) RLS 설정: 조회만 모두 허용
alter table public.category1_questions enable row level security;
alter table public.category2_questions enable row level security;
alter table public.category3_questions enable row level security;
alter table public.category4_questions enable row level security;

drop policy if exists "Anyone can view category1 questions" on public.category1_questions;
create policy "Anyone can view category1 questions"
  on public.category1_questions for select
  using (true);

drop policy if exists "Anyone can view category2 questions" on public.category2_questions;
create policy "Anyone can view category2 questions"
  on public.category2_questions for select
  using (true);

drop policy if exists "Anyone can view category3 questions" on public.category3_questions;
create policy "Anyone can view category3 questions"
  on public.category3_questions for select
  using (true);

drop policy if exists "Anyone can view category4 questions" on public.category4_questions;
create policy "Anyone can view category4 questions"
  on public.category4_questions for select
  using (true);

-- 3) updated_at 자동 갱신 트리거
drop trigger if exists set_updated_at_category1_questions on public.category1_questions;
create trigger set_updated_at_category1_questions
  before update on public.category1_questions
  for each row execute function public.update_updated_at_column();

drop trigger if exists set_updated_at_category2_questions on public.category2_questions;
create trigger set_updated_at_category2_questions
  before update on public.category2_questions
  for each row execute function public.update_updated_at_column();

drop trigger if exists set_updated_at_category3_questions on public.category3_questions;
create trigger set_updated_at_category3_questions
  before update on public.category3_questions
  for each row execute function public.update_updated_at_column();

drop trigger if exists set_updated_at_category4_questions on public.category4_questions;
create trigger set_updated_at_category4_questions
  before update on public.category4_questions
  for each row execute function public.update_updated_at_column();

-- 4) 네 개 테이블을 한 번에 조회하는 VIEW
create or replace view public.category_questions_all as
select
  'category1'::text as category,
  id, subject, system_type, grade_level, question_type, question_text, explanation,
  options, correct_answer, points, difficulty_level, created_at, updated_at
from public.category1_questions
union all
select
  'category2'::text as category,
  id, subject, system_type, grade_level, question_type, question_text, explanation,
  options, correct_answer, points, difficulty_level, created_at, updated_at
from public.category2_questions
union all
select
  'category3'::text as category,
  id, subject, system_type, grade_level, question_type, question_text, explanation,
  options, correct_answer, points, difficulty_level, created_at, updated_at
from public.category3_questions
union all
select
  'category4'::text as category,
  id, subject, system_type, grade_level, question_type, question_text, explanation,
  options, correct_answer, points, difficulty_level, created_at, updated_at
from public.category4_questions;
