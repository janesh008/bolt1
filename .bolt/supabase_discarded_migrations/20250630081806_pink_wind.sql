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
CREATE POLICY "Admin users can view permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.auth_user_id = auth.uid()
    AND admin_users.status = 'active'
  ));

CREATE POLICY "Admin users can manage permissions"
  ON permissions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.auth_user_id = auth.uid()
    AND admin_users.status = 'active'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.auth_user_id = auth.uid()
    AND admin_users.status = 'active'
  ));

-- Insert sample permissions
INSERT INTO permissions (module, action, description) VALUES
  ('users', 'read', 'View user accounts'),
  ('users', 'create', 'Create new user accounts'),
  ('users', 'update', 'Edit user account details'),
  ('users', 'delete', 'Delete user accounts'),
  ('products', 'read', 'View product catalog'),
  ('products', 'create', 'Add new products'),
  ('products', 'update', 'Edit product details'),
  ('products', 'delete', 'Delete products'),
  ('orders', 'read', 'View customer orders'),
  ('orders', 'update', 'Update order status'),
  ('orders', 'delete', 'Cancel orders'),
  ('refunds', 'read', 'View refund requests'),
  ('refunds', 'update', 'Process refund requests'),
  ('refunds', 'create', 'Create refund requests'),
  ('settings', 'read', 'View application settings'),
  ('settings', 'update', 'Manage application settings'),
  ('analytics', 'read', 'View analytics and reports'),
  ('categories', 'read', 'View product categories'),
  ('categories', 'create', 'Create product categories'),
  ('categories', 'update', 'Edit product categories'),
  ('categories', 'delete', 'Delete product categories');

-- Ensure roles table permissions column is properly typed as text array
DO $$
BEGIN
  -- Check if permissions column exists and alter if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'permissions'
  ) THEN
    -- Ensure it's a text array type
    ALTER TABLE roles ALTER COLUMN permissions TYPE text[] USING 
      CASE 
        WHEN permissions IS NULL THEN '{}'::text[]
        WHEN jsonb_typeof(permissions) = 'array' THEN 
          ARRAY(SELECT jsonb_array_elements_text(permissions))
        ELSE '{}'::text[]
      END;
  END IF;
END $$;