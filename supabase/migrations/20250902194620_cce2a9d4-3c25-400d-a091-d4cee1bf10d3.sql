-- Drop and recreate the verify_user_login function with proper schema reference
DROP FUNCTION IF EXISTS public.verify_user_login(text, text);

CREATE OR REPLACE FUNCTION public.verify_user_login(p_username text, p_password text)
RETURNS TABLE(token uuid, user_id uuid, role user_role, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
declare
  _u record;
  _t uuid;
begin
  -- Load user and role
  select u.id, u.username, u.password_hash, u.full_name, u.role
    into _u
  from public.users u
  where u.username = lower(p_username)
  limit 1;

  if not found then
    return; -- User not found → empty result
  end if;

  -- Check password (bcrypt) with extensions schema
  if extensions.crypt(p_password, _u.password_hash) = _u.password_hash then
    insert into public.user_sessions (user_id)
      values (_u.id)
      returning public.user_sessions.token into _t;

    token := _t;
    user_id := _u.id;
    role := _u.role;
    full_name := _u.full_name;
    return next;
  end if;

  -- Password mismatch → empty result
  return;
end;
$$;