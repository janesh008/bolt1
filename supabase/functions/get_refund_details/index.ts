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
    // Get refund ID from URL
    const url = new URL(req.url);
    const refundId = url.pathname.split("/").pop();
    
    if (!refundId) {
      return new Response(
        JSON.stringify({ error: "Refund ID is required" }),
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
    
    // Check if user is admin
    const isAdmin = await checkIfAdmin(supabase, user.id);
    
    // Get refund details
    let query = supabase
      .from("refunds")
      .select(`
        *,
        orders(*),
        user_profiles(
          full_name,
          email
        ),
        refund_status_history(
          *,
          users(name)
        ),
        refund_notifications(*)
      `)
      .eq("id", refundId);
    
    if (!isAdmin) {
      // If not admin, only allow access to own refunds
      query = query.eq("user_id", user.id);
    }
    
    const { data: refund, error: refundError } = await query.single();
    
    if (refundError) {
      console.error("Refund fetch error:", refundError);
      return new Response(
        JSON.stringify({ error: "Refund not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get admin user who processed the refund (if any)
    let processedBy = null;
    if (refund.processed_by) {
      const { data: admin } = await supabase
        .from("admin_users")
        .select("name, role")
        .eq("id", refund.processed_by)
        .single();
      
      processedBy = admin;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        refund: {
          ...refund,
          processed_by: processedBy
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
    console.error("Error getting refund details:", error);
    
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