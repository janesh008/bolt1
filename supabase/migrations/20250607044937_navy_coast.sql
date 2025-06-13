/*
  # Create Admin Users

  1. New Admin Users
    - Creates admin user accounts in admin_users table
    - Sets up proper roles and permissions
    - Links to auth.users when they sign up

  2. Security
    - Maintains existing RLS policies
    - Ensures proper role hierarchy

  3. Notes
    - Admin users need to be created in Supabase Auth manually or via API
    - This migration sets up the admin_users records for when they authenticate
*/

-- Insert admin user records (these will be linked when users authenticate)
INSERT INTO admin_users (email, name, role, status) VALUES
  ('admin@axels.com', 'Super Administrator', 'SuperAdmin', 'active'),
  ('manager@axels.com', 'Admin Manager', 'Admin', 'active'),
  ('mod@axels.com', 'Moderator User', 'Moderator', 'active')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

-- Create a function to automatically link admin users when they sign up
CREATE OR REPLACE FUNCTION link_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this email exists in admin_users
  UPDATE admin_users 
  SET auth_user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND auth_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically link admin users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_admin_user();