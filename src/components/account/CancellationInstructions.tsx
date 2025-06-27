import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import Button from '../ui/Button';

interface CancellationInstructionsProps {
  onRequestCancellation: () => void;
}

const CancellationInstructions: React.FC<CancellationInstructionsProps> = ({ 
  onRequestCancellation 
}) => {
  return (
    <div className="bg-black text-white p-4 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-4">To cancel your order, please follow these steps:</p>
          
          <ol className="space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-gold-400 rounded-full flex items-center justify-center text-xs text-black mt-0.5">1</div>
              <span>Submit your cancellation request by clicking the "Request Order Cancellation" button below</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-gold-400 rounded-full flex items-center justify-center text-xs text-black mt-0.5">2</div>
              <span>Provide a brief reason for cancellation from the dropdown menu</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-gold-400 rounded-full flex items-center justify-center text-xs text-black mt-0.5">3</div>
              <span>Our team will review your request within 24 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-gold-400 rounded-full flex items-center justify-center text-xs text-black mt-0.5">4</div>
              <span>Once approved, we'll process your refund:
                <ul className="mt-1 space-y-1 pl-7 list-disc text-gray-300">
                  <li>Full refund for orders not yet shipped</li>
                  <li>Partial refund may apply for orders in transit</li>
                  <li>Refund will be issued to original payment method</li>
                  <li>Processing time: 5-7 business days</li>
                </ul>
              </span>
            </li>
          </ol>
          
          <div className="flex items-start gap-2 text-amber-300 mb-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Note: Orders that have been delivered cannot be cancelled.</p>
          </div>
          
          <p className="text-gray-300">
            Questions? Contact our support team at support@example.com
          </p>
        </div>
        
        <Button 
          onClick={onRequestCancellation}
          className="ml-4 whitespace-nowrap bg-gold-400 hover:bg-gold-500 text-black"
        >
          Request Order Cancellation
        </Button>
      </div>
    </div>
  );
};

export default CancellationInstructions;