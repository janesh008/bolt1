/*
  # Disable RLS on Storage Buckets

  1. Changes
    - Disable Row Level Security on storage.buckets table
    - Disable Row Level Security on storage.objects table
    - This allows unrestricted access to storage operations

  2. Security
    - Removes RLS restrictions on storage buckets and objects
    - Allows public read/write access to storage
*/

-- Disable RLS on storage.buckets table
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage.objects table  
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on buckets (if they exist)
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_3" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- Drop any existing policies on buckets table (if they exist)
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated bucket access" ON storage.buckets;