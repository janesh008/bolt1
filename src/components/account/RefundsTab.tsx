import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, RefreshCw, Eye, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatCurrency } from '../../lib/utils';
import RefundDetails from './RefundDetails';
import toast from 'react-hot-toast';

interface RefundsTabProps {
  userId: string;
  highlightedRefundId?: string | null;
}

const RefundsTab: React.FC<RefundsTabProps> = ({ userId, highlightedRefundId }) => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(highlightedRefundId || null);
  
  useEffect(() => {
    if (userId) {
      fetchRefunds();
    }
  }, [userId]);
  
  useEffect(() => {
    if (highlightedRefundId) {
      setSelectedRefundId(highlightedRefundId);
    }
  }, [highlightedRefundId]);
  
  const fetchRefunds = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('refunds')
        .select(`
          *,
          orders (
            order_number,
            payment_method,
            payment_status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setRefunds(data || []);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Failed to load refunds');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewRefund = (refundId: string) => {
    setSelectedRefundId(refundId);
  };
  
  const handleBackToRefunds = () => {
    setSelectedRefundId(null);
    // Refresh refunds when coming back from refund details
    fetchRefunds();
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
  
  if (selectedRefundId) {
    return (
      <RefundDetails 
        refundId={selectedRefundId} 
        onBack={handleBackToRefunds} 
      />
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-charcoal-800">Refund History</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchRefunds}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="text-charcoal-500 mt-2">Loading refunds...</p>
        </div>
      ) : refunds.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <p className="text-charcoal-500 mb-4">You haven't requested any refunds yet.</p>
          <p className="text-charcoal-500 text-sm max-w-md mx-auto">
            If you need to return an item or cancel an order, you can do so from the order details page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <div
              key={refund.id}
              className={`border ${
                highlightedRefundId === refund.id 
                  ? 'border-gold-400 bg-gold-50' 
                  : 'border-cream-200'
              } rounded-lg p-4 transition-all duration-300`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-medium text-charcoal-800">
                    Refund for Order #{refund.orders.order_number}
                  </p>
                  <p className="text-sm text-charcoal-500">
                    {new Date(refund.created_at).toLocaleDateString()} • {new Date(refund.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-charcoal-800">
                    {formatCurrency(refund.amount)}
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(refund.status)}
                  </div>
                </div>
              </div>
              
              {refund.reason && (
                <div className="mb-4">
                  <p className="text-sm text-charcoal-500">Reason:</p>
                  <p className="text-sm text-charcoal-700">{refund.reason}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewRefund(refund.id)}
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

export default RefundsTab;