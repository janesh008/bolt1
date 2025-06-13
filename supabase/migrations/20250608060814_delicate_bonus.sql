/*
  # Add storage_path column to product_images table

  1. Changes
    - Add `storage_path` column to `product_images` table to store Supabase Storage file paths
    - This enables proper deletion of image files from storage when products are deleted
    - Column is nullable to support existing records that may not have storage paths

  2. Notes
    - Existing product images without storage paths will need to be re-uploaded
    - This column is essential for proper image lifecycle management
*/

-- Add storage_path column to product_images table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_images' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE product_images ADD COLUMN storage_path text;
  END IF;
END $$;

-- Add index for storage_path for better query performance
CREATE INDEX IF NOT EXISTS idx_product_images_storage_path 
ON product_images(storage_path) 
WHERE storage_path IS NOT NULL;