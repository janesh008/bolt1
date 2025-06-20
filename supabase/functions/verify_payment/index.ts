import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
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
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_id 
    } = await req.json();
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify signature
    const generatedSignature = createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    
    const isSignatureValid = generatedSignature === razorpay_signature;
    
    if (!isSignatureValid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Update order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        status: "confirmed",
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", order_id)
      .select("*, user_profiles(*)")
      .single();
    
    if (orderError) {
      console.error("Order update error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to update order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create order timeline entry
    const { error: timelineError } = await supabase
      .from("order_timeline")
      .insert({
        order_id: order_id,
        status: "confirmed",
        notes: "Payment completed successfully"
      });
    
    if (timelineError) {
      console.error("Failed to create order timeline:", timelineError);
    }
    
    // Create payment transaction record
    const { error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        amount: order.total_amount,
        currency: "INR",
        status: "completed",
        payment_method: "Razorpay",
        gateway_response: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        }
      });
    
    if (transactionError) {
      console.error("Failed to create payment transaction:", transactionError);
    }
    
    // Get user profile info
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .single();
    
    const customerName = userProfile?.full_name || user.user_metadata?.full_name || '';
    const customerEmail = userProfile?.email || user.email || '';
    
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          customer: {
            name: customerName,
            email: customerEmail
          }
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
    console.error("Error verifying payment:", error);
    
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