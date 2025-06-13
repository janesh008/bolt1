/*
  # Products and Product Images Schema Update
  
  1. Schema Changes
    - Drop existing tables with CASCADE to handle dependencies
    - Create products table with product_type field
    - Create product_images table with foreign key relationship
    - Add appropriate indexes and RLS policies
    
  2. Data Population
    - Insert sample products
    - Insert corresponding product images
*/

-- Drop existing tables if they exist (with CASCADE to handle dependencies)
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_type text NOT NULL,
  price decimal NOT NULL,
  metal text NOT NULL,
  tags text[] DEFAULT '{}',
  certification_info jsonb,
  description text NOT NULL,
  availability boolean DEFAULT true,
  model_3d_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Product Images table
CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  image_url text NOT NULL,
  angle text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);

-- Create index for the foreign key
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

-- Insert sample products
INSERT INTO products (name, product_type, price, metal, description, tags) VALUES
('Elegant Diamond Necklace', 'diamond', 2999, 'Gold', 'A stunning diamond necklace with 18K gold setting.', ARRAY['necklace', 'diamond', 'gold']),
('Classic Gold Bracelet', 'gold', 1299, 'Gold', 'Timeless 18K gold bracelet with intricate detailing.', ARRAY['bracelet', 'gold']),
('Diamond Stud Earrings', 'diamond', 899, 'White Gold', 'Brilliant diamond stud earrings set in white gold.', ARRAY['earrings', 'diamond', 'white-gold']),
('Vintage Silver Ring', 'silver', 499, 'Silver', 'Elegant vintage-inspired silver ring with floral pattern.', ARRAY['ring', 'silver', 'vintage']),
('Platinum Engagement Ring', 'platinum', 3499, 'Platinum', 'Exquisite platinum engagement ring with center diamond.', ARRAY['ring', 'platinum', 'engagement']),
('Gold Hoop Earrings', 'gold', 799, 'Gold', 'Classic gold hoop earrings, perfect for any occasion.', ARRAY['earrings', 'gold']);

-- Insert sample product images
INSERT INTO product_images (product_id, image_url, angle) 
SELECT 
  id,
  'https://images.pexels.com/photos/10018318/pexels-photo-10018318.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'front'
FROM products WHERE name = 'Elegant Diamond Necklace';

INSERT INTO product_images (product_id, image_url, angle)
SELECT 
  id,
  'https://images.pexels.com/photos/9953682/pexels-photo-9953682.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'front'
FROM products WHERE name = 'Classic Gold Bracelet';

INSERT INTO product_images (product_id, image_url, angle)
SELECT 
  id,
  'https://images.pexels.com/photos/10922931/pexels-photo-10922931.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'front'
FROM products WHERE name = 'Diamond Stud Earrings';

INSERT INTO product_images (product_id, image_url, angle)
SELECT 
  id,
  'https://images.pexels.com/photos/11144577/pexels-photo-11144577.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'front'
FROM products WHERE name = 'Vintage Silver Ring';

INSERT INTO product_images (product_id, image_url, angle)
SELECT 
  id,
  'https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'front'
FROM products WHERE name = 'Platinum Engagement Ring';

INSERT INTO product_images (product_id, image_url, angle)
SELECT 
  id,
  'https://images.pexels.com/photos/12004392/pexels-photo-12004392.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'front'
FROM products WHERE name = 'Gold Hoop Earrings';