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
    
    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: "Order cannot be cancelled at this stage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Initialize refund status
    let refunded = false;
    
    // Process refund if payment was completed
    if (order.payment_status === 'completed' && order.razorpay_payment_id) {
      try {
        // Call Razorpay API to process refund
        const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
          },
          body: JSON.stringify({
            amount: Math.round(order.total_amount * 100), // Amount in paise
            notes: {
              reason: reason || "Customer requested cancellation",
              order_id: order.id,
              order_number: order.order_number
            }
          })
        });
        
        if (refundResponse.ok) {
          const refundData = await refundResponse.json();
          
          // Update payment status to refunded
          await supabase
            .from("orders")
            .update({
              payment_status: "refunded",
              updated_at: new Date().toISOString()
            })
            .eq("id", orderId);
          
          // Create payment transaction record for the refund
          await supabase
            .from("payment_transactions")
            .insert({
              order_id: orderId,
              razorpay_payment_id: order.razorpay_payment_id,
              amount: order.total_amount,
              currency: "INR",
              status: "refunded",
              payment_method: "Razorpay",
              gateway_response: refundData
            });
          
          refunded = true;
        } else {
          console.error("Razorpay refund error:", await refundResponse.text());
        }
      } catch (refundError) {
        console.error("Refund processing error:", refundError);
      }
    }
    
    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create order timeline entry
    const { error: timelineError } = await supabase
      .from("order_timeline")
      .insert({
        order_id: orderId,
        status: "cancelled",
        notes: reason || "Customer requested cancellation"
      });
    
    if (timelineError) {
      console.error("Failed to create order timeline:", timelineError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Order cancelled successfully",
        refunded: refunded
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
    console.error("Error cancelling order:", error);
    
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