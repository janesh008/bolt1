import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

interface TavusErrorResponse {
  error: string;
  message?: string;
  status?: number;
}

export async function POST(request: NextRequest) {
  console.info('[TAVUS] Received API request');

  try {
    const body = await request.json();
    const { user_name, product_name } = body;

    console.info('[TAVUS] Request body:', body);

    if (!user_name || !product_name) {
      console.error('[TAVUS] Missing fields:', { user_name, product_name });
      return NextResponse.json(
        { error: 'User name and product name are required' },
        { status: 400 }
      );
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    const replicaId = process.env.TAVUS_REPLICA_ID || 'r6ae5b6efc9d';
    const personaId = process.env.TAVUS_PERSONA_ID;

    if (!tavusApiKey) {
      console.error('[TAVUS] Missing TAVUS_API_KEY in env');
      return NextResponse.json(
        { error: 'Tavus API key not configured' },
        { status: 500 }
      );
    }

    if (!personaId && !replicaId) {
      console.error('[TAVUS] Neither personaId nor replicaId configured');
      return NextResponse.json(
        { error: 'Tavus persona or replica ID not configured' },
        { status: 500 }
      );
    }

    // Construct system prompt based on session details
    let systemPrompt = `You are an expert jewelry designer specializing in ${product_name} design.`;
    
    // Construct request body
    const requestBody: Record<string, any> = {
      replica_id: replicaId,
      conversation_name: `Jewelry Consultation with ${user_name}`,
      conversational_context: `The user is interested in a ${product_name}. Their name is ${user_name}.`,
      custom_greeting: `Hello ${user_name}, I'm excited to help you find the perfect ${product_name} today!`
    };

    if (personaId) {
      requestBody.persona_id = personaId;
    }

    const completion = await axios.post(
      'https://tavusapi.com/v2/conversations',
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": tavusApiKey
        },
      }
    );

    if (!completion.data) {
      throw new Error('No data returned from Tavus API');
    }

    const conversationData = completion.data;

    if (!conversationData.conversation_url) {
      throw new Error('No conversation URL returned from Tavus');
    }

    return NextResponse.json({ 
      conversationUrl: conversationData.conversation_url,
      conversationId: conversationData.conversation_id,
      status: conversationData.status
    });
  } catch (err: any) {
    console.error('[TAVUS] Error generating video:', err);
    return NextResponse.json({ error: err?.message || 'Failed to generate Tavus video' }, { status: 500 });
  }
}