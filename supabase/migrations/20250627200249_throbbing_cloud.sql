/*
  # Create Activity Logs Table
  
  1. New Tables
    - `activity_logs` - Track user actions for audit purposes
    
  2. Security
    - Enable RLS on activity_logs table
    - Add policies for admin access
    
  3. Functionality
    - Store user actions with timestamps
    - Include details of each action
*/

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Get current admin user ID
  SELECT id INTO v_admin_id
  FROM admin_users
  WHERE auth_user_id = auth.uid()
  AND status = 'active';
  
  IF v_admin_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Insert activity log
  INSERT INTO activity_logs (
    user_id,
    action,
    details,
    timestamp
  ) VALUES (
    v_admin_id,
    p_action,
    p_details,
    now()
  );
END;
$$;