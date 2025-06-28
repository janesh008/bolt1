/*
  # Create AI Video Conversations Table

  1. New Tables
    - `ai_video_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `conversation_id` (text, unique)
      - `conversation_url` (text)
      - `language` (text)
      - `product_type` (text)
      - `status` (text)
      - `created_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on `ai_video_conversations` table
    - Add policy for users to view their own conversations
*/

-- Create AI Video Conversations table
CREATE TABLE IF NOT EXISTS ai_video_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id text UNIQUE NOT NULL,
  conversation_url text NOT NULL,
  language text NOT NULL,
  product_type text,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_video_conversations_user_id ON ai_video_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_video_conversations_conversation_id ON ai_video_conversations(conversation_id);

-- Enable Row Level Security
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