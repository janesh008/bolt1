import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_95lpU4BLVjzNkI";
const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "your_test_secret";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("auth_user_id", user.id)
      .eq("status", "active")
      .single();
    
    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse request body
    const { refundId, status, adminNotes } = await req.json();
    
    if (!refundId || !status) {
      return new Response(
        JSON.stringify({ error: "Refund ID and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate status
    if (!['processing', 'completed', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status. Must be processing, completed, or rejected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get refund details
    const { data: refund, error: refundError } = await supabase
      .from("refunds")
      .select("*, orders(*)")
      .eq("id", refundId)
      .single();
    
    if (refundError || !refund) {
      return new Response(
        JSON.stringify({ error: "Refund not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process refund with Razorpay if status is completed
    let razorpayResponse = null;
    if (status === 'completed' && refund.payment_id && refund.payment_method === 'Razorpay') {
      try {
        // Call Razorpay API to process refund
        const response = await fetch(`https://api.razorpay.com/v1/payments/${refund.payment_id}/refund`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
          },
          body: JSON.stringify({
            amount: Math.round(refund.amount * 100), // Amount in paise
            notes: {
              reason: refund.reason || "Customer requested cancellation",
              order_id: refund.order_id,
              refund_id: refund.id
            }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.description || 'Failed to process refund with payment gateway');
        }
        
        razorpayResponse = await response.json();
      } catch (error) {
        console.error("Razorpay refund error:", error);
        return new Response(
          JSON.stringify({ error: `Payment gateway error: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Update refund status
    const { data: updatedRefund, error: updateError } = await supabase
      .from("refunds")
      .update({
        status: status,
        admin_notes: adminNotes || refund.admin_notes,
        processed_by: adminUser.id,
        completed_at: status === 'completed' ? new Date().toISOString() : refund.completed_at
      })
      .eq("id", refundId)
      .select()
      .single();
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update refund status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If completed, update order payment status
    if (status === 'completed') {
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          payment_status: "refunded",
          updated_at: new Date().toISOString()
        })
        .eq("id", refund.order_id);
      
      if (orderError) {
        console.error("Error updating order payment status:", orderError);
      }
      
      // Create payment transaction record for the refund
      if (razorpayResponse) {
        const { error: transactionError } = await supabase
          .from("payment_transactions")
          .insert({
            order_id: refund.order_id,
            razorpay_payment_id: razorpayResponse.id,
            amount: refund.amount,
            currency: "INR",
            status: "refunded",
            payment_method: refund.payment_method,
            gateway_response: razorpayResponse
          });
        
        if (transactionError) {
          console.error("Error creating payment transaction:", transactionError);
        }
      }
    }
    
    // Create status history entry
    const { error: historyError } = await supabase
      .from("refund_status_history")
      .insert({
        refund_id: refundId,
        previous_status: refund.status,
        new_status: status,
        notes: adminNotes || `Refund status updated to ${status} by admin`,
        changed_by: adminUser.id
      });
    
    if (historyError) {
      console.error("Error creating status history:", historyError);
    }
    
    // Create notification for user
    const { error: notificationError } = await supabase
      .from("refund_notifications")
      .insert({
        refund_id: refundId,
        user_id: refund.user_id,
        type: "in_app",
        status: "pending",
        content: status === 'completed' 
          ? `Your refund of ₹${refund.amount} has been processed successfully and will be credited to your original payment method within 3-5 business days.`
          : status === 'processing'
          ? `Your refund request is now being processed. This typically takes 3-5 business days to complete.`
          : `Your refund request has been reviewed. Please contact customer support for more information.`
      });
    
    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Refund status updated to ${status}`,
        refund: updatedRefund,
        paymentGatewayResponse: razorpayResponse
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing refund:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});