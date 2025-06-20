import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { v4 as uuidv4 } from "npm:uuid@9.0.0";

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
    const { items, shippingAddress } = await req.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!shippingAddress) {
      return new Response(
        JSON.stringify({ error: "Shipping address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Calculate total amount
    let totalAmount = 0;
    
    // Fetch product details and calculate total
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("price")
        .eq("id", item.product_id)
        .single();
      
      if (productError) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      totalAmount += product.price * item.quantity;
    }
    
    // Generate unique order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    
    // Create order in database - now using user_id directly
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id, // Use auth.users.id directly
        order_number: orderNumber,
        status: "pending",
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        payment_status: "pending",
        payment_method: "Razorpay"
      })
      .select("id")
      .single();
    
    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create order items
    const orderItems = [];
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("price, product_name, name")
        .eq("id", item.product_id)
        .single();
      
      if (productError) {
        continue;
      }
      
      orderItems.push({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity
      });
    }
    
    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      
      if (itemsError) {
        console.error("Failed to create order items:", itemsError);
      }
    }
    
    // Create shipping address record
    const { error: shippingError } = await supabase
      .from("shipping_addresses")
      .insert({
        order_id: order.id,
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        address_line1: shippingAddress.address_line1,
        address_line2: shippingAddress.address_line2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        pincode: shippingAddress.pincode
      });
    
    if (shippingError) {
      console.error("Failed to create shipping address:", shippingError);
    }
    
    // Create order timeline entry
    const { error: timelineError } = await supabase
      .from("order_timeline")
      .insert({
        order_id: order.id,
        status: "pending",
        notes: "Order placed"
      });
    
    if (timelineError) {
      console.error("Failed to create order timeline:", timelineError);
    }
    
    // Create Razorpay order
    const razorpayOrderId = `order_${Date.now()}`;
    
    // Update order with Razorpay order ID
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_order_id: razorpayOrderId
      })
      .eq("id", order.id);
    
    if (updateError) {
      console.error("Failed to update order with Razorpay ID:", updateError);
    }
    
    // Get user profile info for the response
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
        orderId: order.id,
        razorpayOrderId: razorpayOrderId,
        amount: totalAmount,
        currency: "INR",
        customer: {
          name: customerName,
          email: customerEmail
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
    console.error("Error creating payment session:", error);
    
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