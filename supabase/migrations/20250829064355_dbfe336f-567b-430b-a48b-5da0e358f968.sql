-- Create admin user account
INSERT INTO auth.users (
  id,
  instance_id,
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@tnacademy.com',
  crypt('admin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "관리자", "full_name": "TN Academy 관리자"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;