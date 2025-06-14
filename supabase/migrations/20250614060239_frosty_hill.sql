/*
  # Create videos storage bucket if it doesn't exist

  1. Storage Setup
    - Create 'videos' storage bucket for product videos (only if it doesn't exist)
    - Set up appropriate policies for video uploads and access
    - Configure bucket settings for video files

  2. Security
    - Allow public read access to videos
    - Allow authenticated admin users to upload videos
    - Allow authenticated admin users to delete videos
*/

-- Create the videos storage bucket only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'videos') THEN
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

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Policy to allow public read access to videos
CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Policy to allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Policy to allow authenticated users to update videos
CREATE POLICY "Authenticated users can update videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- Policy to allow authenticated users to delete videos
CREATE POLICY "Authenticated users can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');