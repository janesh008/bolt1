import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  gdprConsent: z.boolean().refine(val => val === true, {
    message: 'You must consent to the data privacy policy'
  }),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = subscribeSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, gdprConsent, source = 'website' } = result.data;
    
    // Get client IP address for audit purposes
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id, status, opt_in_confirmed')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing subscriber:', checkError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }
    
    // If subscriber exists and is active, return success but don't duplicate
    if (existingSubscriber && existingSubscriber.status === 'active') {
      return NextResponse.json({ 
        success: true, 
        message: "You're already subscribed to our newsletter",
        alreadySubscribed: true
      });
    }
    
    // If subscriber exists but is inactive, reactivate
    if (existingSubscriber) {
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          status: 'active',
          gdpr_consent: gdprConsent,
          source: source,
          ip_address: clientIp,
          last_updated: new Date().toISOString()
        })
        .eq('id', existingSubscriber.id);
      
      if (updateError) {
        console.error('Error updating subscriber:', updateError);
        return NextResponse.json(
          { success: false, error: 'Database error' },
          { status: 500 }
        );
      }
      
      // In a real implementation, you would send a confirmation email here
      
      return NextResponse.json({ 
        success: true, 
        message: "Your subscription has been reactivated",
        requiresConfirmation: !existingSubscriber.opt_in_confirmed
      });
    }
    
    // Create new subscriber
    const { data: newSubscriber, error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
        source: source,
        gdpr_consent: gdprConsent,
        ip_address: clientIp,
        status: 'active', // Will be set to active once confirmed via email
        opt_in_confirmed: false
      })
      .select('id, unsubscribe_token')
      .single();
    
    if (insertError) {
      console.error('Error inserting subscriber:', insertError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }
    
    // In a real implementation, you would send a confirmation email here
    
    return NextResponse.json({ 
      success: true, 
      message: "Thank you for subscribing! Please check your email to confirm your subscription.",
      requiresConfirmation: true
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}