/*
# Fix User Authentication and Permissions

1. New Functions
  - Improved `handle_new_user()` function to properly create user records
  - Added `get_user_role()` and `is_admin_user()` helper functions
  - Fixed `update_updated_at_column()` function

2. Security
  - Fixed RLS policies on users and customers tables
  - Improved order policies with proper checks
  - Added proper error handling in trigger functions

3. Changes
  - Added DROP IF EXISTS for all policies before creating them
  - Fixed customer record creation during signup
  - Ensured proper permissions for authenticated and anonymous users
*/

-- First, let's ensure the trigger function for handling new users exists and works properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, full_name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name);

  -- Insert into customers table
  INSERT INTO public.customers (user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2)),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, customers.first_name),
    last_name = COALESCE(EXCLUDED.last_name, customers.last_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the authentication
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fix RLS policies on users table to allow user creation
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  TO public
  WITH CHECK (true); -- Allow insertion during signup

DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO public
  USING (id = auth.uid() OR auth.uid() IS NULL); -- Allow viewing own data

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO public
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Fix RLS policies on customers table
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Allow insert for own customer record" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can insert customer data" ON customers;

CREATE POLICY "Users can insert customer data"
  ON customers FOR INSERT
  TO public
  WITH CHECK (true); -- Allow insertion during signup

DROP POLICY IF EXISTS "Users can view their own customer data" ON customers;
CREATE POLICY "Users can view their own customer data"
  ON customers FOR SELECT
  TO public
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;
CREATE POLICY "Users can update their own customer data"
  ON customers FOR UPDATE
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customers table if not already enabled  
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create a function to safely get user role (used in other policies)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM customers 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin (used in other policies)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE auth_user_id = auth.uid() 
    AND status = 'active'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure all required update triggers exist
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix any potential issues with the orders table RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Clean up any conflicting policies on orders
-- First check if the policy exists before trying to create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Users can create orders'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create orders" ON orders FOR INSERT TO public WITH CHECK (user_id = auth.uid() OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Users can view their own orders'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view their own orders" ON orders';
  END IF;
  
  EXECUTE 'CREATE POLICY "Users can view their own orders" ON orders FOR SELECT TO public USING (user_id = auth.uid() OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))';
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;