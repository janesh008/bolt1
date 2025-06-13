/*
  # Order Management System Tables

  1. New Tables
    - `shipping_addresses` - Customer shipping addresses for orders
    - `order_timeline` - Track order status changes over time

  2. Updates
    - Add indexes for better performance
    - Add RLS policies for secure access

  3. Security
    - Enable RLS on all tables
    - Add policies for admin access
*/

-- Create shipping_addresses table
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'United States',
  pincode text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create order_timeline table for tracking status changes
CREATE TABLE IF NOT EXISTS order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  timestamp timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_order_id ON shipping_addresses(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_timestamp ON order_timeline(timestamp);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Enable RLS
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipping_addresses
CREATE POLICY "Admin users can view shipping addresses"
  ON shipping_addresses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can manage shipping addresses"
  ON shipping_addresses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- RLS Policies for order_timeline
CREATE POLICY "Admin users can view order timeline"
  ON order_timeline
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can manage order timeline"
  ON order_timeline
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Update existing orders table RLS policies for admin access
CREATE POLICY "Admin users can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Update existing order_items table RLS policies for admin access
CREATE POLICY "Admin users can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Insert sample orders for testing (optional)
DO $$
DECLARE
  sample_customer_id uuid;
  sample_order_id uuid;
BEGIN
  -- Get a sample customer ID (create one if none exists)
  SELECT id INTO sample_customer_id FROM customers LIMIT 1;
  
  IF sample_customer_id IS NULL THEN
    INSERT INTO customers (email, first_name, last_name, phone, role)
    VALUES ('john.doe@example.com', 'John', 'Doe', '1234567890', 'user')
    RETURNING id INTO sample_customer_id;
  END IF;

  -- Insert sample orders
  INSERT INTO orders (customer_id, order_number, status, total_amount, payment_status, payment_method, created_at)
  VALUES 
    (sample_customer_id, 'ORD-2024-001', 'pending', 299.99, 'completed', 'Credit Card', now() - interval '2 days'),
    (sample_customer_id, 'ORD-2024-002', 'processing', 599.99, 'completed', 'PayPal', now() - interval '1 day'),
    (sample_customer_id, 'ORD-2024-003', 'shipped', 199.99, 'completed', 'Credit Card', now() - interval '3 hours')
  ON CONFLICT DO NOTHING;

  -- Insert sample order timeline entries
  SELECT id INTO sample_order_id FROM orders WHERE order_number = 'ORD-2024-001' LIMIT 1;
  
  IF sample_order_id IS NOT NULL THEN
    INSERT INTO order_timeline (order_id, status, timestamp)
    VALUES 
      (sample_order_id, 'pending', now() - interval '2 days'),
      (sample_order_id, 'processing', now() - interval '1 day 12 hours')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;