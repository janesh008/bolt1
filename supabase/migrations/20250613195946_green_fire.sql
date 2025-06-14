-- Create product_videos table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'product_videos'
  ) THEN
    CREATE TABLE product_videos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      video_url text NOT NULL,
      storage_path text,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_videos_product_id'
  ) THEN
    CREATE INDEX idx_product_videos_product_id ON product_videos(product_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_product_videos_storage_path'
  ) THEN
    CREATE INDEX idx_product_videos_storage_path ON product_videos(storage_path) WHERE storage_path IS NOT NULL;
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'product_videos' AND rowsecurity = true
  ) THEN
    ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies only if they don't exist
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