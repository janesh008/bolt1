import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export async function POST(req: NextRequest) {
  try {
    const { user_name, product_name } = await req.json();
    
    if (!process.env.TAVUS_API_KEY) {
      return NextResponse.json(
        { error: 'Tavus API key not configured' },
        { status: 500 }
      );
    }
    
    // Get the replica ID from environment variables or use the provided one
    const replicaId = process.env.TAVUS_REPLICA_ID || 'r6ae5b6efc9d';
    
    // Get the persona ID from environment variables
    const personaId = process.env.TAVUS_PERSONA_ID;
    
    if (!personaId) {
      return NextResponse.json(
        { error: 'Tavus Persona ID not configured' },
        { status: 500 }
      );
    }
    
    // Call Tavus API to create a real-time conversation
    const response = await axios.post(
      'https://tavusapi.com/v2/conversations',
      {
        replica_id: replicaId,
        persona_id: personaId,
        conversation_name: `Jewelry Consultation with ${user_name}`,
        conversational_context: `The user is interested in a ${product_name}. Their name is ${user_name}.`,
        custom_greeting: `Hello ${user_name}, I'm excited to help you find the perfect ${product_name} today!`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TAVUS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract conversation URL from Tavus response
    const conversationData = response.data as TavusConversationResponse;
    const conversationUrl = conversationData.conversation_url;
    
    if (!conversationUrl) {
      throw new Error('No conversation URL returned from Tavus API');
    }
    
    return NextResponse.json({ 
      conversationUrl,
      conversationId: conversationData.conversation_id,
      status: conversationData.status
    });
    
  } catch (error) {
    console.error('Tavus conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}