/*
  # Ensure development admin users exist

  1. New Records
    - Insert development admin users if they don't exist
    - Set up proper auth relationships

  2. Security
    - Ensure users have proper roles and status
    - Set up for development environment
*/

-- Insert development admin users if they don't exist
INSERT INTO admin_users (email, name, role, status, created_at, updated_at)
VALUES 
  ('admin@axels.com', 'Super Admin', 'SuperAdmin', 'active', now(), now()),
  ('manager@axels.com', 'Admin Manager', 'Admin', 'active', now(), now()),
  ('mod@axels.com', 'Moderator User', 'Moderator', 'active', now(), now())
ON CONFLICT (email) DO UPDATE SET
  status = 'active',
  updated_at = now();