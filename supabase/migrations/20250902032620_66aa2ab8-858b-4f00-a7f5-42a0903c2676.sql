-- Fix infinite recursion in users table RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can select their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for own user" ON users;
DROP POLICY IF EXISTS "Enable update for own user" ON users;

-- Create new simplified policies without recursion
CREATE POLICY "Enable read access for authenticated users" ON users
FOR SELECT USING (true);

CREATE POLICY "Enable update for own user data" ON users
FOR UPDATE USING (id = auth.uid());