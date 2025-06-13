-- First, let's create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
BEGIN
  -- Check if the current user exists in admin_users table with active status
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get admin user role
CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM admin_users 
  WHERE admin_users.auth_user_id = auth.uid() 
    AND admin_users.status = 'active';
  
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing product policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Admin users can insert products" ON products;
DROP POLICY IF EXISTS "Admin users can update products" ON products;
DROP POLICY IF EXISTS "Admin users can delete products" ON products;

-- Create new, more permissive policies for development
-- Anyone can view products
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- For development: Allow authenticated users to insert products
-- In production, this should be more restrictive
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- For development: Allow authenticated users to update products
CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- For development: Allow authenticated users to delete products
CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Temporarily drop the foreign key constraint to allow development admin users
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_auth_user_id_fkey;

-- Create admin users without auth_user_id for development
-- These will be linked to real auth users when they sign in
DO $$
BEGIN
  -- Insert or update admin users without auth_user_id for development
  INSERT INTO admin_users (auth_user_id, email, name, role, status, created_at, updated_at)
  VALUES 
    (NULL, 'admin@axels.com', 'Super Admin', 'SuperAdmin', 'active', now(), now()),
    (NULL, 'manager@axels.com', 'Admin Manager', 'Admin', 'active', now(), now()),
    (NULL, 'mod@axels.com', 'Moderator User', 'Moderator', 'active', now(), now())
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = NULL,
    status = 'active',
    updated_at = now();
END $$;

-- Create a more permissive policy for admin_users table for development
DROP POLICY IF EXISTS "Allow admin user operations for development" ON admin_users;
DROP POLICY IF EXISTS "SuperAdmin can manage all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can view admin profiles" ON admin_users;
DROP POLICY IF EXISTS "Users can update their own admin profile" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin profile" ON admin_users;

CREATE POLICY "Allow admin user operations for development"
  ON admin_users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Also ensure categories and metal_colors are accessible
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;

CREATE POLICY "Anyone can view categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can manage categories"
  ON categories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view metal colors" ON metal_colors;
DROP POLICY IF EXISTS "Admin can manage metal colors" ON metal_colors;

CREATE POLICY "Anyone can view metal colors"
  ON metal_colors
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can manage metal colors"
  ON metal_colors
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Also make product_images accessible
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Admin can manage product images" ON product_images;

CREATE POLICY "Anyone can view product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can manage product images"
  ON product_images
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Make product_models accessible
DROP POLICY IF EXISTS "Anyone can view product models" ON product_models;
DROP POLICY IF EXISTS "Admin can manage product models" ON product_models;

CREATE POLICY "Anyone can view product models"
  ON product_models
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can manage product models"
  ON product_models
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);