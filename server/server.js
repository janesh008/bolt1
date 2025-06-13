import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_95lpU4BLVjzNkI',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'bbko0FoQKSMvoKvIXXBxuLEo',
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Validation middleware
const validateCreateOrder = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').isIn(['INR', 'USD']).withMessage('Currency must be INR or USD'),
  body('items').isArray().withMessage('Items must be an array'),
  body('shipping_address').isObject().withMessage('Shipping address is required'),
];

const validateVerifyPayment = [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
];

// Helper function to generate order number
function generateOrderNumber() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp.slice(-8)}-${random}`;
}

// Helper function to get or create customer
async function getOrCreateCustomer(userToken) {
  try {
    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      throw new Error('Invalid user token');
    }

    // Check if customer exists
    let { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      throw customerError;
    }

    // Create customer if doesn't exist
    if (!customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([{
          user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone: user.user_metadata?.phone || '',
        }])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      customer = newCustomer;
    }

    return { user, customer };
  } catch (error) {
    throw new Error(`Customer creation failed: ${error.message}`);
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create Razorpay order
app.post('/orders/create-order', validateCreateOrder, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { amount, currency = 'INR', items, shipping_address } = req.body;
    const userToken = req.headers.authorization?.replace('Bearer ', '');

    if (!userToken) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    // Get or create customer
    const { user, customer } = await getOrCreateCustomer(userToken);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: orderNumber,
      notes: {
        customer_id: customer.id,
        user_id: user.id,
      }
    });

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customer.id,
        order_number: orderNumber,
        status: 'pending',
        total_amount: amount,
        shipping_address: shipping_address,
        payment_status: 'pending',
        payment_method: 'razorpay',
        razorpay_order_id: razorpayOrder.id,
      }])
      .select()
      .single();

    if (orderError) {
      throw new Error(`Database error: ${orderError.message}`);
    }

    // Create order items
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: amount / items.reduce((sum, i) => sum + i.quantity, 0), // Simple calculation
        total_price: amount,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
      }
    }

    // Create shipping address record
    if (shipping_address) {
      const { error: addressError } = await supabase
        .from('shipping_addresses')
        .insert([{
          order_id: order.id,
          name: shipping_address.name,
          phone: shipping_address.phone,
          address_line1: shipping_address.address_line1,
          address_line2: shipping_address.address_line2,
          city: shipping_address.city,
          state: shipping_address.state,
          country: shipping_address.country,
          pincode: shipping_address.pincode,
        }]);

      if (addressError) {
        console.error('Error creating shipping address:', addressError);
      }
    }

    // Return success response
    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: orderNumber,
        amount: amount,
        currency: currency,
      },
      razorpay_order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      customer: {
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        email: customer.email,
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message
    });
  }
});

// Verify Razorpay payment
app.post('/orders/verify-payment', validateVerifyPayment, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        error: 'Invalid payment signature'
      });
    }

    // Update order in database
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
        razorpay_payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select(`
        *,
        customers (
          first_name,
          last_name,
          email
        ),
        order_items (
          *,
          products (
            product_name,
            name,
            price
          )
        )
      `)
      .single();

    if (updateError) {
      throw new Error(`Database update error: ${updateError.message}`);
    }

    // Add order timeline entry
    const { error: timelineError } = await supabase
      .from('order_timeline')
      .insert([{
        order_id: order.id,
        status: 'confirmed',
        notes: 'Payment completed successfully',
      }]);

    if (timelineError) {
      console.error('Error creating timeline entry:', timelineError);
    }

    // Return success response
    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: order,
      payment: {
        razorpay_order_id,
        razorpay_payment_id,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      error: 'Payment verification failed',
      message: error.message
    });
  }
});

// Cart API endpoints
app.get('/cart', async (req, res) => {
  try {
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!userToken) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid user token'
      });
    }

    // Get cart items
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          product_name,
          name,
          price,
          product_images (
            image_url
          )
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    // Format cart items
    const cartItems = (data || []).map(item => ({
      id: item.id,
      product_id: item.product_id,
      name: item.products?.product_name || item.products?.name || 'Unknown Product',
      price: item.products?.price || 0,
      image: item.products?.product_images?.[0]?.image_url || '',
      quantity: item.quantity,
    }));

    res.json({
      success: true,
      items: cartItems
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: 'Failed to get cart',
      message: error.message
    });
  }
});

app.post('/cart/add', async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!userToken) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid user token'
      });
    }

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    let result;
    
    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity;
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Add new item
      const { data, error } = await supabase
        .from('cart_items')
        .insert([{
          user_id: user.id,
          product_id,
          quantity
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      success: true,
      message: 'Item added to cart',
      item: result
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      error: 'Failed to add item to cart',
      message: error.message
    });
  }
});

app.post('/cart/remove', async (req, res) => {
  try {
    const { item_id } = req.body;
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!userToken) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid user token'
      });
    }

    // Remove item from cart
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', item_id)
      .eq('user_id', user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      error: 'Failed to remove item from cart',
      message: error.message
    });
  }
});

app.post('/cart/sync', async (req, res) => {
  try {
    const { items } = req.body;
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!userToken) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid user token'
      });
    }

    // Get existing cart items
    const { data: existingItems, error: getError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (getError) throw getError;

    // Create a map of existing items by product_id
    const existingItemsMap = (existingItems || []).reduce((map, item) => {
      map[item.product_id] = item;
      return map;
    }, {});

    // Process each item from the request
    const itemsToUpdate = [];
    const itemsToInsert = [];

    for (const item of items) {
      if (existingItemsMap[item.product_id]) {
        // Update existing item
        itemsToUpdate.push({
          id: existingItemsMap[item.product_id].id,
          quantity: existingItemsMap[item.product_id].quantity + item.quantity
        });
      } else {
        // Insert new item
        itemsToInsert.push({
          user_id: user.id,
          product_id: item.product_id,
          quantity: item.quantity
        });
      }
    }

    // Perform updates
    for (const item of itemsToUpdate) {
      await supabase
        .from('cart_items')
        .update({ quantity: item.quantity })
        .eq('id', item.id);
    }

    // Perform inserts
    if (itemsToInsert.length > 0) {
      await supabase
        .from('cart_items')
        .insert(itemsToInsert);
    }

    // Get updated cart
    const { data: updatedCart, error: finalError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          product_name,
          name,
          price,
          product_images (
            image_url
          )
        )
      `)
      .eq('user_id', user.id);

    if (finalError) throw finalError;

    // Format cart items
    const cartItems = (updatedCart || []).map(item => ({
      id: item.id,
      product_id: item.product_id,
      name: item.products?.product_name || item.products?.name || 'Unknown Product',
      price: item.products?.price || 0,
      image: item.products?.product_images?.[0]?.image_url || '',
      quantity: item.quantity,
    }));

    res.json({
      success: true,
      message: 'Cart synced successfully',
      items: cartItems
    });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({
      error: 'Failed to sync cart',
      message: error.message
    });
  }
});

