import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { supabase, getCurrentUser } from '../../lib/supabase';

interface RazorpayCheckoutProps {
  orderData: {
    items: Array<{
      product_id: string;
      quantity: number;
    }>;
    shipping_address: {
      name: string;
      phone: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
    };
    amount: number; // Total amount in INR (number)
  };
  onSuccess?: (paymentData: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  orderData,
  onSuccess,
  onError
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

  const createOrder = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_payment_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          items: orderData.items,
          shippingAddress: orderData.shipping_address,
        }),
      });

      if (!response.ok) {
      const errorText = await response.text();
      console.error('Create order failed:', errorText);
      throw new Error(errorText || 'Failed to create payment session');
    }

      return await response.json();
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentData: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify_payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorText = await response.text();
        console.error('Payment verification failed - :', errorText);
        throw new Error(errorData.error || 'Payment verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) throw new Error('Failed to load Razorpay SDK');

      const orderResponse = await createOrder();

      if (!orderResponse || !orderResponse.razorpayOrderId)
        throw new Error('Invalid order response from server');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_95lpU4BLVjzNkI',
        amount: orderResponse.amount * 100, // paise
        currency: orderResponse.currency || 'INR',
        name: 'AXELS Jewelry',
        description: `Order #${orderResponse.orderId}`,
        image: '/favicon.svg',
        order_id: orderResponse.razorpayOrderId,
        handler: async (response: any) => {
          try {
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderResponse.orderId,
            };
            const verificationResponse = await verifyPayment(verificationData);

            if (verificationResponse.success) {
              clearCart();
              toast.success('Payment successful! Your order has been confirmed.');
              if (onSuccess) {
                onSuccess({
                  order: verificationResponse.order,
                  payment: response,
                });
              }
              navigate(`/account?tab=orders&highlight=${orderResponse.orderId}`);
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
          name: orderData.shipping_address.name,
          email: user?.email || '',
          contact: orderData.shipping_address.phone,
        },
        notes: {
          order_id: orderResponse.orderId,
          shipping_address: JSON.stringify(orderData.shipping_address),
        },
        theme: {
          color: '#C6A050',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

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
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-gold-50 to-cream-100 rounded-lg p-6 border border-gold-200">
        <h3 className="text-lg font-semibold text-charcoal-800 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-gold-500" />
          Payment Summary
        </h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-charcoal-600">
            <span>Subtotal</span>
            <span>₹{orderData.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <span>Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <span>Taxes</span>
            <span>Included</span>
          </div>
          <div className="border-t border-gold-200 pt-3">
            <div className="flex justify-between font-medium text-charcoal-800">
              <span>Total</span>
              <span className="text-gold-600">₹{orderData.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white rounded-lg p-6 border border-cream-200">
        <h4 className="font-medium text-charcoal-800 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-green-600" />
          Secure Payment
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-charcoal-600">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            256-bit SSL Encryption
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            PCI DSS Compliant
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Razorpay Secured
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg p-6 border border-cream-200">
        <h4 className="font-medium text-charcoal-800 mb-4">Accepted Payment Methods</h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-center p-3 border border-cream-200 rounded-lg">
            <span className="text-sm font-medium text-charcoal-600">Credit Card</span>
          </div>
          <div className="flex items-center justify-center p-3 border border-cream-200 rounded-lg">
            <span className="text-sm font-medium text-charcoal-600">Debit Card</span>
          </div>
          <div className="flex items-center justify-center p-3 border border-cream-200 rounded-lg">
            <span className="text-sm font-medium text-charcoal-600">Net Banking</span>
          </div>
          <div className="flex items-center justify-center p-3 border border-cream-200 rounded-lg">
            <span className="text-sm font-medium text-charcoal-600">UPI</span>
          </div>
        </div>
      </div>

      {/* Pay Now Button */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay ₹{orderData.amount.toLocaleString()} Securely
          </>
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-charcoal-500 text-center">
        By proceeding with payment, you agree to our{' '}
        <a href="/terms" className="text-gold-500 hover:text-gold-600 underline">
          Terms & Conditions
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-gold-500 hover:text-gold-600 underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
};

export default RazorpayCheckout;
