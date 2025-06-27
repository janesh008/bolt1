import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
    
    // Parse request body
    const { orderId, reason } = await req.json();
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id) // Ensure the order belongs to the user
      .single();
    
    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if order is eligible for refund
    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: "This order cannot be refunded at its current status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (order.payment_status !== 'completed') {
      return new Response(
        JSON.stringify({ error: "Only completed payments can be refunded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get payment information
    const { data: payment, error: paymentError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    // Create refund record
    const { data: refund, error: refundError } = await supabase
      .from("refunds")
      .insert({
        order_id: orderId,
        user_id: user.id,
        amount: order.total_amount,
        payment_method: order.payment_method || "Unknown",
        payment_id: order.razorpay_payment_id || order.stripe_payment_intent_id || (payment ? payment.razorpay_payment_id : null),
        reason: reason || "Customer requested cancellation",
        status: "pending"
      })
      .select()
      .single();
    
    if (refundError) {
      console.error("Error creating refund:", refundError);
      return new Response(
        JSON.stringify({ error: "Failed to create refund request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
    
    if (updateError) {
      console.error("Error updating order status:", updateError);
    }
    
    // Create order timeline entry
    const { error: timelineError } = await supabase
      .from("order_timeline")
      .insert({
        order_id: orderId,
        status: "cancelled",
        notes: `Order cancelled and refund requested: ${reason || "Customer requested cancellation"}`
      });
    
    if (timelineError) {
      console.error("Error creating timeline entry:", timelineError);
    }
    
    // Create initial status history entry
    const { error: historyError } = await supabase
      .from("refund_status_history")
      .insert({
        refund_id: refund.id,
        previous_status: null,
        new_status: "pending",
        notes: "Refund request initiated by customer"
      });
    
    if (historyError) {
      console.error("Error creating status history:", historyError);
    }
    
    // Create notification
    const { error: notificationError } = await supabase
      .from("refund_notifications")
      .insert({
        refund_id: refund.id,
        user_id: user.id,
        type: "in_app",
        status: "pending",
        content: "Your refund request has been received and is pending review. You will be notified once it is processed."
      });
    
    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Refund request submitted successfully",
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amount,
          created_at: refund.created_at
        }
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
    console.error("Error processing refund request:", error);
    
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