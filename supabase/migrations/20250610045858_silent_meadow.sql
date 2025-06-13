/*
  # Payment System Enhancement Migration

  1. Functions
    - Add function to safely decrement product stock
    - Add function to generate unique order numbers

  2. Indexes
    - Add performance indexes for orders and order timeline

  3. Sample Data
    - Add sample products with proper required fields
    - Add corresponding product images

  4. Schema Updates
    - Add Razorpay payment fields to orders table
*/

-- Function to decrement product stock safely
CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = GREATEST(0, stock_quantity - quantity),
      updated_at = now()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  order_num text;
  exists_check boolean;
BEGIN
  LOOP
    order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || 
                 upper(substring(md5(random()::text) from 1 for 6));
    
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = order_num) INTO exists_check;
    
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Add performance indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_date ON orders(payment_status, created_at);

-- Add indexes for order timeline
CREATE INDEX IF NOT EXISTS idx_order_timeline_status ON order_timeline(status);
CREATE INDEX IF NOT EXISTS idx_order_timeline_created_by ON order_timeline(created_by);

-- Update existing orders table to ensure compatibility
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS razorpay_order_id text,
ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

-- Add comments for clarity on payment fields
COMMENT ON COLUMN orders.stripe_payment_intent_id IS 'Used for both Stripe Payment Intent ID and Razorpay Order ID';
COMMENT ON COLUMN orders.razorpay_order_id IS 'Razorpay Order ID (alternative storage)';
COMMENT ON COLUMN orders.razorpay_payment_id IS 'Razorpay Payment ID after successful payment';

-- Get a default category for products
DO $$
DECLARE
  default_category_id uuid;
  default_metal_color_id uuid;
BEGIN
  -- Get or create a default category
  SELECT id INTO default_category_id FROM categories WHERE name = 'Ring' LIMIT 1;
  IF default_category_id IS NULL THEN
    INSERT INTO categories (name, description, is_active) 
    VALUES ('Ring', 'Engagement rings, wedding bands, and fashion rings', true)
    RETURNING id INTO default_category_id;
  END IF;

  -- Get or create a default metal color
  SELECT id INTO default_metal_color_id FROM metal_colors WHERE name = 'Gold' LIMIT 1;
  IF default_metal_color_id IS NULL THEN
    INSERT INTO metal_colors (name, hex_color, is_active) 
    VALUES ('Gold', '#FFD700', true)
    RETURNING id INTO default_metal_color_id;
  END IF;

  -- Add sample products with all required fields
  INSERT INTO products (
    product_id, 
    product_name, 
    name, 
    product_type,
    description, 
    price, 
    metal,
    metal_type, 
    category_id,
    metal_color_id,
    availability, 
    stock_quantity,
    featured,
    diamond_weight,
    diamond_piece_count,
    gross_weight,
    net_weight
  ) VALUES 
  (
    'RING-001',
    'Classic Diamond Solitaire Ring',
    'Classic Diamond Solitaire Ring',
    'ring',
    'Elegant 1-carat diamond solitaire ring in 18K white gold setting. Perfect for engagements and special occasions.',
    2999.00,
    'Gold',
    'Gold',
    default_category_id,
    default_metal_color_id,
    true,
    10,
    true,
    1.0,
    1,
    3.5,
    3.2
  ),
  (
    'NECK-001', 
    'Pearl Strand Necklace',
    'Pearl Strand Necklace',
    'necklace',
    'Lustrous freshwater pearl necklace with 18K gold clasp. Timeless elegance for any occasion.',
    1299.00,
    'Gold',
    'Gold',
    default_category_id,
    default_metal_color_id,
    true,
    5,
    true,
    0.0,
    0,
    15.2,
    14.8
  ),
  (
    'EAR-001',
    'Diamond Stud Earrings',
    'Diamond Stud Earrings',
    'earring',
    'Brilliant cut diamond stud earrings in platinum setting. Classic and sophisticated.',
    899.00,
    'Platinum',
    'Platinum',
    default_category_id,
    default_metal_color_id,
    true,
    15,
    false,
    0.5,
    2,
    2.1,
    1.9
  )
  ON CONFLICT (product_id) DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity,
    updated_at = now();

  -- Add sample product images
  INSERT INTO product_images (product_id, image_url, angle)
  SELECT p.id, 'https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=1600', 'front'
  FROM products p WHERE p.product_id = 'RING-001'
  ON CONFLICT DO NOTHING;

  INSERT INTO product_images (product_id, image_url, angle)
  SELECT p.id, 'https://images.pexels.com/photos/10018318/pexels-photo-10018318.jpeg?auto=compress&cs=tinysrgb&w=1600', 'front'
  FROM products p WHERE p.product_id = 'NECK-001'
  ON CONFLICT DO NOTHING;

  INSERT INTO product_images (product_id, image_url, angle)
  SELECT p.id, 'https://images.pexels.com/photos/10922931/pexels-photo-10922931.jpeg?auto=compress&cs=tinysrgb&w=1600', 'front'
  FROM products p WHERE p.product_id = 'EAR-001'
  ON CONFLICT DO NOTHING;
END $$;