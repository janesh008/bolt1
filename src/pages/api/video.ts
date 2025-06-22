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
    // For this example, we'll simulate a response
    
    // Simulated API call to Tavus
    /*
    const response = await axios.post(
      'https://api.tavus.io/v1/videos',
      {
        recipient: {
          name: user_name
        },
        variables: {
          product_name: product_name
        },
        template_id: 'your-tavus-template-id'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TAVUS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const videoUrl = response.data.video_url;
    */
    
    // For demo purposes, return a placeholder video URL
    const videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Replace with actual Tavus embed URL in production
    
    return NextResponse.json({ videoUrl });
    
  } catch (error) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}