/*
  # Fix Users Table RLS Policies

  1. Security Updates
    - Add missing RLS policy for user registration
    - Allow authenticated users to insert their own profile data
    - Ensure users can only create profiles linked to their auth ID

  2. Policy Changes
    - Add INSERT policy for authenticated users creating their own profiles
    - Maintain existing SELECT and UPDATE policies
*/

-- Add policy to allow users to insert their own profile data during registration
CREATE POLICY "Allow users to insert own profile during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Ensure the existing policies are properly configured
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Recreate policies with proper names and conditions
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());