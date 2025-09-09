-- Fix infinite recursion in users table RLS policies
-- Drop all existing problematic policies for users table
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Allow selecting users for login" ON users;
DROP POLICY IF EXISTS "Students can sign up" ON users;
DROP POLICY IF EXISTS "Teachers can insert students" ON users;
DROP POLICY IF EXISTS "Teachers can view students" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create simple, non-recursive policies for users table
-- Allow unrestricted access for login purposes
CREATE POLICY "Allow login access" ON users
FOR SELECT
USING (true);

-- Allow students to register
CREATE POLICY "Allow student registration" ON users
FOR INSERT
WITH CHECK (role = 'student');

-- Allow admins to manage users using direct auth.uid() check
CREATE POLICY "Admins can manage users" ON users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'admin' 
    AND admin_user.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'admin' 
    AND admin_user.is_active = true
  )
);