import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

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
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") || "";
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey || !razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Missing environment variables");
    }

    // Get user from auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { productId } = await req.json();
    
    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get product details
    const { data: product, error: productError } = await adminClient
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create customer
    let customerId;
    const { data: customer, error: customerError } = await adminClient
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (customerError) {
      // Create customer if not exists
      const { data: newCustomer, error: createError } = await adminClient
        .from("customers")
        .insert({
          user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.full_name?.split(" ")[0] || "",
          last_name: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
          phone: user.user_metadata?.phone || "",
          role: "user"
        })
        .select("id")
        .single();

      if (createError) {
        return new Response(
          JSON.stringify({ error: "Failed to create customer" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      customerId = newCustomer.id;
    } else {
      customerId = customer.id;
    }

    // Calculate amount (with tax, etc.)
    const amount = product.price;
    const taxAmount = amount * 0.05; // 5% tax
    const totalAmount = amount + taxAmount;

    // Generate receipt ID
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create Razorpay order
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: "INR",
        receipt: receiptId,
        notes: {
          product_id: productId,
          customer_id: customerId,
          user_id: user.id
        }
      }),
    });

    if (!razorpayResponse.ok) {
      const razorpayError = await razorpayResponse.json();
      console.error("Razorpay error:", razorpayError);
      return new Response(
        JSON.stringify({ error: "Failed to create Razorpay order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpayOrder = await razorpayResponse.json();

    // Create order in database
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        customer_id: customerId,
        order_number: `ORD-${Date.now().toString().substring(7)}`,
        status: "pending",
        total_amount: totalAmount,
        payment_status: "pending",
        payment_method: "Razorpay",
        razorpay_order_id: razorpayOrder.id,
        receipt_id: receiptId,
        amount: amount,
        tax_amount: taxAmount,
        product_id: productId
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

    // Create order item
    const { error: orderItemError } = await adminClient
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: productId,
        quantity: 1,
        unit_price: amount,
        total_price: amount
      });

    if (orderItemError) {
      console.error("Order item creation error:", orderItemError);
      // Continue anyway as the main order is created
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR"
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});