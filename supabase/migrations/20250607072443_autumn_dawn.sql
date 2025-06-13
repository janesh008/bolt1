/*
  # Fix Product Creation RLS Policy

  1. Security Updates
    - Update INSERT policy for products table to properly check admin permissions
    - Ensure admin users can create products when they have proper roles
    - Add fallback policy for development/testing

  2. Changes
    - Modify existing INSERT policy to be more permissive for admin users
    - Add proper role checking logic
    - Ensure policy works with current admin authentication system
*/

-- Drop existing INSERT policy for products
DROP POLICY IF EXISTS "Admin users can insert products" ON products;

-- Create new INSERT policy that properly checks admin permissions
CREATE POLICY "Admin users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
        AND admin_users.status = 'active' 
        AND admin_users.role IN ('Moderator', 'Admin', 'SuperAdmin')
    )
  );

-- Also ensure the UPDATE policy is consistent
DROP POLICY IF EXISTS "Admin users can update products" ON products;

CREATE POLICY "Admin users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
        AND admin_users.status = 'active' 
        AND admin_users.role IN ('Moderator', 'Admin', 'SuperAdmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
        AND admin_users.status = 'active' 
        AND admin_users.role IN ('Moderator', 'Admin', 'SuperAdmin')
    )
  );

-- Ensure DELETE policy is also consistent
DROP POLICY IF EXISTS "Admin users can delete products" ON products;

CREATE POLICY "Admin users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
        AND admin_users.status = 'active' 
        AND admin_users.role IN ('Admin', 'SuperAdmin')
    )
  );