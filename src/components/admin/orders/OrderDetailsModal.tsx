import React from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  X,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import Button from '../../ui/Button';
import OrderStatusUpdater from './OrderStatusUpdater';
import { formatCurrency } from '../../../lib/utils';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  stripe_payment_intent_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
  customers?: any;
  order_items?: any[];
  shipping_addresses?: any[];
  order_timeline?: any[];
}

interface OrderDetailsModalProps {
  showOrderDetails: boolean;
  setShowOrderDetails: (show: boolean) => void;
  selectedOrder: Order | null;
  getStatusBadge: (status: string) => React.ReactNode;
  getPaymentStatusBadge: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  handleStatusUpdate: (orderId: string, newStatus: string) => void;
  hasRole: (role: string) => boolean;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  showOrderDetails,
  setShowOrderDetails,
  selectedOrder,
  getStatusBadge,
  getPaymentStatusBadge,
  formatDate,
  handleStatusUpdate,
  hasRole
}) => {
  if (!selectedOrder) return null;

  return (
    <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {selectedOrder.order_number}</span>
            <div className="flex items-center space-x-2">
              {getStatusBadge(selectedOrder.status)}
              {getPaymentStatusBadge(selectedOrder.payment_status)}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Status Updater */}
          {hasRole('Moderator') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusUpdater
                  orderId={selectedOrder.id}
                  currentStatus={selectedOrder.status}
                  onStatusUpdated={(newStatus) => handleStatusUpdate(selectedOrder.id, newStatus)}
                />
              </CardContent>
            </Card>
          )}

          {/* Order Progress */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-4">Order Progress</h3>
            <div className="flex items-center justify-between">
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, index) => {
                const isActive = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status) >= index;
                const isCurrent = selectedOrder.status === step;
                
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    } ${isCurrent ? 'ring-2 ring-blue-300' : ''}`}>
                      {step === 'pending' && <Clock className="h-4 w-4" />}
                      {step === 'confirmed' && <CheckCircle className="h-4 w-4" />}
                      {step === 'processing' && <Package className="h-4 w-4" />}
                      {step === 'shipped' && <Truck className="h-4 w-4" />}
                      {step === 'delivered' && <CheckCircle className="h-4 w-4" />}
                    </div>
                    <span className="text-xs mt-1 capitalize">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrder.customers?.first_name} {selectedOrder.customers?.last_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrder.customers?.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrder.customers?.phone}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">{selectedOrder.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  {getPaymentStatusBadge(selectedOrder.payment_status)}
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium text-lg">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
                {selectedOrder.razorpay_payment_id && (
                  <div className="flex justify-between">
                    <span>Payment ID:</span>
                    <div className="flex items-center">
                      <span className="font-mono text-sm">{selectedOrder.razorpay_payment_id}</span>
                      <a 
                        href={`https://dashboard.razorpay.com/app/payments/${selectedOrder.razorpay_payment_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shipping Address */}
          {selectedOrder.shipping_addresses && selectedOrder.shipping_addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{selectedOrder.shipping_addresses[0].name}</p>
                  <p>{selectedOrder.shipping_addresses[0].phone}</p>
                  <p>{selectedOrder.shipping_addresses[0].address_line1}</p>
                  {selectedOrder.shipping_addresses[0].address_line2 && (
                    <p>{selectedOrder.shipping_addresses[0].address_line2}</p>
                  )}
                  <p>
                    {selectedOrder.shipping_addresses[0].city}, {selectedOrder.shipping_addresses[0].state}, {selectedOrder.shipping_addresses[0].pincode}
                  </p>
                  <p>{selectedOrder.shipping_addresses[0].country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items ({selectedOrder.order_items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.products?.product_images?.[0]?.image_url ? (
                        <img
                          src={item.products.product_images[0].image_url}
                          alt={item.products.product_name || item.products.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.products?.product_name || item.products?.name}</h4>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-500">Unit Price: {formatCurrency(item.unit_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          {selectedOrder.order_timeline && selectedOrder.order_timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedOrder.order_timeline.map((event, index) => (
                    <div key={event.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium capitalize">{event.status}</p>
                            {event.notes && (
                              <p className="text-sm text-gray-500">{event.notes}</p>
                            )}
                            {event.admin_users?.name && (
                              <p className="text-xs text-gray-400">By: {event.admin_users.name}</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {hasRole('Admin') && selectedOrder.payment_status === 'completed' && (
              <Button
                variant="outline"
                onClick={() => {
                  toast.error('Refund functionality is not implemented in this demo');
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Process Refund
              </Button>
            )}
            {hasRole('Admin') && selectedOrder.status !== 'cancelled' && (
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            )}
            <Button onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;