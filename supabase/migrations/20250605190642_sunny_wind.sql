/*
  # Fix Customers Table RLS Policies

  1. Changes
    - Add RLS policies for customers table
    - Allow public insert for registration
    - Allow authenticated users to view/update their own data
*/

-- Enable RLS on customers table if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can view their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;

-- Create new policies
CREATE POLICY "Users can insert their own customer data"
  ON customers
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own customer data"
  ON customers
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer data"
  ON customers
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);