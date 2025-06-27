/*
  # Update Users Table for Role-Based Access Control
  
  1. Schema Changes
    - Ensure users table has role and status fields
    - Add last_login tracking
    
  2. Security
    - Update RLS policies for proper role-based access
    
  3. Functionality
    - Track user login activity
    - Support role-based permissions
*/

-- Ensure users table has required fields
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text DEFAULT 'User' CHECK (role IN ('SuperAdmin', 'Admin', 'Moderator', 'User'));
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending'));
  END IF;
  
  -- Add last_login column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Create function to update last_login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_login = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_login on auth.users sign in
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_last_login_on_sign_in'
  ) THEN
    CREATE TRIGGER update_last_login_on_sign_in
      AFTER INSERT ON auth.sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_last_login();
  END IF;
END $$;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(p_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
  v_role_permissions jsonb;
  v_permission_id uuid;
BEGIN
  -- Get current user's role
  SELECT role INTO v_user_role
  FROM users
  WHERE id = auth.uid();
  
  -- SuperAdmin has all permissions
  IF v_user_role = 'SuperAdmin' THEN
    RETURN true;
  END IF;
  
  -- Get permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = p_permission;
  
  IF v_permission_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get role permissions
  SELECT permissions INTO v_role_permissions
  FROM roles
  WHERE name = v_user_role;
  
  -- Check if permission exists in role permissions
  RETURN v_permission_id::text IN (
    SELECT jsonb_array_elements_text(v_role_permissions)
  );
END;
$$;

-- Create initial SuperAdmin user if none exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'SuperAdmin'
  ) THEN
    -- Check if there's an admin user in auth.users
    IF EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'admin@axels.com'
    ) THEN
      -- Get the admin user ID
      INSERT INTO users (
        id,
        full_name,
        email,
        role,
        status,
        created_at
      )
      SELECT
        id,
        'System Administrator',
        'admin@axels.com',
        'SuperAdmin',
        'active',
        now()
      FROM auth.users
      WHERE email = 'admin@axels.com'
      ON CONFLICT (id) DO UPDATE SET
        role = 'SuperAdmin',
        status = 'active';
    END IF;
  END IF;
END $$;