// Wishlist API endpoints
app.get('/wishlist', async (req, res) => {
  try {
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!userToken) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid user token'
      });
    }

    // Get wishlist items
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        product_id,
        created_at,
        products (
          id,
          product_name,
          name,
          price,
          product_images (
            image_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format wishlist items
    const wishlistItems = (data || []).map(item => ({
      id: item.id,
      product_id: item.product_id,
      name: item.products?.product_name || item.products?.name || 'Unknown Product',
      price: item.products?.price || 0,
      image: item.products?.product_images?.[0]?.image_url || '',
      created_at: item.created_at,
    }));

    res.json({
      success: true,
      items: wishlistItems
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      error: 'Failed to get wishlist',
      message: error.message
    });
  }
});

app.post('/wishlist/add', async (req, res) => {
  try {
    const { product_id } = req.body;
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!userToken) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid user token'
      });
    }

    // Check if item already exists in wishlist
    const { data: existingItem, error: checkError } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingItem) {
      return res.json({
        success: true,
        message: 'Item already in wishlist',
        item: existingItem
      });
    }

    // Add item to wishlist
    const { data, error } = await supabase
      .from('wishlists')
      .insert([{
        user_id: user.id,
        product_id
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Item added to wishlist',
      item: data
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      error: 'Failed to add item to wishlist',
      message: error.message
    });
  }
});

app.post('/wishlist/remove', async (req, res) => {
  try {
    const { product_id } = req.body;
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!userToken) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid user token'
      });
    }

    // Remove item from wishlist
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      error: 'Failed to remove item from wishlist',
      message: error.message
    });
  }
});

// Get orders for admin
app.get('/admin/orders', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, payment_status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          email,
          phone
        ),
        order_items (
          *,
          products (
            product_name,
            name,
            product_images (
              image_url
            )
          )
        ),
        shipping_addresses (*),
        order_timeline (*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (payment_status && payment_status !== 'all') {
      query = query.eq('payment_status', payment_status);
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customers.email.ilike.%${search}%`);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (payment_status && payment_status !== 'all') {
      countQuery = countQuery.eq('payment_status', payment_status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      success: true,
      orders: orders || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// Update order status (admin only)
app.patch('/admin/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Add timeline entry
    const { error: timelineError } = await supabase
      .from('order_timeline')
      .insert([{
        order_id: orderId,
        status: status,
        notes: notes || `Status updated to ${status}`,
      }]);

    if (timelineError) {
      console.error('Error creating timeline entry:', timelineError);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Failed to update order status',
      message: error.message
    });
  }
});

// Get single order details
app.get('/admin/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          email,
          phone
        ),
        order_items (
          *,
          products (
            product_name,
            name,
            price,
            product_images (
              image_url
            )
          )
        ),
        shipping_addresses (*),
        order_timeline (
          *,
          admin_users (
            name
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      error: 'Failed to fetch order details',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;