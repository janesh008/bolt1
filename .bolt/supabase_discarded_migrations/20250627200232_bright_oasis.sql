/*
  # Create Permissions and Role Management Tables
  
  1. New Tables
    - `permissions` - System permissions that can be assigned to roles
    - Update `roles` table to include permissions as JSONB array
    
  2. Security
    - Enable RLS on permissions table
    - Add policies for admin access
    
  3. Sample Data
    - Add default permissions for different modules
*/

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  module text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "SuperAdmin can manage permissions"
  ON permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'SuperAdmin'
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.role = 'SuperAdmin'
      AND admin_users.status = 'active'
    )
  );

-- Insert default permissions
INSERT INTO permissions (name, description, module) VALUES
  -- User Management
  ('user.view', 'View user details', 'User Management'),
  ('user.create', 'Create new users', 'User Management'),
  ('user.edit', 'Edit user details', 'User Management'),
  ('user.delete', 'Delete users', 'User Management'),
  
  -- Role Management
  ('role.view', 'View roles and permissions', 'Role Management'),
  ('role.create', 'Create new roles', 'Role Management'),
  ('role.edit', 'Edit roles and permissions', 'Role Management'),
  ('role.delete', 'Delete roles', 'Role Management'),
  
  -- Product Management
  ('product.view', 'View products', 'Product Management'),
  ('product.create', 'Create new products', 'Product Management'),
  ('product.edit', 'Edit product details', 'Product Management'),
  ('product.delete', 'Delete products', 'Product Management'),
  
  -- Order Management
  ('order.view', 'View orders', 'Order Management'),
  ('order.create', 'Create orders', 'Order Management'),
  ('order.edit', 'Edit order details', 'Order Management'),
  ('order.cancel', 'Cancel orders', 'Order Management'),
  
  -- Refund Management
  ('refund.view', 'View refunds', 'Refund Management'),
  ('refund.process', 'Process refunds', 'Refund Management'),
  ('refund.approve', 'Approve refunds', 'Refund Management'),
  ('refund.reject', 'Reject refunds', 'Refund Management'),
  
  -- Customer Support
  ('support.view', 'View support tickets', 'Customer Support'),
  ('support.respond', 'Respond to support tickets', 'Customer Support'),
  ('support.close', 'Close support tickets', 'Customer Support'),
  
  -- Reports
  ('report.view', 'View reports', 'Reports'),
  ('report.export', 'Export reports', 'Reports'),
  
  -- Settings
  ('settings.view', 'View system settings', 'Settings'),
  ('settings.edit', 'Edit system settings', 'Settings')
ON CONFLICT (name) DO NOTHING;

-- Update roles table to include permissions if it doesn't already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE roles ADD COLUMN permissions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Insert default roles with permissions
INSERT INTO roles (name, description, permissions) VALUES
  ('SuperAdmin', 'Full system access and control', (SELECT array_agg(id)::jsonb FROM permissions)),
  ('Admin', 'Administrative access with limited system control', (SELECT array_agg(id)::jsonb FROM permissions WHERE name NOT LIKE 'settings.%' AND name NOT LIKE 'role.%')),
  ('Moderator', 'Content moderation and customer support', (SELECT array_agg(id)::jsonb FROM permissions WHERE module IN ('Product Management', 'Order Management', 'Customer Support') AND name NOT LIKE '%.delete')),
  ('User', 'Regular customer account', '[]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;