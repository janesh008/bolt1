import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
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
    
    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('ai_design_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    
    if (sessionError) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      session,
      messages: messages || []
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
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
    
    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('ai_design_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }
    
    // Delete all messages in the session
    const { error: messagesError } = await supabase
      .from('ai_messages')
      .delete()
      .eq('session_id', sessionId);
    
    if (messagesError) {
      return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
    }
    
    // Delete the session
    const { error } = await supabase
      .from('ai_design_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) {
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}