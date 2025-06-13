-- First, ensure the order_items table has the correct structure
DO $$
BEGIN
  -- Check if the foreign key constraint exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'order_items_product_id_fkey' 
    AND table_name = 'order_items'
  ) THEN
    -- Add the missing foreign key constraint
    ALTER TABLE order_items 
    ADD CONSTRAINT order_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure order_items has proper RLS policies for admin access
DO $$
BEGIN
  -- Add policy for admin users to manage order items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' 
    AND policyname = 'Admin users can manage order items'
  ) THEN
    CREATE POLICY "Admin users can manage order items"
      ON order_items
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.auth_user_id = auth.uid() 
        AND admin_users.status = 'active'
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.auth_user_id = auth.uid() 
        AND admin_users.status = 'active'
      ));
  END IF;
END $$;

-- Add policy for users to insert their own order items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' 
    AND policyname = 'Users can insert their own order items'
  ) THEN
    CREATE POLICY "Users can insert their own order items"
      ON order_items
      FOR INSERT
      TO public
      WITH CHECK (order_id IN (
        SELECT orders.id FROM orders
        WHERE orders.customer_id IN (
          SELECT customers.id FROM customers
          WHERE customers.user_id = auth.uid()
        )
      ));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);