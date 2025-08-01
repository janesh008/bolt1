/*
  # Create Permissions Table and Fix Role Permissions

  1. New Tables
    - `permissions` - Store available permissions for role-based access control
      - `id` (uuid, primary key)
      - `module` (text) - The module/section this permission applies to
      - `action` (text) - The action allowed by this permission
      - `description` (text) - Human-readable description
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `permissions` table
    - Add policy for admin access
    - Add policy for authenticated users to view permissions

  3. Sample Data
    - Insert basic permissions for common modules
*/

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint on module + action combination
ALTER TABLE permissions ADD CONSTRAINT permissions_module_action_unique UNIQUE (module, action);

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can manage permissions"
  ON permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can view permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert basic permissions
INSERT INTO permissions (module, action, description) VALUES
  ('users', 'view', 'View user information'),
  ('users', 'create', 'Create new users'),
  ('users', 'edit', 'Edit user information'),
  ('users', 'delete', 'Delete users'),
  ('users', 'manage_roles', 'Manage user roles'),
  ('products', 'view', 'View products'),
  ('products', 'create', 'Create new products'),
  ('products', 'edit', 'Edit product information'),
  ('products', 'delete', 'Delete products'),
  ('orders', 'view', 'View orders'),
  ('orders', 'create', 'Create new orders'),
  ('orders', 'edit', 'Edit order information'),
  ('orders', 'delete', 'Delete orders'),
  ('orders', 'manage_status', 'Update order status'),
  ('refunds', 'view', 'View refunds'),
  ('refunds', 'process', 'Process refund requests'),
  ('refunds', 'approve', 'Approve refunds'),
  ('refunds', 'reject', 'Reject refunds'),
  ('analytics', 'view', 'View analytics and reports'),
  ('settings', 'view', 'View system settings'),
  ('settings', 'edit', 'Edit system settings')
ON CONFLICT (module, action) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- Ensure roles table has permissions as JSONB array
DO $$
BEGIN
  -- Check if roles table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'roles'
  ) THEN
    -- Check if permissions column exists and is JSONB
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'roles' AND column_name = 'permissions' AND data_type = 'jsonb'
    ) THEN
      -- Update any NULL permissions to empty array
      UPDATE roles SET permissions = '[]'::jsonb WHERE permissions IS NULL;
    END IF;
  END IF;
END $$;