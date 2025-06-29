import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import axios from "npm:axios@1.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the expected response structure from Tavus API
interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

// Define error response for better error handling
interface TavusErrorResponse {
  error: string;
  message?: string;
  status?: number;
}

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
    const { user_name, product_name, language = 'en' } = await req.json();
    
    // Validate required fields
    if (!user_name || !product_name) {
      console.error('Missing required fields:', { user_name, product_name });
      return new Response(
        JSON.stringify({ error: 'User name and product name are required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check for API key
    const tavusApiKey = Deno.env.get("TAVUS_API_KEY");
    if (!tavusApiKey) {
      console.error('Tavus API key not configured');
      return new Response(
        JSON.stringify({ error: 'Tavus API key not configured' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the replica ID from environment variables or use the provided one
    const replicaId = Deno.env.get("TAVUS_REPLICA_ID") || 'r6ae5b6efc9d';
    
    // Get the persona ID from environment variables
    const personaId = Deno.env.get("TAVUS_PERSONA_ID");
    
    if (!personaId && !replicaId) {
      console.error('Tavus Persona ID not configured');
      return new Response(
        JSON.stringify({ error: 'Tavus persona or replica ID not configured' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (!userError && user) {
        userId = user.id;
      }
    }
    
    // Get greeting message based on language
    let greeting = `Hello ${user_name}, I'm excited to help you find the perfect ${product_name} today!`;
    
    // Translate greeting based on language
    switch (language) {
      case 'hi':
        greeting = `नमस्ते ${user_name}, मुझे आपको आज सही ${product_name} खोजने में मदद करने में खुशी हो रही है!`;
        break;
      case 'gu':
        greeting = `નમસ્તે ${user_name}, મને આજે તમને સંપૂર્ણ ${product_name} શોધવામાં મદદ કરવામાં આનંદ થાય છે!`;
        break;
      case 'ta':
        greeting = `வணக்கம் ${user_name}, இன்று உங்களுக்கு சரியான ${product_name} கண்டுபிடிக்க உதவுவதில் நான் மகிழ்ச்சியடைகிறேன்!`;
        break;
      case 'te':
        greeting = `నమస్కారం ${user_name}, నేడు మీకు సరైన ${product_name} కనుగొనడానికి సహాయం చేయడం నాకు సంతోషంగా ఉంది!`;
        break;
      case 'mr':
        greeting = `नमस्कार ${user_name}, आज आपल्याला योग्य ${product_name} शोधण्यात मदत करण्यात मला आनंद होत आहे!`;
        break;
      case 'bn':
        greeting = `হ্যালো ${user_name}, আজ আপনাকে নিখুঁত ${product_name} খুঁজে পেতে সাহায্য করতে পেরে আমি উত্তেজিত!`;
        break;
      case 'es':
        greeting = `¡Hola ${user_name}, estoy emocionado de ayudarte a encontrar el ${product_name} perfecto hoy!`;
        break;
      case 'fr':
        greeting = `Bonjour ${user_name}, je suis ravi de vous aider à trouver le ${product_name} parfait aujourd'hui !`;
        break;
      case 'ar':
        greeting = `مرحبًا ${user_name}، أنا متحمس لمساعدتك في العثور على ${product_name} المثالي اليوم!`;
        break;
    }
    
    // Call Tavus API to create a real-time conversation
    const requestBody: any = {
      replica_id: replicaId,
      conversation_name: `Jewelry Consultation with ${user_name}`,
      conversational_context: `The user is interested in ${product_name}. Their name is ${user_name}. The conversation is in ${language}.`,
      custom_greeting: greeting
    };
    
    // Add persona_id if available
    if (personaId) {
      requestBody.persona_id = personaId;
    }
    
    console.log('Tavus API request:', {
      url: 'https://tavusapi.com/v2/conversations',
      body: requestBody,
      headers: {
        'Authorization': `Bearer ${tavusApiKey.substring(0, 5)}...`,
        'Content-Type': 'application/json'
      }
    });
    
    // Make the API call with proper error handling
    let conversationData: TavusConversationResponse;
    
    try {
      const response = await axios.post(
        'https://tavusapi.com/v2/conversations',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${tavusApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('Tavus API response:', response.data);
    
      // Extract conversation URL from Tavus response
      conversationData = response.data as TavusConversationResponse;
      
      if (!conversationData || !conversationData.conversation_url) {
        throw new Error('Invalid response from Tavus API - missing conversation URL');
      }
    } catch (apiError: any) {
      console.error('Tavus API error details:', apiError.response?.data || apiError.message);
      throw new Error(apiError.response?.data?.message || apiError.message || 'Tavus API error');
    }
    
    const conversationUrl = conversationData.conversation_url;
    
    if (!conversationUrl) {
      throw new Error('No conversation URL returned from Tavus API');
    }
    
    console.log('Successfully created conversation:', {
      id: conversationData.conversation_id,
      url: conversationUrl,
      status: conversationData.status
    });
    
    // Save conversation data to database if user is authenticated
    if (userId) {
      try {
        await supabase.from('ai_video_conversations').insert({
          user_id: userId,
          conversation_id: conversationData.conversation_id,
          conversation_url: conversationUrl,
          language: language,
          product_type: product_name,
          status: conversationData.status,
          created_at: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Error saving conversation to database:', dbError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        conversationUrl,
        conversationId: conversationData.conversation_id,
        status: conversationData.status
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Tavus conversation API error:', errorMessage);
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create video conversation',
        details: errorMessage,
        fallbackToText: true
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});