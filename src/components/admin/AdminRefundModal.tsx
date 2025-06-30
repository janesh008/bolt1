import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  DollarSign,
  User,
  CreditCard
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import Button from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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
  orders?: {
    order_number: string;
  };
  full_name?: string;
  email?: string;
  order_number?: string;
  processed_by_name?: string;
  processed_by_role?: string;
interface AdminRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  refund: Refund;
  onRefundProcessed: () => void;
}

const AdminRefundModal: React.FC<AdminRefundModalProps> = ({
  isOpen,
  onClose,
  refund,
  onRefundProcessed
}) => {
  const [newStatus, setNewStatus] = useState<string>(refund.status);
  const [adminNotes, setAdminNotes] = useState<string>(refund.admin_notes || '');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleProcessRefund = async () => {
    if (newStatus === refund.status) {
      toast.error('Please select a different status');
      return;
    }

    try {
      setIsProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process_refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          refundId: refund.id,
          status: newStatus,
          adminNotes: adminNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }
      
      toast.success(`Refund status updated to ${newStatus}`);
      onRefundProcessed();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Refund Details - Order #{refund.orders?.order_number || 'Unknown'}</span>
            <div>
              {getStatusBadge(refund.status)}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Refund Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Refund Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Refund ID:</span>
                  <span className="font-mono text-sm">{refund.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(refund.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span>{refund.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID:</span>
                  <span className="font-mono text-sm">{refund.payment_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Requested:</span>
                  <span>{formatDate(refund.created_at)}</span>
                </div>
                {refund.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed:</span>
                    <span>{formatDate(refund.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Customer Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span>{refund.full_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span>{refund.email || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Number:</span>
                  <span className="font-medium">#{refund.order_number || 'Unknown'}</span>
                </div>
              </div>
              
              {refund.reason && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Reason for Refund:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{refund.reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Process Refund */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Process Refund</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue>
                      {getStatusBadge(newStatus)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        {getStatusBadge('pending')}
                        <span>Pending</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="processing">
                      <div className="flex items-center gap-2">
                        {getStatusBadge('processing')}
                        <span>Processing</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        {getStatusBadge('completed')}
                        <span>Completed</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        {getStatusBadge('rejected')}
                        <span>Rejected</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {newStatus === 'completed' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Complete Refund</p>
                        <p>This will process the refund to the customer's original payment method and update the order status.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {newStatus === 'rejected' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Reject Refund</p>
                        <p>This will reject the refund request. Please provide a reason in the admin notes.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this refund (visible to admins only)"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleProcessRefund}
                isLoading={isProcessing}
                disabled={newStatus === refund.status || isProcessing}
                className={
                  newStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' :
                  newStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                  undefined
                }
              >
                {newStatus === 'completed' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Process Refund
                  </>
                ) : newStatus === 'rejected' ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Refund
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
              Payment Information
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method:</span>
                <span>{refund.payment_method}</span>
              </div>
              {refund.payment_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID:</span>
                  <span className="font-mono text-sm">{refund.payment_id}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Refund Amount:</span>
                <span className="font-medium text-green-600">{formatCurrency(refund.amount)}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Refund Processing Information</p>
                    <p>Refunds are processed to the customer's original payment method. Processing time is typically 3-5 business days, depending on the payment provider.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminRefundModal;
