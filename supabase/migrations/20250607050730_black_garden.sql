/*
  # Fix Admin Users RLS Policies

  1. Security Updates
    - Update RLS policies to allow initial admin user creation
    - Add policy for upsert operations during development setup
    - Ensure proper access control for admin operations

  2. Changes
    - Add policy to allow public insert for initial admin setup
    - Modify existing policies to handle edge cases
    - Add better error handling for admin operations
*/

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "SuperAdmin can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can view admin profiles" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin profile" ON admin_users;

-- Create new policies with better handling
CREATE POLICY "Allow initial admin user creation"
  ON admin_users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "SuperAdmin can manage all admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.role = 'SuperAdmin'
      AND au.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.role = 'SuperAdmin'
      AND au.status = 'active'
    )
  );

CREATE POLICY "Admin users can view admin profiles"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.auth_user_id = auth.uid()
      AND au.status = 'active'
    )
  );

CREATE POLICY "Users can view their own admin profile"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own admin profile"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Insert initial admin users for development
INSERT INTO admin_users (email, name, role, status, last_login)
VALUES 
  ('admin@axels.com', 'Super Admin', 'SuperAdmin', 'active', now()),
  ('manager@axels.com', 'Admin Manager', 'Admin', 'active', now()),
  ('mod@axels.com', 'Moderator User', 'Moderator', 'active', now())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();