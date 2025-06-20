import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import OrderDetails from './OrderDetails';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

// Simple Badge component
const Badge = ({ variant = 'secondary', className = '', children }: { 
  variant?: 'success' | 'error' | 'warning' | 'secondary', 
  className?: string, 
  children: React.ReactNode 
}) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    secondary: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface OrdersTabProps {
  userId: string;
  highlightedOrderId?: string | null;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ userId, highlightedOrderId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(highlightedOrderId || null);
  
  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);
  
  useEffect(() => {
    if (highlightedOrderId) {
      setSelectedOrderId(highlightedOrderId);
    }
  }, [highlightedOrderId]);
  
  const fetchOrders = async () => {
    if (!userId) {
      console.error('No user ID available for fetching orders');
      return;
    }

    try {
      setIsLoading(true);
      console.log('=== FETCHING ORDERS DEBUG ===');
      console.log('User ID:', userId);
      
      // Fetch orders directly using user_id
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              *,
              product_images (*)
            )
          ),
          shipping_addresses(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      console.log('Orders with user_id:', orderData);
      console.log('Orders error:', orderError);
      
      if (orderError) {
        console.error('Error fetching orders:', orderError);
        toast.error('Failed to load orders: ' + orderError.message);
        return;
      }

      console.log('Final orders data:', orderData);
      setOrders(orderData || []);
      
      if (!orderData || orderData.length === 0) {
        console.log('No orders found for user');
      }
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewOrder = (orderId: string) => {
    console.log('Viewing order:', orderId);
    setSelectedOrderId(orderId);
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
    // Refresh orders when coming back from order details
    fetchOrders();
  };
  
  // Debug function to check table structure and data
  const debugOrdersTable = async () => {
    console.log('=== DEBUGGING ORDERS TABLE ===');
    
    try {
      // Get table structure by fetching one row
      const { data: sampleData, error: sampleError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
      
      if (sampleData && sampleData.length > 0) {
        console.log('Orders table columns:', Object.keys(sampleData[0]));
        console.log('Sample order:', sampleData[0]);
      }
      
      // Get all orders to see what's there
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('Recent orders (limited to 10):', allOrders);
      
      // Check current user
      console.log('Current user ID:', userId);
      
      // Try to find orders that might belong to current user
      if (allOrders) {
        const possibleUserOrders = allOrders.filter(order => {
          return order.user_id === userId;
        });
        console.log('Orders that might belong to current user:', possibleUserOrders);
      }
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  };
  
  if (selectedOrderId) {
    return (
      <OrderDetails 
        orderId={selectedOrderId} 
        onBack={handleBackToOrders} 
      />
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-charcoal-800">Order History</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={debugOrdersTable}
          >
            Debug Orders
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="text-charcoal-500 mt-2">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <p className="text-charcoal-500 mb-4">You haven't placed any orders yet.</p>
          <Button onClick={() => window.location.href = '/products'}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className={`border ${
                highlightedOrderId === order.id 
                  ? 'border-gold-400 bg-gold-50' 
                  : 'border-cream-200'
              } rounded-lg p-4 transition-all duration-300`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-medium text-charcoal-800">
                    Order #{order.order_number}
                  </p>
                  <p className="text-sm text-charcoal-500">
                    {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-charcoal-800">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={
                        order.status === 'delivered' ? 'success' : 
                        order.status === 'cancelled' ? 'error' : 
                        order.status === 'pending' ? 'warning' : 
                        'secondary'
                      }
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                    <Badge 
                      variant={
                        order.payment_status === 'completed' ? 'success' : 
                        order.payment_status === 'failed' ? 'error' : 
                        'warning'
                      }
                    >
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {order.order_items?.slice(0, 2).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4"
                  >
                    <div className="w-12 h-12 bg-cream-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.products?.product_images?.[0]?.image_url ? (
                        <img
                          src={item.products.product_images[0].image_url}
                          alt={item.products?.name || item.products?.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-charcoal-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-charcoal-800 text-sm">
                        {item.products?.product_name || item.products?.name || 'Product'}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
                
                {order.order_items && order.order_items.length > 2 && (
                  <p className="text-xs text-charcoal-500">
                    +{order.order_items.length - 2} more items
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-cream-200 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewOrder(order.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;