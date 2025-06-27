import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    
    // Get token from URL or request body
    const url = new URL(req.url);
    let token = url.searchParams.get("token");
    
    // If token is not in URL, try to get it from request body
    if (!token && req.method === "POST") {
      const body = await req.json();
      token = body.token;
    }
    
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Unsubscribe token is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Update subscriber status
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .update({
        status: "inactive",
        last_updated: new Date().toISOString()
      })
      .eq("unsubscribe_token", token)
      .select("email")
      .single();
    
    if (error) {
      console.error("Error unsubscribing:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "Subscriber not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Log the unsubscribe action
    await supabase
      .from("activity_logs")
      .insert({
        action: "newsletter_unsubscribe",
        details: { email: data.email },
        timestamp: new Date().toISOString()
      })
      .select();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "You have been successfully unsubscribed from our newsletter" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing unsubscribe:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});