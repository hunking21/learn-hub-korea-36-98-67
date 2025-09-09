-- Create admin profile and role
INSERT INTO public.profiles (user_id, display_name, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '시스템 관리자',
  'admin@tnacademy.co.kr',
  'admin'
)
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Insert admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;