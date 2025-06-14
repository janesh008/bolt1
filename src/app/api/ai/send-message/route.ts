import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schema
const messageSchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1),
  reference_image_url: z.string().url().optional(),
  is_initial: z.boolean().optional(),
  form_data: z.object({
    category: z.string(),
    metal_type: z.string(),
    style: z.string(),
    diamond_type: z.string(),
    description: z.string(),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = messageSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { 
      session_id, 
      message, 
      reference_image_url,
      is_initial,
      form_data
    } = result.data;
    
    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('ai_design_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }
    
    // Save user message to database
    const { error: messageError } = await supabase
      .from('ai_messages')
      .insert([{
        session_id,
        sender: 'user',
        message,
        image_url: reference_image_url,
      }]);
    
    if (messageError) {
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
    
    // Generate AI response
    let aiMessage = '';
    let aiImageUrl = '';
    
    try {
      // Construct system prompt based on session details
      let systemPrompt = `You are an expert jewelry designer specializing in ${session.category} design.`;
      
      if (is_initial && form_data) {
        systemPrompt += `
          The user wants to design a ${form_data.style} ${form_data.category} in ${form_data.metal_type}
          ${form_data.diamond_type !== 'none' ? `with ${form_data.diamond_type} diamonds` : 'without diamonds'}.
          
          Provide a detailed response about how you would design this piece, including:
          1. The overall aesthetic and inspiration
          2. Materials and craftsmanship details
          3. Specific design elements that would make this piece unique
          4. A brief description of how it would look when worn
          
          Be creative, detailed, and professional. Use terminology that shows your expertise in jewelry design.
        `;
      } else {
        systemPrompt += `
          Respond to the user's message in the context of their ${session.category} design in ${session.metal_type}.
          Be helpful, creative, and provide specific design suggestions when appropriate.
        `;
      }
      
      // Get chat history for context
      const { data: chatHistory, error: historyError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true });
      
      if (historyError) {
        throw new Error('Failed to fetch chat history');
      }
      
      // Format chat history for OpenAI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message,
        })),
      ];
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages,
        max_tokens: 1000,
      });
      
      aiMessage = completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      
      // Generate image using DALL-E
      const imagePrompt = `A professional, photorealistic image of a ${session.style} ${session.category} made of ${session.metal_type}${session.diamond_type !== 'none' ? ` with ${session.diamond_type} diamonds` : ''}.`;
      
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });
      
      aiImageUrl = imageResponse.data[0].url || '';
      
      // If we have an image URL, save it to Supabase storage
      if (aiImageUrl) {
        // Fetch the image
        const imageResponse = await fetch(aiImageUrl);
        const imageBlob = await imageResponse.blob();
        
        // Generate a unique filename
        const fileName = `${uuidv4()}.png`;
        const filePath = `ai-generated-designs/${user.id}/${session_id}/${fileName}`;
        
        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('ai-generated-designs')
          .upload(filePath, imageBlob, {
            contentType: 'image/png',
            cacheControl: '3600',
          });
        
        if (uploadError) {
          console.error('Error uploading generated image:', uploadError);
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('ai-generated-designs')
            .getPublicUrl(filePath);
          
          aiImageUrl = publicUrl;
        }
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      aiMessage = 'I apologize, but I encountered an error while generating a response. Please try again.';
    }
    
    // Save AI response to database
    const { error: aiMessageError } = await supabase
      .from('ai_messages')
      .insert([{
        session_id,
        sender: 'assistant',
        message: aiMessage,
        image_url: aiImageUrl,
      }]);
    
    if (aiMessageError) {
      return NextResponse.json({ error: 'Failed to save AI response' }, { status: 500 });
    }
    
    // Update session with last message timestamp
    await supabase
      .from('ai_design_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', session_id);
    
    return NextResponse.json({ 
      success: true, 
      message: aiMessage,
      image_url: aiImageUrl
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}