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
    const { message, history = [], language = 'en' } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    
    // Prepare the system prompt based on language
    const systemPrompt = `You are an expert jewelry consultant for AXELS, a luxury jewelry brand. 
    Help customers find the perfect jewelry pieces based on their preferences, occasions, and budget.
    
    When appropriate, extract these details from the conversation:
    - Jewelry category (rings, necklaces, earrings, bracelets)
    - Budget range
    - Style preferences (modern, classic, vintage)
    - Material preferences (gold, silver, platinum)
    - Occasion (wedding, engagement, gift, everyday)
    
    Keep responses concise, friendly, and helpful. If you recommend products, explain why they would be a good fit.
    
    IMPORTANT: Respond in the same language as the user's message. The current language is: ${language}.
    
    If the user is asking about a specific product or category, indicate this in your response by including a "category" field.
    If the user mentions a budget, include a "budget" field with the amount.
    If the user mentions a style preference, include a "style" field.
    If the user mentions a material preference, include a "material" field.`;
    
    // Format conversation history for the API
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Add system message at the beginning
    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message }
    ];
    
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: Deno.env.get("OPENROUTER_KEY") ? 'openai/gpt-4o-mini-high' : 'gpt-4o',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const reply = completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response.';
    
    // Parse the response for product recommendation parameters
    let category = null;
    let budget = null;
    let style = null;
    let material = null;
    let generateVideo = false;
    
    // Check for category mentions
    if (reply.toLowerCase().includes('ring') || message.toLowerCase().includes('ring')) {
      category = 'ring';
    } else if (reply.toLowerCase().includes('necklace') || message.toLowerCase().includes('necklace')) {
      category = 'necklace';
    } else if (reply.toLowerCase().includes('bracelet') || message.toLowerCase().includes('bracelet')) {
      category = 'bracelet';
    } else if (reply.toLowerCase().includes('earring') || message.toLowerCase().includes('earring')) {
      category = 'earring';
    }
    
    // Check for budget mentions
    const budgetMatch = reply.match(/\$(\d+,?\d*)/);
    if (budgetMatch) {
      budget = parseInt(budgetMatch[1].replace(',', ''));
    }
    
    // Check for style mentions
    if (reply.toLowerCase().includes('modern')) {
      style = 'modern';
    } else if (reply.toLowerCase().includes('classic')) {
      style = 'classic';
    } else if (reply.toLowerCase().includes('vintage')) {
      style = 'vintage';
    }
    
    // Check for material mentions
    if (reply.toLowerCase().includes('gold')) {
      material = 'gold';
    } else if (reply.toLowerCase().includes('silver')) {
      material = 'silver';
    } else if (reply.toLowerCase().includes('platinum')) {
      material = 'platinum';
    }
    
    // Determine if we should generate a video (for high-value recommendations)
    if (budget && budget > 1000 && category) {
      generateVideo = true;
    }
    
    // Generate audio response using ElevenLabs
    let audioBase64 = '';
    try {
      const audioResponse = await elevenlabs.textToSpeech({
        voice_id: VOICE_ID,
        text: reply,
        model_id: 'eleven_multilingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      });
      
      // Convert audio buffer to base64
      audioBase64 = Buffer.from(audioResponse).toString('base64');
    } catch (error) {
      console.error('Error generating audio:', error);
    }
    
    // Save chat message to database if user is authenticated
    if (userId) {
      try {
        await supabase.from('ai_chat_history').insert({
          user_id: userId,
          role: 'user',
          content: message,
          created_at: new Date().toISOString()
        });
        
        await supabase.from('ai_chat_history').insert({
          user_id: userId,
          role: 'assistant',
          content: reply,
          audio_url: audioBase64 ? 'audio_generated' : null,
          created_at: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Error saving chat history:', dbError);
      }
    }
    
    // Get product recommendations if applicable
    let products = [];
    if (category || budget || style || material) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            product_name,
            name,
            price,
            description,
            product_images (
              image_url
            )
          `)
          .eq('availability', true)
          .limit(5);
        
        if (!error && data) {
          products = data.map(product => ({
            id: product.id,
            name: product.product_name || product.name,
            price: product.price,
            image: product.product_images?.[0]?.image_url || 'https://images.pexels.com/photos/10018318/pexels-photo-10018318.jpeg',
            description: product.description
          }));
        }
      } catch (dbError) {
        console.error('Error fetching product recommendations:', dbError);
      }
    }
    
    return new Response(
      JSON.stringify({
        reply,
        audioBase64,
        category,
        budget,
        style,
        material,
        generateVideo,
        products
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Assistant API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});