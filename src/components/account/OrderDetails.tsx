import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  CreditCard,
  AlertTriangle, 
  ChevronLeft, 
  ShoppingBag, 
  RefreshCw 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../ui/badge';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import RefundRequestModal from './RefundRequestModal';
import CancellationInstructions from './CancellationInstructions';

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false); 
  const [refundHistory, setRefundHistory] = useState<any[]>([]);
  const [isLoadingRefunds, setIsLoadingRefunds] = useState(false);
  const [showCancellationInstructions, setShowCancellationInstructions] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (order) {
      fetchRefundHistory();
    }
  }, [order]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching order details for ID:', orderId);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      // First try direct Supabase query
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
          shipping_addresses(*),
          order_timeline(*)
        `)
        .eq('id', orderId)
        .single();
      
      if (!orderError && orderData) {
        console.log('Fetched order details directly:', orderData);
        setOrder(orderData);
        setIsLoading(false);
        return;
      }
      
      // If direct query fails, try the edge function
      console.log('Direct query failed, trying edge function');
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
      console.log('Fetched order details:', data.order);
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRefundHistory = async () => {
    try {
      setIsLoadingRefunds(true);
      
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setRefundHistory(data || []);
    } catch (error) {
      console.error('Error fetching refund history:', error);
    } finally {
      setIsLoadingRefunds(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    try {
      setIsCancelling(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      // Call the edge function to cancel the order
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: cancelReason || 'Customer requested cancellation',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      const data = await response.json();
      
      // Update the local order state
      setOrder({
        ...order,
        status: 'cancelled',
        payment_status: data.refunded ? 'refunded' : order.payment_status,
      });
      
      toast.success(data.refunded 
        ? 'Order cancelled and refund initiated' 
        : 'Order cancelled successfully');
      
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRefundRequest = () => {
    setShowRefundModal(true);
  };

  const handleShowCancellationInstructions = () => {
    setShowCancellationInstructions(true);
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

  const canRequestRefund = () => {
    if (!order) return false;
    
    // Can request refund if:
    // 1. Order is not already cancelled
    // 2. Payment is completed
    // 3. Order is in pending, confirmed, or processing state
    // 4. No refund has been requested yet
    return (
      order.status !== 'cancelled' &&
      order.payment_status === 'completed' &&
      ['pending', 'confirmed', 'processing'].includes(order.status) &&
      refundHistory.length === 0
    );
  };

  const hasActiveRefund = () => {
    return refundHistory.some(refund => ['pending', 'processing'].includes(refund.status));
  };

  const hasCompletedRefund = () => {
    return refundHistory.some(refund => refund.status === 'completed');
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
                    alt={item.products?.product_name || item.products?.name}
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

      
      {/* Cancellation Instructions */}
      {canRequestRefund() && showCancellationInstructions && (
        <CancellationInstructions onRequestCancellation={handleRefundRequest} />
      )}

      {/* Refund/Cancel Options */}
      {canRequestRefund() && !showCancellationInstructions && (
        <div className="mt-4 p-4 bg-black text-white rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <p>You can cancel the order here, If you like other jewelry.</p>
              </div>
            </div>
            <Button 
              onClick={handleShowCancellationInstructions}
              className="bg-gold-400 hover:bg-gold-500 text-black"
            >
              Cancel Order
            </Button>
          </div>
        </div>
      )}

      {/* Active Refund Notice */}
      {hasActiveRefund() && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-800">Refund In Progress</h3>
              <p className="text-sm text-blue-700">
                A refund request for this order is currently being processed. You can check the status in the Refunds tab.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completed Refund Notice */}
      {hasCompletedRefund() && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">Refund Completed</h3>
              <p className="text-sm text-green-700">
                A refund for this order has been processed. The funds should be credited to your original payment method.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Order Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-medium text-charcoal-800">Cancel Order</h3>
            </div>
            
            <p className="text-charcoal-600 mb-4">
              Are you sure you want to cancel this order? {order.payment_status === 'completed' && 'A refund will be initiated to your original payment method.'}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                placeholder="Please provide a reason for cancellation..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={isCancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleCancelOrder}
                isLoading={isCancelling}
              >
                {order.payment_status === 'completed' ? 'Cancel & Refund' : 'Cancel Order'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      <RefundRequestModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        order={order}
      />
    </div>
  );
};

export default OrderDetails;