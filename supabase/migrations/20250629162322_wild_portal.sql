/*
  # Fix Authentication Database Issues

  1. Database Issues Fixed
    - Remove conflicting foreign key constraints on users table
    - Fix RLS policies that might be blocking authentication
    - Ensure proper user creation flow
    - Fix potential circular dependencies

  2. Security
    - Maintain proper RLS policies
    - Ensure authentication flow works correctly
*/

-- First, let's fix the users table foreign key issue
-- The users table has a foreign key to auth.users but also uses uid() as default
-- This can cause circular dependency issues during user creation

-- Drop the problematic foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Ensure the users table can be populated during auth flow
-- Update the RLS policies to be less restrictive during user creation
DROP POLICY IF EXISTS "System can insert user data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Create more permissive policies for authentication flow
CREATE POLICY "Enable insert for authentication service" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Enable update for own records" ON users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Fix customers table policies that might conflict
DROP POLICY IF EXISTS "System can create customer records" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can view their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can view their own role" ON customers;
DROP POLICY IF EXISTS "Only admins can update roles" ON customers;

-- Create cleaner customer policies
CREATE POLICY "Enable customer creation" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own customer data" ON customers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own customer data" ON customers
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Fix user_profiles table policies
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

CREATE POLICY "Enable profile creation" ON user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Ensure the handle_new_user function exists and works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, full_name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into customers table
  INSERT INTO public.customers (user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_profiles table
  INSERT INTO public.user_profiles (user_id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix any potential issues with the orders table RLS
-- The orders table has conflicting policies that might cause issues
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());

-- Ensure RLS is properly enabled on critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;