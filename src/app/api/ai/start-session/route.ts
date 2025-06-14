import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schema
const startSessionSchema = z.object({
  category: z.enum(['ring', 'necklace', 'earrings', 'bracelet', 'pendant']),
  metal_type: z.enum(['gold', 'silver', 'platinum', 'rose-gold']),
  style: z.enum(['modern', 'classic', 'vintage', 'minimalist', 'statement']),
  diamond_type: z.enum(['none', 'small', 'medium', 'large', 'multiple']),
  description: z.string().min(10).max(500),
  reference_image_url: z.string().url().optional(),
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
    const result = startSessionSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { 
      category, 
      metal_type, 
      style, 
      diamond_type, 
      description, 
      reference_image_url 
    } = result.data;
    
    // Check if user has reached the limit of favorite sessions
    if (body.is_favorite) {
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
    
    // Calculate expiration date (15 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15);
    
    // Create session record
    const { data: session, error } = await supabase
      .from('ai_design_sessions')
      .insert([{
        user_id: user.id,
        category,
        metal_type,
        style,
        diamond_type,
        description,
        reference_image_url,
        status: 'active',
        is_favorite: false,
        expires_at: expiresAt.toISOString(),
        last_message_at: new Date().toISOString(),
        title: `${category} in ${metal_type} (${style})`,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create design session' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      session 
    }, { status: 201 });
  } catch (error) {
    console.error('Start session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}