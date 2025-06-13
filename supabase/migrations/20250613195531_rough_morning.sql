/*
  # Product Videos Table Migration
  
  1. New Tables
    - `product_videos` - Store product video metadata and links
      - Only creates table if it doesn't exist
      - Adds proper indexes and constraints
  
  2. Security
    - Ensures RLS is enabled
    - Adds policies only if they don't already exist
    - Proper error handling with DO blocks
*/

-- Create product_videos table
CREATE TABLE IF NOT EXISTS product_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  storage_path text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_videos_product_id ON product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_storage_path ON product_videos(storage_path) WHERE storage_path IS NOT NULL;

-- Enable RLS
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_videos - check if they exist first
DO $$
BEGIN
  -- Check if the SELECT policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_videos' 
    AND policyname = 'Anyone can view product videos'
  ) THEN
    CREATE POLICY "Anyone can view product videos"
      ON product_videos
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Check if the ALL policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_videos' 
    AND policyname = 'Admin users can manage product videos'
  ) THEN
    CREATE POLICY "Admin users can manage product videos"
      ON product_videos
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
  END IF;
END $$;