/*
  # Refund Management System
  
  1. New Tables
    - `refunds` - Stores refund information for canceled orders
    - `refund_status_history` - Tracks refund status changes over time
    
  2. Security
    - Enable RLS on all tables
    - Add policies for user and admin access
    
  3. Functions
    - Process refunds
    - Update refund status
    - Send notifications
*/

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  payment_id text,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_notes text,
  processed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create refund_status_history table
CREATE TABLE IF NOT EXISTS refund_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id uuid NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  notes text,
  changed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create refund_notifications table
CREATE TABLE IF NOT EXISTS refund_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id uuid NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'in_app', 'sms')),
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  content text NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create payment_transactions table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at);
CREATE INDEX IF NOT EXISTS idx_refund_status_history_refund_id ON refund_status_history(refund_id);
CREATE INDEX IF NOT EXISTS idx_refund_notifications_refund_id ON refund_notifications(refund_id);
CREATE INDEX IF NOT EXISTS idx_refund_notifications_user_id ON refund_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);

-- Enable RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for refunds
CREATE POLICY "Users can view their own refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can manage refunds"
  ON refunds
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

-- Create policies for refund_status_history
CREATE POLICY "Users can view their own refund status history"
  ON refund_status_history
  FOR SELECT
  TO authenticated
  USING (
    refund_id IN (
      SELECT id FROM refunds WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can view all refund status history"
  ON refund_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can manage refund status history"
  ON refund_status_history
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

-- Create policies for refund_notifications
CREATE POLICY "Users can view their own refund notifications"
  ON refund_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all refund notifications"
  ON refund_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can manage refund notifications"
  ON refund_notifications
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

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_refund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION log_refund_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO refund_status_history (
      refund_id,
      previous_status,
      new_status,
      notes,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      CASE 
        WHEN NEW.status = 'completed' THEN 'Refund processed successfully'
        WHEN NEW.status = 'processing' THEN 'Refund is being processed'
        WHEN NEW.status = 'rejected' THEN 'Refund request was rejected'
        ELSE NULL
      END,
      NEW.processed_by
    );
    
    -- If status is completed, update completed_at timestamp
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at = now();
    END IF;
    
    -- Create notification for user
    INSERT INTO refund_notifications (
      refund_id,
      user_id,
      type,
      status,
      content
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'in_app',
      'pending',
      CASE 
        WHEN NEW.status = 'pending' THEN 'Your refund request has been received and is pending review.'
        WHEN NEW.status = 'processing' THEN 'Your refund is now being processed. This typically takes 3-5 business days.'
        WHEN NEW.status = 'completed' THEN 'Your refund has been processed successfully and should appear in your account within 1-3 business days.'
        WHEN NEW.status = 'rejected' THEN 'Your refund request has been rejected. Please contact customer support for more information.'
        ELSE 'Your refund status has been updated.'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_refund_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_refund_updated_at();

CREATE TRIGGER log_refund_status_change
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION log_refund_status_change();

-- Create function to request a refund
CREATE OR REPLACE FUNCTION request_refund(
  p_order_id uuid,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order record;
  v_payment record;
  v_refund_id uuid;
BEGIN
  -- Check if order exists and belongs to the current user
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  AND user_id = auth.uid();
  
  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found or does not belong to the current user';
  END IF;
  
  -- Check if order is eligible for refund (not already refunded or canceled)
  IF v_order.status = 'cancelled' AND v_order.payment_status = 'refunded' THEN
    RAISE EXCEPTION 'This order has already been refunded';
  END IF;
  
  -- Get payment information
  SELECT * INTO v_payment
  FROM payment_transactions
  WHERE order_id = p_order_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Create refund record
  INSERT INTO refunds (
    order_id,
    user_id,
    amount,
    payment_method,
    payment_id,
    reason,
    status
  ) VALUES (
    p_order_id,
    auth.uid(),
    v_order.total_amount,
    COALESCE(v_order.payment_method, 'Unknown'),
    COALESCE(v_order.razorpay_payment_id, v_order.stripe_payment_intent_id, v_payment.razorpay_payment_id, NULL),
    p_reason,
    'pending'
  ) RETURNING id INTO v_refund_id;
  
  -- Update order status
  UPDATE orders
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_order_id;
  
  -- Create order timeline entry
  INSERT INTO order_timeline (
    order_id,
    status,
    notes
  ) VALUES (
    p_order_id,
    'cancelled',
    'Order cancelled and refund requested: ' || p_reason
  );
  
  -- Create initial status history entry
  INSERT INTO refund_status_history (
    refund_id,
    previous_status,
    new_status,
    notes
  ) VALUES (
    v_refund_id,
    NULL,
    'pending',
    'Refund request initiated by customer'
  );
  
  -- Create notification
  INSERT INTO refund_notifications (
    refund_id,
    user_id,
    type,
    status,
    content
  ) VALUES (
    v_refund_id,
    auth.uid(),
    'in_app',
    'pending',
    'Your refund request has been received and is pending review. You will be notified once it is processed.'
  );
  
  RETURN v_refund_id;
END;
$$;

-- Create function to process a refund (admin only)
CREATE OR REPLACE FUNCTION process_refund(
  p_refund_id uuid,
  p_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refund record;
  v_admin_id uuid;
BEGIN
  -- Check if user is admin
  SELECT id INTO v_admin_id
  FROM admin_users
  WHERE auth_user_id = auth.uid()
  AND status = 'active';
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only administrators can process refunds';
  END IF;
  
  -- Check if refund exists
  SELECT * INTO v_refund
  FROM refunds
  WHERE id = p_refund_id;
  
  IF v_refund IS NULL THEN
    RAISE EXCEPTION 'Refund not found';
  END IF;
  
  -- Check if status is valid
  IF p_status NOT IN ('processing', 'completed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be processing, completed, or rejected';
  END IF;
  
  -- Update refund
  UPDATE refunds
  SET 
    status = p_status,
    admin_notes = CASE WHEN p_admin_notes IS NOT NULL THEN p_admin_notes ELSE admin_notes END,
    processed_by = v_admin_id,
    completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE completed_at END
  WHERE id = p_refund_id;
  
  -- If completed, update order payment status
  IF p_status = 'completed' THEN
    UPDATE orders
    SET 
      payment_status = 'refunded',
      updated_at = now()
    WHERE id = v_refund.order_id;
  END IF;
  
  RETURN true;
END;
$$;