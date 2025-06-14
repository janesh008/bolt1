import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schema
const orderSchema = z.object({
  session_id: z.string().uuid(),
  message_id: z.string().uuid(),
  notes: z.string().optional(),
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
    const result = orderSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { session_id, message_id, notes } = result.data;
    
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
    
    // Verify message exists and belongs to the session
    const { data: message, error: messageError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('id', message_id)
      .eq('session_id', session_id)
      .single();
    
    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // In a real implementation, we would create an order in the orders table
    // and potentially integrate with a payment system
    
    // For now, we'll just return a success response
    return NextResponse.json({ 
      success: true, 
      message: 'Order placed successfully',
      order_id: uuidv4(), // This would be a real order ID in production
    });
  } catch (error) {
    console.error('Order placement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate a UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}