/*
  # Create Storage Buckets for Product Media

  1. New Buckets
    - `images` - For product images
    - `videos` - For product videos
  
  2. Security
    - Public access for viewing
    - RLS policies for uploads and deletions
*/

-- Create images bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'images',
    'images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create videos bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'videos',
    'videos',
    true,
    104857600, -- 100MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[]
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create RLS policies for images bucket
DO $$
BEGIN
  -- Allow public read access to images
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES (
    'Public Read Access',
    'images',
    '(bucket_id = ''images''::text)'
  )
  ON CONFLICT (name, bucket_id) DO NOTHING;

  -- Allow authenticated users to upload images
  INSERT INTO storage.policies (name, bucket_id, definition, operation)
  VALUES (
    'Authenticated Users Can Upload',
    'images',
    '(bucket_id = ''images''::text AND auth.role() = ''authenticated''::text)',
    'INSERT'
  )
  ON CONFLICT (name, bucket_id) DO NOTHING;

  -- Allow authenticated users to delete their own images
  INSERT INTO storage.policies (name, bucket_id, definition, operation)
  VALUES (
    'Authenticated Users Can Delete',
    'images',
    '(bucket_id = ''images''::text AND auth.role() = ''authenticated''::text)',
    'DELETE'
  )
  ON CONFLICT (name, bucket_id) DO NOTHING;
END $$;

-- Create RLS policies for videos bucket
DO $$
BEGIN
  -- Allow public read access to videos
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES (
    'Public Read Access',
    'videos',
    '(bucket_id = ''videos''::text)'
  )
  ON CONFLICT (name, bucket_id) DO NOTHING;

  -- Allow authenticated users to upload videos
  INSERT INTO storage.policies (name, bucket_id, definition, operation)
  VALUES (
    'Authenticated Users Can Upload',
    'videos',
    '(bucket_id = ''videos''::text AND auth.role() = ''authenticated''::text)',
    'INSERT'
  )
  ON CONFLICT (name, bucket_id) DO NOTHING;

  -- Allow authenticated users to delete their own videos
  INSERT INTO storage.policies (name, bucket_id, definition, operation)
  VALUES (
    'Authenticated Users Can Delete',
    'videos',
    '(bucket_id = ''videos''::text AND auth.role() = ''authenticated''::text)',
    'DELETE'
  )
  ON CONFLICT (name, bucket_id) DO NOTHING;
END $$;