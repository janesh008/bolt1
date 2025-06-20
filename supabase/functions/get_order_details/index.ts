import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    // Get order ID from URL
    const url = new URL(req.url);
    const orderId = url.pathname.split("/").pop();
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
    
    // Check if user is admin or the order belongs to the user
    const isAdmin = await checkIfAdmin(supabase, user.id);
    
    // Get order details
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          products(
            *,
            product_images(*)
          )
        ),
        shipping_addresses(*),
        order_timeline(
          *,
          admin_users(name)
        )
      `)
      .eq("id", orderId);
    
    if (!isAdmin) {
      // If not admin, only allow access to own orders
      query = query.eq("user_id", user.id);
    }
    
    const { data: order, error: orderError } = await query.single();
    
    if (orderError) {
      console.error("Order fetch error:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        order: order
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
    console.error("Error getting order details:", error);
    
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

// Helper function to check if user is admin
async function checkIfAdmin(supabase, userId) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", userId)
    .eq("status", "active")
    .single();
  
  return !error && data;
}