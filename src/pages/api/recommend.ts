import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { category, budget, style, material } = await req.json();
    
    // Build query based on parameters
    let query = supabase
      .from('products')
      .select(`
        id,
        product_name,
        name,
        price,
        description,
        product_images (
          image_url
        )
      `)
      .eq('availability', true)
      .order('featured', { ascending: false })
      .limit(5);
    
    // Apply filters if provided
    if (category) {
      query = query.ilike('product_type', `%${category}%`);
    }
    
    if (budget) {
      query = query.lte('price', budget);
    }
    
    if (style) {
      // This assumes you have a tags array or similar field that contains style information
      query = query.contains('tags', [style]);
    }
    
    if (material) {
      query = query.eq('metal_type', material);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Format the response
    const products = data.map(product => ({
      id: product.id,
      name: product.product_name || product.name,
      price: product.price,
      image: product.product_images?.[0]?.image_url || 'https://images.pexels.com/photos/10018318/pexels-photo-10018318.jpeg',
      description: product.description
    }));
    
    return NextResponse.json(products);
    
  } catch (error) {
    console.error('Recommend API error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}