/*
  # AI Chat History Table
  
  1. New Tables
    - `ai_chat_history` - Stores chat history between users and AI assistant
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - The message content
      - `audio_url` (text) - URL to audio response (for assistant messages)
      - `video_url` (text) - URL to video response (for assistant messages)
      - `products` (jsonb) - Recommended products data
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `ai_chat_history` table
    - Add policies for users to manage their own chat history
*/

-- Create ai_chat_history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  audio_url text,
  video_url text,
  products jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON ai_chat_history(created_at);

-- Enable RLS
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own chat history"
  ON ai_chat_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert into their own chat history"
  ON ai_chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own chat history"
  ON ai_chat_history
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());