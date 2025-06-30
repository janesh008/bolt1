import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4.28.0";
import { ElevenLabs } from "npm:elevenlabs-node@1.2.0";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENROUTER_KEY") || Deno.env.get("OPENAI_API_KEY"),
  baseURL: Deno.env.get("OPENROUTER_KEY") ? 'https://openrouter.ai/api/v1' : undefined,
});

// Initialize ElevenLabs
const elevenlabs = new ElevenLabs({
  apiKey: Deno.env.get("ELEVENLABS_API_KEY") || '',
});

const VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID") || 'pNInz6obpgDQGcFmaJgB'; // Default to "Rachel"

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { message, language = 'en' } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get user profile - use maybeSingle() to avoid errors if no profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const userName = userProfile?.full_name || user.user_metadata?.full_name || 'Customer';
    
    // Get user's latest order - use maybeSingle() to avoid errors if no orders exist
    const { data: latestOrder, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            *
          )
        ),
        shipping_addresses(*),
        order_timeline(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Prepare the system prompt
    const systemPrompt = `You are a helpful customer support agent for AXELS, a luxury jewelry brand. 
    Your role is to assist customers with post-purchase issues like order status, shipping delays, returns, and refunds.
    
    Customer Information:
    - Name: ${userName}
    - Email: ${user.email}
    
    ${latestOrder ? `
    Latest Order Information:
    - Order Number: ${latestOrder.order_number}
    - Order Date: ${new Date(latestOrder.created_at).toLocaleDateString()}
    - Status: ${latestOrder.status}
    - Payment Status: ${latestOrder.payment_status}
    - Items: ${latestOrder.order_items?.map((item: any) => 
      `${item.quantity}x ${item.products?.product_name || item.products?.name || 'Product'}`
    ).join(', ') || 'No items found'}
    - Shipping Address: ${latestOrder.shipping_addresses?.[0] ? 
      `${latestOrder.shipping_addresses[0].name}, ${latestOrder.shipping_addresses[0].address_line1}, ${latestOrder.shipping_addresses[0].city}, ${latestOrder.shipping_addresses[0].state}, ${latestOrder.shipping_addresses[0].pincode}` : 
      'No shipping address found'}
    ` : 'No orders found for this customer.'}
    
    Be helpful, concise, and empathetic. If you don't know the answer to a question, suggest contacting customer service via phone or email.
    
    IMPORTANT: Respond in the same language as the user's message. The current language is: ${language}.`;
    
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: Deno.env.get("OPENROUTER_KEY") ? 'openai/gpt-4o-mini' : 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const reply = completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response.';
    
    // Generate audio response using ElevenLabs
    let audioUrl = '';
    try {
      if (Deno.env.get("ELEVENLABS_API_KEY")) {
        const audioResponse = await elevenlabs.textToSpeech({
          voice_id: VOICE_ID,
          text: reply,
          model_id: 'eleven_multilingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        });
        
        // Convert audio buffer to base64 using Deno-compatible method
        const audioArray = new Uint8Array(audioResponse);
        const audioBase64 = btoa(String.fromCharCode(...audioArray));
        
        // Create a data URL for the audio
        audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      // Continue without audio if there's an error
    }
    
    // Log the interaction - use insert with error handling
    try {
      await supabase.from('support_logs').insert({
        user_id: user.id,
        message,
        response: reply,
        language,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging support interaction:', logError);
      // Continue without logging if there's an error
    }
    
    return new Response(
      JSON.stringify({
        text: reply,
        audioUrl
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
    console.error('Support agent error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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