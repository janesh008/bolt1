import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("auth_user_id", user.id)
      .eq("status", "active")
      .single();
    
    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const fromDate = url.searchParams.get("from") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = url.searchParams.get("to") || new Date().toISOString();
    const category = url.searchParams.get("category");
    const region = url.searchParams.get("region");
    
    // Build query conditions
    let conditions = `created_at >= '${fromDate}' AND created_at <= '${toDate}'`;
    
    if (category && category !== 'all') {
      conditions += ` AND category_id = (SELECT id FROM categories WHERE name = '${category}')`;
    }
    
    // Get summary data
    // In a real implementation, we would query the database for actual analytics data
    // For this demo, we'll return mock data
    
    // In a production environment, you would use SQL queries like:
    /*
    const { data: summary, error: summaryError } = await supabase.rpc('get_sales_summary', {
      from_date: fromDate,
      to_date: toDate,
      category_filter: category !== 'all' ? category : null,
      region_filter: region !== 'all' ? region : null
    });
    
    if (summaryError) {
      throw summaryError;
    }
    */
    
    // Generate mock data for demonstration
    const mockData = generateMockAnalyticsData(fromDate, toDate, category, region);
    
    return new Response(
      JSON.stringify(mockData),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});

// Function to generate mock analytics data
function generateMockAnalyticsData(fromDate: string, toDate: string, category?: string | null, region?: string | null) {
  // Parse dates
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  
  // Generate dates for the period
  const dates = Array.from({ length: daysDiff }, (_, i) => {
    const date = new Date(from);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });
  
  // Generate sales trend data
  const salesTrend = dates.map(date => {
    const revenue = Math.floor(Math.random() * 10000) + 1000;
    const orders = Math.floor(Math.random() * 10) + 1;
    return { date, revenue, orders };
  });
  
  // Generate category performance data
  const categories = ['Ring', 'Necklace', 'Earring', 'Bracelet', 'Pendant'];
  const categoryPerformance = categories.map(cat => {
    // If category filter is applied, boost the selected category
    const multiplier = (category && cat.toLowerCase() === category.toLowerCase()) ? 2 : 1;
    
    const revenue = (Math.floor(Math.random() * 50000) + 10000) * multiplier;
    const orders = (Math.floor(Math.random() * 50) + 10) * multiplier;
    return {
      category: cat,
      revenue,
      orders,
      averagePrice: Math.round(revenue / orders)
    };
  });
  
  // Generate regional sales data
  const regions = ['North India', 'South India', 'East India', 'West India', 'International'];
  const regionalSales = regions.map(reg => {
    // If region filter is applied, boost the selected region
    const multiplier = (region && reg.toLowerCase() === region.toLowerCase()) ? 2 : 1;
    
    const revenue = (Math.floor(Math.random() * 40000) + 5000) * multiplier;
    const orders = (Math.floor(Math.random() * 40) + 5) * multiplier;
    return {
      region: reg,
      revenue,
      orders,
      customers: Math.floor(orders * 0.8)
    };
  });
  
  // Generate top products data
  const productNames = [
    'Diamond Solitaire Ring',
    'Pearl Necklace',
    'Gold Hoop Earrings',
    'Platinum Bracelet',
    'Ruby Pendant',
    'Sapphire Earrings',
    'Emerald Ring',
    'Gold Chain',
    'Silver Anklet',
    'Diamond Tennis Bracelet'
  ];
  
  const topProducts = productNames.map((name, index) => {
    const revenue = Math.floor(Math.random() * 20000) + 5000;
    const quantity = Math.floor(Math.random() * 20) + 5;
    return {
      id: `PROD-${1000 + index}`,
      name,
      revenue,
      quantity,
      category: categories[Math.floor(Math.random() * categories.length)],
      inStock: Math.floor(Math.random() * 50)
    };
  }).sort((a, b) => b.revenue - a.revenue);
  
  // Generate summary data
  const totalRevenue = salesTrend.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = salesTrend.reduce((sum, day) => sum + day.orders, 0);
  
  return {
    summary: {
      totalRevenue,
      totalOrders,
      totalCustomers: Math.floor(totalOrders * 0.8),
      averageOrderValue: Math.round(totalRevenue / totalOrders),
      conversionRate: Math.random() * 5 + 2 // 2-7%
    },
    salesTrend,
    categoryPerformance,
    regionalSales,
    topProducts,
    stockLevels: {
      low: Math.floor(Math.random() * 10) + 5,
      medium: Math.floor(Math.random() * 15) + 10,
      high: Math.floor(Math.random() * 20) + 15,
      outOfStock: Math.floor(Math.random() * 5)
    }
  };
}