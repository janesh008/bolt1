import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { user_name, product_name } = await req.json();
    
    if (!process.env.TAVUS_API_KEY) {
      return NextResponse.json(
        { error: 'Tavus API key not configured' },
        { status: 500 }
      );
    }
    
    // In a real implementation, you would call the Tavus API here
    
    // Call Tavus API to generate personalized video
    const response = await axios.post(
      'https://api.tavus.io/v1/videos',
      {
        recipient: {
          name: user_name
        },
        variables: {
          product_name: product_name,
          user_greeting: `Hello ${user_name}, I'd like to show you this beautiful ${product_name}`
        },
        template_id: process.env.TAVUS_TEMPLATE_ID || 'default-template-id'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TAVUS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract video URL from Tavus response
    const videoUrl = response.data.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    
    return NextResponse.json({ videoUrl });
    
  } catch (error) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}