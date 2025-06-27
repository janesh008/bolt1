import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Clock, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Button from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: string;
    total_amount: number;
    payment_method?: string;
    payment_status: string;
  };
}

const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'confirmation'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('confirmation');
  };

  const handleConfirmRefund = async () => {
    try {
      setIsSubmitting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request_refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: reason || 'Customer requested cancellation'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request refund');
      }

      const data = await response.json();
      
      toast.success('Refund request submitted successfully');
      onClose();
      
      // Refresh the page to show updated order status
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Refund request error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request refund');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('form');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
        </DialogHeader>
        
        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-cream-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-charcoal-600">Order Number:</span>
                <span className="font-medium">{order.order_number}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-charcoal-600">Total Amount:</span>
                <span className="font-medium text-gold-600">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-600">Payment Method:</span>
                <span className="font-medium">{order.payment_method || 'Online Payment'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Reason for Refund
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                placeholder="Please provide a reason for your refund request..."
                rows={3}
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Refund Processing Time</p>
                  <p>Refunds typically take 3-5 business days to process. The funds will be returned to your original payment method.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
              >
                Continue
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 mb-1">Confirm Refund Request</p>
                  <p className="text-sm text-amber-700">
                    Are you sure you want to request a refund for order #{order.order_number}? This action will cancel your order.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-cream-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-charcoal-600">Refund Amount:</span>
                <span className="font-medium text-gold-600">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-charcoal-600">Refund Method:</span>
                <span className="font-medium">Original Payment Method</span>
              </div>
              {reason && (
                <div className="mt-2 pt-2 border-t border-cream-200">
                  <span className="text-charcoal-600 block mb-1">Reason:</span>
                  <p className="text-charcoal-800">{reason}</p>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Refund Information</p>
                  <p>Your refund will be processed to the original payment method used for this order. Processing time is typically 3-5 business days, depending on your payment provider.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleConfirmRefund}
                isLoading={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Refund Request
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RefundRequestModal;