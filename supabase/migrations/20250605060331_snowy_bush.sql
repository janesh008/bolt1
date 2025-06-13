/*
  # Fix product images relationship

  1. Changes
    - Add foreign key constraint between product_images and products
    - Update RLS policies for product_images table
  
  2. Security
    - Ensure proper RLS policies are in place
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
  DROP POLICY IF EXISTS "Authenticated users can manage their product images" ON product_images;
END $$;

-- Add the foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_product_images_product_id'
  ) THEN
    ALTER TABLE product_images
      ADD CONSTRAINT fk_product_images_product_id
      FOREIGN KEY (product_id) 
      REFERENCES products(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Anyone can view product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage their product images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);