import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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

export async function POST(req: NextRequest) {
  try {
    const { user_name, product_name } = await req.json();
    
    // Validate required fields
    if (!user_name || !product_name) {
      return NextResponse.json(
        { error: 'User name and product name are required' },
        { status: 400 }
      );
    }
    
    // Check for API key
    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      console.error('Tavus API key not configured');
      return NextResponse.json(
        { error: 'Tavus API key not configured' },
        { status: 500 }
      );
    }
    
    // Get the replica ID from environment variables or use the provided one
    const replicaId = process.env.TAVUS_REPLICA_ID || 'r6ae5b6efc9d';
    
    // Get the persona ID from environment variables
    const personaId = process.env.TAVUS_PERSONA_ID;
    
    if (!personaId && !replicaId) {
      console.error('Tavus Persona ID not configured');
      return NextResponse.json(
        { error: 'Tavus Persona ID not configured' },
        { status: 500 }
      );
    }
    
    // Call Tavus API to create a real-time conversation
    const requestBody: any = {
      replica_id: replicaId,
      conversation_name: `Jewelry Consultation with ${user_name}`,
      conversational_context: `The user is interested in a ${product_name}. Their name is ${user_name}.`,
      custom_greeting: `Hello ${user_name}, I'm excited to help you find the perfect ${product_name} today!`
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
    
    // Declare conversationData variable at this scope level
    let conversationData: TavusConversationResponse;
    
    try {
      const response = await axios.post(
        'https://tavusapi.com/v2/conversations',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${tavusApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Tavus API response:', response.data);
    
      // Extract conversation URL from Tavus response
      conversationData = response.data as TavusConversationResponse;
    } catch (apiError: any) {
      console.error('Tavus API error details:', apiError.response?.data || apiError.message);
      throw new Error(apiError.response?.data?.message || apiError.message || 'Tavus API error');
    }
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Tavus conversation API error:', errorMessage);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to create video conversation',
        details: errorMessage,
        fallbackToText: true
      },
      { status: 500 }
    );
  }
}