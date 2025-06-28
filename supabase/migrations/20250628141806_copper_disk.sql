-- Create ai_video_conversations table
CREATE TABLE IF NOT EXISTS ai_video_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id text NOT NULL,
  conversation_url text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  product_type text,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_video_conversations_user_id ON ai_video_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_video_conversations_conversation_id ON ai_video_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_video_conversations_language ON ai_video_conversations(language);
CREATE INDEX IF NOT EXISTS idx_ai_video_conversations_created_at ON ai_video_conversations(created_at);

-- Enable RLS
ALTER TABLE ai_video_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own video conversations"
  ON ai_video_conversations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own video conversations"
  ON ai_video_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin users can view all video conversations"
  ON ai_video_conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can manage video conversations"
  ON ai_video_conversations
  FOR ALL
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