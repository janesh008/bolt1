/*
  # Remove Customers Table and Use Auth.Users Directly
  
  1. Schema Changes
    - Add user_id column to orders table
    - Update foreign key constraints to reference auth.users directly
    - Create migration path for existing data
    - Add RLS policies for direct user access
    
  2. Data Migration
    - Move customer data to user_profiles if needed
    - Update existing orders to reference auth.users directly
    
  3. Security
    - Update RLS policies to work with direct user references
    - Ensure proper access control for orders
*/

-- Step 1: Add user_id column to orders table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 2: Create index for user_id
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Step 3: Migrate data from customer_id to user_id
UPDATE orders o
SET user_id = c.user_id
FROM customers c
WHERE o.customer_id = c.id
AND o.user_id IS NULL
AND c.user_id IS NOT NULL;

-- Step 4: Update RLS policies for orders
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Admin users can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin users can manage orders" ON orders;

-- Create new policies using user_id directly
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

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

-- Step 5: Update order_items policies
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;

CREATE POLICY "Users can view their own order items"
  ON order_items
  FOR SELECT
  TO public
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Step 6: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 7: Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

-- Step 9: Migrate data from customers to user_profiles
INSERT INTO user_profiles (user_id, full_name, phone, email)
SELECT 
  c.user_id,
  COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') as full_name,
  c.phone,
  c.email
FROM customers c
WHERE c.user_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email;

-- Step 10: Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Step 11: Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 12: Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 13: Create payment_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_payment_id varchar(100),
  razorpay_order_id varchar(100),
  amount numeric(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'INR',
  status varchar(50),
  payment_method varchar(50),
  gateway_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- Step 14: Create indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(razorpay_payment_id);