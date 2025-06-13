/*
  # Add RLS policies for products table

  1. Security
    - Add policy for admins to insert products
    - Add policy for admins to update products
    - Add policy for admins to delete products
    - Ensure existing select policy works for public access

  2. Changes
    - Allow admin users (Moderator, Admin, SuperAdmin) to manage products
    - Maintain public read access for available products
*/

-- Allow admin users to insert products
CREATE POLICY "Admin users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
      AND admin_users.role IN ('Moderator', 'Admin', 'SuperAdmin')
    )
  );

-- Allow admin users to update products
CREATE POLICY "Admin users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
      AND admin_users.role IN ('Moderator', 'Admin', 'SuperAdmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
      AND admin_users.role IN ('Moderator', 'Admin', 'SuperAdmin')
    )
  );

-- Allow admin users to delete products
CREATE POLICY "Admin users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
      AND admin_users.role IN ('Admin', 'SuperAdmin')
    )
  );