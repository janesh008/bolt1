/*
  # Add Product Videos Table

  1. New Tables
    - `product_videos` - Store product video information
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `video_url` (text)
      - `storage_path` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `product_videos` table
    - Add policy for admin access
    - Add policy for public viewing
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

-- Create policies
CREATE POLICY "Anyone can view product videos"
  ON product_videos
  FOR SELECT
  TO public
  USING (true);

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