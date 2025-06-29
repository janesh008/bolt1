import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export async function POST(req: NextRequest) {
  console.info('[TAVUS] Received API request');

  try {
    const body = await req.json();
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

    const requestBody: Record<string, any> = {
      replica_id: replicaId,
      conversation_name: `Jewelry Consultation with ${user_name}`,
      conversational_context: `The user is interested in a ${product_name}. Their name is ${user_name}.`,
      custom_greeting: `Hello ${user_name}, I'm excited to help you find the perfect ${product_name} today!`
    };

    if (personaId) {
      requestBody.persona_id = personaId;
    }

    console.info('[TAVUS] Making API call to Tavus...', {
      endpoint: 'https://tavusapi.com/v2/conversations',
      requestBody,
      headersPreview: {
        Authorization: `Bearer ${tavusApiKey?.substring(0, 5)}...`,
        'Content-Type': 'application/json'
      }
    });

    let conversationData: TavusConversationResponse;

    try {
      const response = await axios.post(
        'https://tavusapi.com/v2/conversations',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${tavusApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.info('[TAVUS] Raw Tavus response:', response.data);

      conversationData = response.data;

      if (!conversationData?.conversation_url) {
        throw new Error('Tavus API response missing conversation_url');
      }
    } catch (apiError: any) {
      console.error('[TAVUS] Tavus API error:', apiError.response?.data || apiError.message);
      throw new Error(apiError.response?.data?.message || apiError.message || 'Tavus API call failed');
    }

    console.info('[TAVUS] Successfully created conversation:', {
      id: conversationData.conversation_id,
      url: conversationData.conversation_url
    });

    return NextResponse.json({
      conversationUrl: conversationData.conversation_url,
      conversationId: conversationData.conversation_id,
      status: conversationData.status
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[TAVUS] General error:', message);

    return NextResponse.json(
      {
        error: 'Failed to create video conversation',
        details: message,
        fallbackToText: true
      },
      { status: 500 }
    );
  }
}
