import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

interface RazorpayPaymentButtonProps {
  productId: string;
  amount?: number;
  buttonText?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  className?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPaymentButton: React.FC<RazorpayPaymentButtonProps> = ({
  productId,
  amount,
  buttonText = 'Pay Securely',
  onSuccess,
  onError,
  className = '',
}) => {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createPaymentSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_payment_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productId: productId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }

      return await response.json();
    } catch (error) {
      console.error('Create payment session error:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please sign in to make a purchase');
      navigate('/login');
      return;
    }

    try {
      setIsProcessing(true);

      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create payment session
      const paymentSession = await createPaymentSession();
      const { orderId, razorpayOrderId, amount: sessionAmount, currency } = paymentSession;

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: sessionAmount * 100, // Razorpay expects amount in paise
        currency: currency,
        name: 'AXELS Jewelry',
        description: 'Purchase from AXELS',
        image: '/favicon.svg',
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verificationResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify_payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.access_token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId
              }),
            });

            if (!verificationResponse.ok) {
              const errorData = await verificationResponse.json();
              throw new Error(errorData.error || 'Payment verification failed');
            }

            const verificationData = await verificationResponse.json();

            if (verificationData.success) {
              // Clear cart
              clearCart();
              
              // Show success message
              toast.success('Payment successful! Your order has been confirmed.');
              
              // Call success callback
              if (onSuccess) {
                onSuccess(verificationData);
              }

              // Redirect to order confirmation
              navigate(`/account?tab=orders&highlight=${orderId}`);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
            if (onError) onError(error);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          contact: user.user_metadata?.phone || ''
        },
        notes: {
          order_id: orderId,
          product_id: productId
        },
        theme: {
          color: '#C6A050'
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error('Payment cancelled');
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate payment');
      if (onError) onError(error);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing}
      className={`inline-flex items-center justify-center py-3 px-6 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5 mr-2" />
          {buttonText}
        </>
      )}
    </button>
  );
};

export default RazorpayPaymentButton;