/*
  # Add unique constraint to customers.user_id

  1. Changes
    - Add unique constraint on customers.user_id column
    - This allows upsert operations with onConflict: 'user_id'
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add unique constraint to user_id column in customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'customers_user_id_key' 
    AND table_name = 'customers'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);
  END IF;
END $$;