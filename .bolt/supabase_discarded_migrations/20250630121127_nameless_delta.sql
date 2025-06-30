/*
  # Support Logs Table
  
  1. New Table
    - `support_logs` - Stores interactions with the support AI agent
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `message` (text) - User's message
      - `response` (text) - AI's response
      - `language` (text) - Language used in the interaction
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on the table
    - Add policies for user and admin access
*/

-- Create support_logs table
CREATE TABLE IF NOT EXISTS support_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  response text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_logs_user_id ON support_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_support_logs_created_at ON support_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_support_logs_language ON support_logs(language);

-- Enable RLS
ALTER TABLE support_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own support logs"
  ON support_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all support logs"
  ON support_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "System can insert support logs"
  ON support_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);