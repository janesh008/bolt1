import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get token from URL
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unsubscribe token is required' },
        { status: 400 }
      );
    }
    
    // Update subscriber status
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'inactive',
        last_updated: new Date().toISOString()
      })
      .eq('unsubscribe_token', token)
      .select('email')
      .single();
    
    if (error) {
      console.error('Error unsubscribing:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Subscriber not found' },
        { status: 404 }
      );
    }
    
    // Log the unsubscribe action
    await supabase
      .from('activity_logs')
      .insert({
        action: 'newsletter_unsubscribe',
        details: { email: data.email },
        timestamp: new Date().toISOString()
      });
    
    return NextResponse.json({ 
      success: true, 
      message: "You have been successfully unsubscribed from our newsletter" 
    });
    
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unsubscribe token is required' },
        { status: 400 }
      );
    }
    
    // Update subscriber status
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'inactive',
        last_updated: new Date().toISOString()
      })
      .eq('unsubscribe_token', token)
      .select('email')
      .single();
    
    if (error) {
      console.error('Error unsubscribing:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Subscriber not found' },
        { status: 404 }
      );
    }
    
    // Log the unsubscribe action
    await supabase
      .from('activity_logs')
      .insert({
        action: 'newsletter_unsubscribe',
        details: { email: data.email },
        timestamp: new Date().toISOString()
      });
    
    return NextResponse.json({ 
      success: true, 
      message: "You have been successfully unsubscribed from our newsletter" 
    });
    
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}