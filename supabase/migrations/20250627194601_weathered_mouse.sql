/*
  # Create Refunds View for Easier Querying
  
  1. New View
    - `refunds_with_user_info` - Combines refund data with user information
    - Makes it easier to query refunds with user details
    - Simplifies export functionality
    
  2. Benefits
    - Avoids complex joins in application code
    - Provides consistent data structure for refund queries
    - Improves performance for refund listing and exports
*/

-- Create view for refunds with user information
CREATE OR REPLACE VIEW refunds_with_user_info AS
SELECT 
  r.id,
  r.order_id,
  r.user_id,
  r.amount,
  r.payment_method,
  r.payment_id,
  r.reason,
  r.status,
  r.admin_notes,
  r.processed_by,
  r.created_at,
  r.updated_at,
  r.completed_at,
  o.order_number,
  u.full_name,
  u.email,
  a.name AS processed_by_name,
  a.role AS processed_by_role
FROM 
  refunds r
LEFT JOIN 
  orders o ON r.order_id = o.id
LEFT JOIN 
  users u ON r.user_id = u.id
LEFT JOIN 
  admin_users a ON r.processed_by = a.id;

-- Add comment to the view
COMMENT ON VIEW refunds_with_user_info IS 'View that combines refund data with user information for easier querying';