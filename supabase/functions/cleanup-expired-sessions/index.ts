// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // This function should be triggered by a cron job
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current date
    const now = new Date().toISOString();
    
    // Find expired sessions (non-favorited sessions past their expiration date)
    const { data: expiredSessions, error: findError } = await supabase
      .from('ai_design_sessions')
      .select('id')
      .eq('is_favorite', false)
      .lt('expires_at', now);
    
    if (findError) {
      throw findError;
    }
    
    if (!expiredSessions || expiredSessions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired sessions to clean up" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
    
    const sessionIds = expiredSessions.map(session => session.id);
    
    // Delete messages from expired sessions
    const { error: messagesError } = await supabase
      .from('ai_messages')
      .delete()
      .in('session_id', sessionIds);
    
    if (messagesError) {
      throw messagesError;
    }
    
    // Delete expired sessions
    const { error: sessionsError } = await supabase
      .from('ai_design_sessions')
      .delete()
      .in('id', sessionIds);
    
    if (sessionsError) {
      throw sessionsError;
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${sessionIds.length} expired sessions` 
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to clean up expired sessions" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});