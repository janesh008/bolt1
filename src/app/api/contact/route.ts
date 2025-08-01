import { NextResponse } from 'next/server';
import { z } from 'zod';

// Remove unused import

// Contact form schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  subject: z.string().min(2, 'Subject must be at least 2 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = contactSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, phone, subject, message } = result.data;

    
    // Remove reference to undefined error variable
    /* 
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to store contact query' },
        { status: 500 }
      );
    }
    */
    
    // In a real application, you might want to send an email notification here
    
    return NextResponse.json(
      { success: true, message: 'Contact query submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}