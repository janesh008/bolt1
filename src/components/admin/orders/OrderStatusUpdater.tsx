import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import Button from '../../ui/Button';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdated: (newStatus: string) => void;
}

const OrderStatusUpdater: React.FC<OrderStatusUpdaterProps> = ({
  orderId,
  currentStatus,
  onStatusUpdated
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'warning' as const, label: 'Pending' },
      confirmed: { variant: 'secondary' as const, label: 'Confirmed' },
      processing: { variant: 'secondary' as const, label: 'Processing' },
      shipped: { variant: 'default' as const, label: 'Shipped' },
      delivered: { variant: 'success' as const, label: 'Delivered' },
      cancelled: { variant: 'error' as const, label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleStatusChange = async () => {
    if (status === currentStatus) {
      toast.error('Please select a different status');
      return;
    }

    try {
      setIsUpdating(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_order_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          orderId,
          status,
          notes: notes || `Status updated to ${status}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      const data = await response.json();
      
      toast.success(`Order status updated to ${status}`);
      onStatusUpdated(status);
      setShowNotes(false);
      setNotes('');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {getStatusBadge(status)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  {getStatusBadge('pending')}
                  <span>Pending</span>
                </div>
              </SelectItem>
              <SelectItem value="confirmed">
                <div className="flex items-center gap-2">
                  {getStatusBadge('confirmed')}
                  <span>Confirmed</span>
                </div>
              </SelectItem>
              <SelectItem value="processing">
                <div className="flex items-center gap-2">
                  {getStatusBadge('processing')}
                  <span>Processing</span>
                </div>
              </SelectItem>
              <SelectItem value="shipped">
                <div className="flex items-center gap-2">
                  {getStatusBadge('shipped')}
                  <span>Shipped</span>
                </div>
              </SelectItem>
              <SelectItem value="delivered">
                <div className="flex items-center gap-2">
                  {getStatusBadge('delivered')}
                  <span>Delivered</span>
                </div>
              </SelectItem>
              <SelectItem value="cancelled">
                <div className="flex items-center gap-2">
                  {getStatusBadge('cancelled')}
                  <span>Cancelled</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {status !== currentStatus && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowNotes(true)}
            disabled={isUpdating}
          >
            Update Status
          </Button>
        )}
      </div>
      
      {showNotes && (
        <div className="space-y-3 p-3 border border-cream-200 rounded-md bg-cream-50">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1">
              Add notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
              placeholder="Add any notes about this status change..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotes(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleStatusChange}
              isLoading={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusUpdater;