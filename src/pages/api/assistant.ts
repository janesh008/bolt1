import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ElevenLabs } from 'elevenlabs-node';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_KEY ? 'https://openrouter.ai/api/v1' : undefined,
});

// Initialize ElevenLabs
const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Default to "Rachel"

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
    
    If the user is asking about a specific product or category, indicate this in your response by including a "category" field.
    If the user mentions a budget, include a "budget" field with the amount.
    If the user mentions a style preference, include a "style" field.
    If the user mentions a material preference, include a "material" field.
    
    For example, if a user asks about gold rings under $1000, your response should include:
    category: "ring", budget: 1000, material: "gold"`;
    
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
      model: process.env.OPENROUTER_KEY ? 'openai/gpt-4o-mini-high' : 'gpt-4o',
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
        model_id: 'eleven_monolingual_v1',
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
    
    return NextResponse.json({
      reply,
      audioBase64,
      category,
      budget,
      style,
      material,
      generateVideo
    });
    
  } catch (error) {
    console.error('Assistant API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}