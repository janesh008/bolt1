import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  CreditCard,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../ui/badge';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_order_details/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="secondary">Confirmed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'shipped':
        return <Badge>Shipped</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h2 className="text-xl font-medium text-charcoal-800">
            Order #{order.order_number}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          {getPaymentStatusBadge(order.payment_status)}
        </div>
      </div>

      {/* Order Progress */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-cream-200">
        <h3 className="font-medium text-charcoal-800 mb-4">Order Progress</h3>
        
        <div className="relative">
          {/* Progress Bar */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-cream-200 -translate-y-1/2 z-0"></div>
          
          {/* Progress Steps */}
          <div className="relative z-10 flex justify-between">
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, index) => {
              const isCompleted = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
              const isCurrent = order.status === step;
              
              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-gold-400 text-white' 
                      : 'bg-cream-200 text-charcoal-400'
                  } ${isCurrent ? 'ring-4 ring-gold-100' : ''}`}>
                    {step === 'pending' && <Clock className="h-5 w-5" />}
                    {step === 'confirmed' && <CheckCircle className="h-5 w-5" />}
                    {step === 'processing' && <Package className="h-5 w-5" />}
                    {step === 'shipped' && <Truck className="h-5 w-5" />}
                    {step === 'delivered' && <CheckCircle className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 capitalize ${
                    isCompleted ? 'text-charcoal-800 font-medium' : 'text-charcoal-400'
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Order Timeline */}
        {order.order_timeline && order.order_timeline.length > 0 && (
          <div className="mt-8 border-t border-cream-200 pt-4">
            <h4 className="text-sm font-medium text-charcoal-700 mb-4">Order Timeline</h4>
            <div className="space-y-4">
              {order.order_timeline
                .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((event: any) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(event.status)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-charcoal-800 capitalize">{event.status}</p>
                        {event.notes && (
                          <p className="text-sm text-charcoal-500">{event.notes}</p>
                        )}
                      </div>
                      <span className="text-sm text-charcoal-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-cream-200">
          <h3 className="font-medium text-charcoal-800 mb-4 flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2 text-gold-500" />
            Order Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-charcoal-500">Order Number:</span>
              <span className="font-medium">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Date Placed:</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Total Amount:</span>
              <span className="font-medium">{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Payment Method:</span>
              <span>{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Payment Status:</span>
              <span>{getPaymentStatusBadge(order.payment_status)}</span>
            </div>
          </div>
        </div>
        
        {/* Shipping Information */}
        {order.shipping_addresses && order.shipping_addresses.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-cream-200">
            <h3 className="font-medium text-charcoal-800 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gold-500" />
              Shipping Information
            </h3>
            
            <div className="space-y-2">
              <p className="font-medium">{order.shipping_addresses[0].name}</p>
              <p>{order.shipping_addresses[0].phone}</p>
              <p>{order.shipping_addresses[0].address_line1}</p>
              {order.shipping_addresses[0].address_line2 && (
                <p>{order.shipping_addresses[0].address_line2}</p>
              )}
              <p>
                {order.shipping_addresses[0].city}, {order.shipping_addresses[0].state}, {order.shipping_addresses[0].pincode}
              </p>
              <p>{order.shipping_addresses[0].country}</p>
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-cream-200">
        <h3 className="font-medium text-charcoal-800 mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2 text-gold-500" />
          Order Items
        </h3>
        
        <div className="space-y-4">
          {order.order_items && order.order_items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-cream-50 rounded-lg">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                {item.products?.product_images && item.products.product_images.length > 0 ? (
                  <img
                    src={item.products.product_images[0].image_url}
                    alt={item.products.product_name || item.products.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-8 w-8 text-charcoal-300" />
                )}
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-charcoal-800">
                  {item.products?.product_name || item.products?.name || 'Product'}
                </p>
                <p className="text-sm text-charcoal-500">
                  Quantity: {item.quantity}
                </p>
                <p className="text-sm text-charcoal-500">
                  Unit Price: {formatCurrency(item.unit_price)}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-medium text-charcoal-800">
                  {formatCurrency(item.total_price)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-cream-200">
          <div className="flex justify-between font-medium text-charcoal-800">
            <span>Total</span>
            <span className="text-gold-600">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;