import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface RefundDetailsProps {
  refundId: string;
  onBack: () => void;
}

interface RefundStatusHistory {
  id: string;
  refund_id: string;
  previous_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
  admin_users?: {
    name: string;
  };
}

interface RefundNotification {
  id: string;
  refund_id: string;
  user_id: string;
  type: string;
  status: string;
  content: string;
  sent_at: string | null;
  created_at: string;
}

interface Refund {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_id: string | null;
  reason: string | null;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_notes: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  orders: {
    order_number: string;
    payment_status: string;
  };
  refund_status_history: RefundStatusHistory[];
  refund_notifications: RefundNotification[];
  processed_by_admin?: {
    name: string;
    role: string;
  };
}

const RefundDetails: React.FC<RefundDetailsProps> = ({ refundId, onBack }) => {
  const [refund, setRefund] = useState<Refund | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRefundDetails();
  }, [refundId]);

  const fetchRefundDetails = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_refund_details/${refundId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch refund details1');
      }

      const data = await response.json();
      setRefund(data.refund);
    } catch (error) {
      console.error('Error fetching refund details:', error);
      toast.error('Failed to load refund details2');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Processing</Badge>;
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="error" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  const getEstimatedCompletionDate = () => {
    if (!refund) return null;
    
    const createdDate = new Date(refund.created_at);
    const estimatedDate = new Date(createdDate);
    estimatedDate.setDate(createdDate.getDate() + 5); // 5 business days
    
    return formatDate(estimatedDate.toISOString());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-cream-200 border-t-gold-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-charcoal-800 mb-2">Refund Not Found</h3>
        <p className="text-charcoal-500 mb-4">The requested refund could not be found.</p>
        <Button onClick={onBack}>Back to Orders</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h2 className="text-xl font-medium text-charcoal-800">
            Refund for Order #{refund.orders.order_number}
          </h2>
        </div>
        <div>
          {getStatusBadge(refund.status)}
        </div>
      </div>

      {/* Refund Summary */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-cream-200">
        <h3 className="font-medium text-charcoal-800 mb-4">Refund Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-charcoal-500">Refund Amount:</span>
              <span className="font-medium text-gold-600">{formatCurrency(refund.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Payment Method:</span>
              <span>{refund.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Refund Status:</span>
              <span>{getStatusBadge(refund.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Requested On:</span>
              <span>{formatDate(refund.created_at)}</span>
            </div>
            {refund.completed_at && (
              <div className="flex justify-between">
                <span className="text-charcoal-500">Completed On:</span>
                <span>{formatDate(refund.completed_at)}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {refund.reason && (
              <div>
                <span className="text-charcoal-500 block mb-1">Reason for Refund:</span>
                <p className="text-charcoal-800 bg-cream-50 p-2 rounded">{refund.reason}</p>
              </div>
            )}
            
            {refund.status === 'pending' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Estimated Completion</p>
                    <p>Your refund request is being reviewed. Estimated completion by {getEstimatedCompletionDate()}</p>
                  </div>
                </div>
              </div>
            )}
            
            {refund.status === 'processing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Processing</p>
                    <p>Your refund is being processed. This typically takes 3-5 business days to complete.</p>
                  </div>
                </div>
              </div>
            )}
            
            {refund.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Refund Completed</p>
                    <p>Your refund has been processed successfully. The funds should appear in your account within 1-3 business days.</p>
                  </div>
                </div>
              </div>
            )}
            
            {refund.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Refund Rejected</p>
                    <p>Your refund request has been rejected. Please contact customer support for more information.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refund Timeline */}
      {refund.refund_status_history && refund.refund_status_history.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-cream-200">
          <h3 className="font-medium text-charcoal-800 mb-4">Refund Timeline</h3>
          
          <div className="space-y-6">
            {refund.refund_status_history
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="mt-1">
                    {event.new_status === 'pending' && <Clock className="h-5 w-5 text-amber-500" />}
                    {event.new_status === 'processing' && <RefreshCw className="h-5 w-5 text-blue-500" />}
                    {event.new_status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {event.new_status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-charcoal-800 capitalize">{event.new_status}</p>
                        {event.notes && (
                          <p className="text-sm text-charcoal-500">{event.notes}</p>
                        )}
                        {event.admin_users?.name && (
                          <p className="text-xs text-charcoal-400 mt-1">By: {event.admin_users.name}</p>
                        )}
                      </div>
                      <span className="text-sm text-charcoal-500">
                        {formatDate(event.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Refund Notifications */}
      {refund.refund_notifications && refund.refund_notifications.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-cream-200">
          <h3 className="font-medium text-charcoal-800 mb-4">Notifications</h3>
          
          <div className="space-y-4">
            {refund.refund_notifications
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((notification) => (
                <div key={notification.id} className="p-3 bg-cream-50 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-charcoal-700">
                      {notification.type === 'email' ? 'Email' : notification.type === 'sms' ? 'SMS' : 'In-App Notification'}
                    </span>
                    <span className="text-xs text-charcoal-500">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-charcoal-600">{notification.content}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Contact Support */}
      <div className="bg-cream-50 rounded-lg p-6 border border-cream-200">
        <h3 className="font-medium text-charcoal-800 mb-2">Need Help?</h3>
        <p className="text-charcoal-600 mb-4">
          If you have any questions about your refund, please contact our customer support team.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/help/contact-us'}>
          Contact Support
        </Button>
      </div>
    </div>
  );
};

export default RefundDetails;