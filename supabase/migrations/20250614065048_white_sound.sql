/*
  # Fix Videos Storage Bucket Policies
  
  1. Changes
    - Check if videos bucket exists before creating
    - Only create policies if they don't already exist
    - Use proper error handling with DO blocks
  
  2. Security
    - Maintain same security policies as before
    - Ensure proper access control for videos
*/

-- Check if bucket exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'videos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'videos',
      'videos',
      true,
      104857600, -- 100MB limit
      ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    );
  END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Check if the SELECT policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public can view videos'
  ) THEN
    CREATE POLICY "Public can view videos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'videos');
  END IF;

  -- Check if the INSERT policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can upload videos'
  ) THEN
    CREATE POLICY "Authenticated users can upload videos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'videos');
  END IF;

  -- Check if the UPDATE policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can update videos'
  ) THEN
    CREATE POLICY "Authenticated users can update videos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'videos')
    WITH CHECK (bucket_id = 'videos');
  END IF;

  -- Check if the DELETE policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can delete videos'
  ) THEN
    CREATE POLICY "Authenticated users can delete videos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'videos');
  END IF;
END $$;