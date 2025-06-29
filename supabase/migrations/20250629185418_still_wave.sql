/*
  # Create permissions table and update roles

  1. New Tables
    - `permissions`
      - `id` (uuid, primary key)
      - `module` (text, e.g., 'users', 'products', 'orders')
      - `action` (text, e.g., 'create', 'read', 'update', 'delete')
      - `description` (text, description of the permission)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `permissions` table
    - Add policy for admin users to manage permissions
    - Add policy for authenticated users to view permissions

  3. Data
    - Insert basic permissions for common modules
    - Update roles table to ensure permissions column is jsonb array
*/

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

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
      WHERE admin_users.auth_user_id = uid() 
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = uid() 
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can view permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure roles table has proper permissions column
DO $$
BEGIN
  -- Check if permissions column exists and update its type if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' AND column_name = 'permissions'
  ) THEN
    -- Update existing permissions column to be jsonb array
    ALTER TABLE roles ALTER COLUMN permissions TYPE jsonb USING 
      CASE 
        WHEN permissions IS NULL THEN '[]'::jsonb
        WHEN jsonb_typeof(permissions) = 'array' THEN permissions
        ELSE '[]'::jsonb
      END;
    
    -- Set default value
    ALTER TABLE roles ALTER COLUMN permissions SET DEFAULT '[]'::jsonb;
  ELSE
    -- Add permissions column if it doesn't exist
    ALTER TABLE roles ADD COLUMN permissions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Insert basic permissions
INSERT INTO permissions (module, action, description) VALUES
  -- User management permissions
  ('users', 'create', 'Create new users'),
  ('users', 'read', 'View user information'),
  ('users', 'update', 'Update user information'),
  ('users', 'delete', 'Delete users'),
  
  -- Product management permissions
  ('products', 'create', 'Create new products'),
  ('products', 'read', 'View product information'),
  ('products', 'update', 'Update product information'),
  ('products', 'delete', 'Delete products'),
  
  -- Order management permissions
  ('orders', 'create', 'Create new orders'),
  ('orders', 'read', 'View order information'),
  ('orders', 'update', 'Update order status and information'),
  ('orders', 'delete', 'Delete orders'),
  
  -- Category management permissions
  ('categories', 'create', 'Create new categories'),
  ('categories', 'read', 'View category information'),
  ('categories', 'update', 'Update category information'),
  ('categories', 'delete', 'Delete categories'),
  
  -- Admin settings permissions
  ('settings', 'read', 'View system settings'),
  ('settings', 'update', 'Update system settings'),
  
  -- Analytics permissions
  ('analytics', 'read', 'View analytics and reports'),
  
  -- Refund management permissions
  ('refunds', 'create', 'Process refund requests'),
  ('refunds', 'read', 'View refund information'),
  ('refunds', 'update', 'Update refund status'),
  ('refunds', 'delete', 'Delete refund records')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions(module, action);