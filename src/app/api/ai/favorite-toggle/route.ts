import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schema
const favoriteToggleSchema = z.object({
  session_id: z.string().uuid(),
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
    const result = favoriteToggleSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { session_id } = result.data;
    
    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('ai_design_sessions')
      .select('is_favorite')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }
    
    const newFavoriteStatus = !session.is_favorite;
    
    // If trying to favorite, check if limit reached
    if (newFavoriteStatus) {
      const { data: favoriteCount, error: countError } = await supabase
        .from('ai_design_sessions')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_favorite', true);
      
      if (countError) {
        return NextResponse.json({ error: 'Failed to check favorite limit' }, { status: 500 });
      }
      
      if ((favoriteCount?.length || 0) >= 5) {
        return NextResponse.json({ error: 'You can only have up to 5 favorite sessions' }, { status: 400 });
      }
    }
    
    // Update favorite status
    const { error } = await supabase
      .from('ai_design_sessions')
      .update({ 
        is_favorite: newFavoriteStatus,
        // If favorited, remove expiration; if unfavorited, set expiration to 15 days from now
        expires_at: newFavoriteStatus ? null : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', session_id);
    
    if (error) {
      return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      is_favorite: newFavoriteStatus
    });
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}