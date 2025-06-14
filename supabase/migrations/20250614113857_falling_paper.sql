/*
  # AI Jewelry Designer Schema

  1. New Tables
    - `ai_design_sessions` - Stores user design sessions
    - `ai_messages` - Stores messages in each design session
  
  2. Storage Buckets
    - `design-references` - For user-uploaded reference images
    - `ai-generated-designs` - For AI-generated design images
  
  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create ai_design_sessions table
CREATE TABLE IF NOT EXISTS ai_design_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  metal_type TEXT NOT NULL,
  style TEXT NOT NULL,
  diamond_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  title TEXT
);

-- Create ai_messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_design_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_design_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_design_sessions
CREATE POLICY "Users can view their own design sessions"
  ON ai_design_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own design sessions"
  ON ai_design_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own design sessions"
  ON ai_design_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own design sessions"
  ON ai_design_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for ai_messages
CREATE POLICY "Users can view messages in their own sessions"
  ON ai_messages
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM ai_design_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their own sessions"
  ON ai_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM ai_design_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their own sessions"
  ON ai_messages
  FOR DELETE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM ai_design_sessions WHERE user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX idx_ai_design_sessions_user_id ON ai_design_sessions(user_id);
CREATE INDEX idx_ai_design_sessions_is_favorite ON ai_design_sessions(is_favorite);
CREATE INDEX idx_ai_design_sessions_expires_at ON ai_design_sessions(expires_at);
CREATE INDEX idx_ai_messages_session_id ON ai_messages(session_id);