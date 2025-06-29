/*
  # Support Chat System Migration
  
  1. New Tables
    - `support_chat_logs` - Stores chat history between users and AI assistant
    - `support_alerts` - Stores alerts for unanswered questions
    
  2. Security
    - Enable RLS on all tables
    - Add policies for user and admin access
    
  3. Indexes
    - Add performance indexes for efficient querying
*/

-- Create support_chat_logs table
CREATE TABLE IF NOT EXISTS support_chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  language text NOT NULL DEFAULT 'en',
  message text NOT NULL,
  reply text NOT NULL,
  audio_url text,
  video_url text,
  products jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create support_alerts table
CREATE TABLE IF NOT EXISTS support_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  message text NOT NULL,
  recent_context jsonb,
  is_urgent boolean DEFAULT false,
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_chat_logs_user_id ON support_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_logs_language ON support_chat_logs(language);
CREATE INDEX IF NOT EXISTS idx_support_chat_logs_created_at ON support_chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_support_alerts_user_id ON support_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_support_alerts_is_resolved ON support_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_support_alerts_is_urgent ON support_alerts(is_urgent);
CREATE INDEX IF NOT EXISTS idx_support_alerts_created_at ON support_alerts(created_at);

-- Enable RLS
ALTER TABLE support_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for support_chat_logs
CREATE POLICY "Users can view their own chat logs"
  ON support_chat_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all chat logs"
  ON support_chat_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "System can insert chat logs"
  ON support_chat_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for support_alerts
CREATE POLICY "Admin users can view all alerts"
  ON support_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can update alerts"
  ON support_alerts
  FOR UPDATE
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

CREATE POLICY "System can insert alerts"
  ON support_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to check if a message needs escalation
CREATE OR REPLACE FUNCTION needs_escalation(message text)
RETURNS boolean AS $$
BEGIN
  RETURN (
    message ILIKE '%I''m not sure%' OR
    message ILIKE '%I don''t know%' OR
    message ILIKE '%I am unsure%' OR
    message ILIKE '%cannot help%' OR
    message ILIKE '%unable to assist%' OR
    message ILIKE '%cannot provide%' OR
    message ILIKE '%don''t have enough information%' OR
    message ILIKE '%need more details%' OR
    message ILIKE '%beyond my capabilities%' OR
    message ILIKE '%I apologize%'
  );
END;
$$ LANGUAGE plpgsql;