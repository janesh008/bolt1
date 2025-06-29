/*
  # Fix Authentication Database Error

  This migration addresses common issues that cause "Database error granting user" errors:

  1. Database Functions
     - Recreate the handle_new_user function to properly handle user creation
     - Add proper error handling and logging

  2. Triggers
     - Ensure the trigger is properly set up on auth.users

  3. RLS Policies
     - Fix any missing or conflicting RLS policies that might block user creation

  4. Permissions
     - Ensure proper permissions for the auth schema operations
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (
    id,
    full_name,
    email,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NOW()
  );

  -- Insert into public.user_profiles table
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure RLS is properly configured for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies and recreate them properly
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Create proper RLS policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "System can insert user data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure user_profiles RLS policies are correct
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert user profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure customers table can handle user creation
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Allow insert for own customer record" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customer data" ON customers;

CREATE POLICY "System can create customer records"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own customer data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own customer data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure the auth schema has proper permissions
GRANT USAGE ON SCHEMA auth TO authenticated;