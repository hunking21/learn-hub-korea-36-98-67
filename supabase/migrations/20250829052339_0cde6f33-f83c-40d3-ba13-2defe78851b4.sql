
-- 1) user_roles 테이블 생성 및 RLS 설정
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- 본인만 자신의 role을 조회 가능
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Users can view their own roles'
  ) then
    create policy "Users can view their own roles"
      on public.user_roles
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);

-- 2) profiles 테이블에 생년월일/성별 컬럼 추가 및 user_id 유니크 인덱스(중복 방지)
alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists gender text;

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

-- 3) handle_new_user 함수 업데이트: 프로필/역할 자동 생성(중복 안전), 생년월일/성별 반영
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (user_id, display_name, email, role, date_of_birth, gender)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name',
             new.raw_user_meta_data ->> 'full_name',
             split_part(new.email, '@', 1)),
    new.email,
    'student',
    nullif(new.raw_user_meta_data ->> 'date_of_birth','')::date,
    nullif(new.raw_user_meta_data ->> 'gender','')
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        email = excluded.email,
        updated_at = now(),
        date_of_birth = excluded.date_of_birth,
        gender = excluded.gender;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  return new;
end;
$function$;

-- 4) auth.users 트리거가 없으면 생성 (신규 유저 생성 시 handle_new_user 실행)
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'on_auth_user_created'
      and n.nspname = 'auth'
      and c.relname = 'users'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;
