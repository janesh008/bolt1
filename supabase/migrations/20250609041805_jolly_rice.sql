/*
  # Add iJewel 3D Viewer URL Support

  1. Database Changes
    - Add `ijewel_url` column to products table (nullable)
    - Store full 3D model viewer links per product

  2. Security
    - Column is nullable - not mandatory for all products
    - URL validation will be handled at application level
*/

-- Add ijewel_url column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'ijewel_url'
  ) THEN
    ALTER TABLE products ADD COLUMN ijewel_url text;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN products.ijewel_url IS 'URL for iJewel.design 3D model viewer integration';