/*
  # Add Sample iJewel URL to Product

  1. Changes
    - Update an existing product with a sample iJewel 3D viewer URL
    - Use PostgreSQL-compatible syntax
    - Properly handle JSONB data type for admin_settings

  2. Notes
    - Adds sample URL to demonstrate 3D viewer functionality
    - Falls back to first product if named product doesn't exist
    - Records the action in admin_settings for tracking
*/

-- Update one of the existing products with a sample iJewel URL
-- Using PostgreSQL-compatible syntax without LIMIT in UPDATE
UPDATE products 
SET ijewel_url = 'https://ijewel.design/profile/shared/6751a4b5e4b0c8a2a8f5d123'
WHERE id = (
  SELECT id FROM products 
  WHERE (name = 'Elegant Diamond Necklace' OR product_name = 'Elegant Diamond Necklace')
  LIMIT 1
);

-- If no product with that name exists, update the first product
DO $$
DECLARE
  first_product_id uuid;
  updated_count integer;
BEGIN
  -- Check if any product was updated in the previous statement
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- If no product was updated, update the first available product
  IF updated_count = 0 THEN
    SELECT id INTO first_product_id FROM products ORDER BY created_at LIMIT 1;
    
    IF first_product_id IS NOT NULL THEN
      UPDATE products 
      SET ijewel_url = 'https://ijewel.design/profile/shared/6751a4b5e4b0c8a2a8f5d123'
      WHERE id = first_product_id;
    END IF;
  END IF;
END $$;

-- Insert a comment to track what was done (properly cast to JSONB)
INSERT INTO admin_settings (key, value) VALUES 
('sample_ijewel_url_added', jsonb_build_object(
  'timestamp', now(),
  'url', 'https://ijewel.design/profile/shared/6751a4b5e4b0c8a2a8f5d123',
  'description', 'Sample iJewel URL added for 3D viewer demonstration'
))
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();