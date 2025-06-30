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
  ('categories', 'delete', 'Delete product categories')
ON CONFLICT (module, action) DO NOTHING;

-- Fix roles table permissions column type using a different approach
-- First, create a temporary function to handle the conversion
CREATE OR REPLACE FUNCTION temp_convert_permissions_to_text_array()
RETURNS void AS $$
DECLARE
  r RECORD;
  perm_array text[];
  perm_item text;
  perm_jsonb jsonb;
BEGIN
  FOR r IN SELECT id, permissions FROM roles
  LOOP
    -- Initialize empty array
    perm_array := '{}'::text[];
    
    -- Skip if permissions is null
    IF r.permissions IS NULL THEN
      UPDATE roles SET permissions = '{}'::jsonb WHERE id = r.id;
      CONTINUE;
    END IF;
    
    -- Handle the conversion based on the type
    IF jsonb_typeof(r.permissions) = 'array' THEN
      -- Process each element in the jsonb array
      FOR i IN 0..jsonb_array_length(r.permissions)-1
      LOOP
        perm_item := r.permissions->i;
        IF perm_item IS NOT NULL THEN
          perm_array := array_append(perm_array, perm_item);
        END IF;
      END LOOP;
      
      -- Update with the new array as jsonb
      -- Fixed syntax error here
      UPDATE roles 
      SET permissions = jsonb_build_array(VARIADIC perm_array)
      WHERE id = r.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT temp_convert_permissions_to_text_array();

-- Drop the temporary function
DROP FUNCTION temp_convert_permissions_to_text_array();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);