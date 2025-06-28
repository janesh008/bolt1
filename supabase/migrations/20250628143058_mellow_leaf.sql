/*
  # Create AI Chat History Table

  1. New Tables
    - `ai_chat_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, 'user' or 'assistant')
      - `content` (text)
      - `audio_url` (text, optional)
      - `video_url` (text, optional)
      - `products` (jsonb, optional)
      - `created_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on `ai_chat_history` table
    - Add policies for users to manage their own chat history
*/

-- Create AI Chat History table
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  audio_url text,
  video_url text,
  products jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON ai_chat_history(created_at);

-- Enable Row Level Security
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