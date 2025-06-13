/*
  # Admin System Setup

  1. New Tables
    - `admin_users` - Admin user profiles with roles
    - `roles` - Role definitions
    - `activity_logs` - System activity logging
    - `admin_settings` - System configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Create functions for permission checking

  3. Sample Data
    - Create default roles
    - Add sample admin users
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Moderator',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Create function to check admin permissions
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid() 
    AND status = 'active'
    AND role IN ('SuperAdmin', 'Admin', 'Moderator')
  );
END;
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM admin_users
  WHERE auth_user_id = auth.uid() AND status = 'active';
  
  RETURN COALESCE(user_role, 'User');
END;
$$;

-- RLS Policies for roles
CREATE POLICY "Admin users can view roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- RLS Policies for admin_users
CREATE POLICY "Admin users can view admin profiles"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "SuperAdmin can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid() 
      AND role = 'SuperAdmin' 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view their own admin profile"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- RLS Policies for activity_logs
CREATE POLICY "Admin users can view activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "System can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('SuperAdmin', 'Full system access', '{"all": true}'),
('Admin', 'Administrative access', '{"users": true, "products": true, "orders": true, "settings": true}'),
('Moderator', 'Content moderation', '{"users": "read", "products": true, "orders": "read"}'),
('User', 'Basic user access', '{"profile": true}')
ON CONFLICT (name) DO NOTHING;

-- Insert sample admin users (for development)
INSERT INTO admin_users (email, name, role, status) VALUES
('admin@axels.com', 'Super Administrator', 'SuperAdmin', 'active'),
('manager@axels.com', 'System Manager', 'Admin', 'active'),
('mod@axels.com', 'Content Moderator', 'Moderator', 'active')
ON CONFLICT (email) DO NOTHING;

-- Update users table to include admin fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
ADD COLUMN IF NOT EXISTS role text DEFAULT 'User' CHECK (role IN ('SuperAdmin', 'Admin', 'Moderator', 'User')),
ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();