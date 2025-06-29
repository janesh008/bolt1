import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ElevenLabs } from 'elevenlabs-node';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENROUTER_KEY,
  baseURL: import.meta.env.VITE_OPENROUTER_KEY ? 'https://openrouter.ai/api/v1' : undefined,
});

// Initialize ElevenLabs
const elevenlabs = new ElevenLabs({
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
});

const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Default to "Rachel"

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], language = 'en' } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Prepare the system prompt
    const systemPrompt = `You are an expert jewelry consultant for AXELS, a luxury jewelry brand. 
    Help customers find the perfect jewelry pieces based on their preferences, occasions, and budget.
    
    When appropriate, extract these details from the conversation:
    - Jewelry category (rings, necklaces, earrings, bracelets)
    - Budget range
    - Style preferences (modern, classic, vintage)
    - Material preferences (gold, silver, platinum)
    - Occasion (wedding, engagement, gift, everyday)
    
    Keep responses concise, friendly, and helpful. If you recommend products, explain why they would be a good fit.
    
    IMPORTANT: Respond in the same language as the user's message. The current language is: ${language}.`;
    
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
      model: import.meta.env.VITE_OPENROUTER_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const reply = completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response.';
    
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
    
    // Get user ID from auth header if available
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (!userError && user) {
        userId = user.id;
      }
    }
    
    // Log to database if user is authenticated
    if (userId) {
      try {
        await supabase.from('support_chat_logs').insert({
          user_id: userId,
          language,
          message,
          reply,
        });
        
        // Check if message needs escalation
        if (needsEscalation(reply)) {
          // Get recent messages for context
          const recentMessages = history.slice(-3).map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }));
          
          // Create support alert
          await supabase.from('support_alerts').insert({
            user_id: userId,
            message,
            recent_context: recentMessages,
            flagged: true,
          });
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
      }
    }
    
    return NextResponse.json({
      reply,
      audioBase64
    });
    
  } catch (error) {
    console.error('Assistant API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper function to check if a message needs escalation
function needsEscalation(message: string): boolean {
  const escalationPhrases = [
    "I'm not sure",
    "I don't know",
    "I am unsure",
    "cannot help",
    "unable to assist",
    "cannot provide",
    "don't have enough information",
    "need more details",
    "beyond my capabilities",
    "I apologize"
  ];
  
  return escalationPhrases.some(phrase => 
    message.toLowerCase().includes(phrase.toLowerCase())
  );
}