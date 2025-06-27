import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.22.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  source: z.string().optional(),
  gdprConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to the data privacy policy"
  }),
});

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
    
    // Parse request body
    const body = await req.json();
    
    // Validate request data
    const result = subscribeSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Validation failed", 
          details: result.error.format() 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { email, source = "website", gdprConsent } = result.data;
    
    // Get client IP address for audit purposes
    const clientIp = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, opt_in_confirmed")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking existing subscriber:", checkError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // If subscriber exists and is active, return success but don't duplicate
    if (existingSubscriber && existingSubscriber.status === "active") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "You're already subscribed to our newsletter",
          alreadySubscribed: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // If subscriber exists but is inactive, reactivate
    if (existingSubscriber) {
      const { error: updateError } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "active",
          gdpr_consent: gdprConsent,
          source: source,
          ip_address: clientIp,
          last_updated: new Date().toISOString()
        })
        .eq("id", existingSubscriber.id);
      
      if (updateError) {
        console.error("Error updating subscriber:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Database error" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      // Send confirmation email (in a real implementation)
      // await sendConfirmationEmail(email, existingSubscriber.unsubscribe_token);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Your subscription has been reactivated",
          requiresConfirmation: !existingSubscriber.opt_in_confirmed
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Create new subscriber
    const { data: newSubscriber, error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: email.toLowerCase(),
        source: source,
        gdpr_consent: gdprConsent,
        ip_address: clientIp,
        status: "active", // Will be set to active once confirmed via email
        opt_in_confirmed: false
      })
      .select("id, unsubscribe_token")
      .single();
    
    if (insertError) {
      console.error("Error inserting subscriber:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Send confirmation email (in a real implementation)
    // await sendConfirmationEmail(email, newSubscriber.unsubscribe_token);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Thank you for subscribing! Please check your email to confirm your subscription.",
        requiresConfirmation: true
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing subscription:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});