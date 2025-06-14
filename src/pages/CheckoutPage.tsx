import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CreditCard, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { RazorpayPaymentButton } from '../components/checkout/RazorpayPaymentButton';
import { toast } from 'react-hot-toast';

interface ShippingData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingData, setShippingData] = useState<ShippingData | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const handleShippingSubmit = (data: ShippingData) => {
    setShippingData(data);
    setCurrentStep(2);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    toast.success('Payment successful! Your order has been placed.');
    clearCart();
    navigate('/account?tab=orders');
  };

  const handlePaymentError = (error: any) => {
    toast.error('Payment failed. Please try again.');
    console.error('Payment error:', error);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal-800 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-gold-500 text-white px-6 py-2 rounded-lg hover:bg-gold-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-charcoal-600 hover:text-charcoal-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-charcoal-800">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-gold-600' : 'text-charcoal-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-gold-500 text-white' : 'bg-charcoal-200'}`}>
                {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
              </div>
              <span className="ml-2 font-medium">Shipping</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-gold-500' : 'bg-charcoal-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-gold-600' : 'text-charcoal-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-gold-500 text-white' : 'bg-charcoal-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <ShippingForm onSubmit={handleShippingSubmit} />
            )}

            {currentStep === 2 && shippingData && items.length > 0 && (
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
                      <span>₹{totalPrice.toLocaleString()}</span>
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
                        <span className="text-gold-600">₹{totalPrice.toLocaleString()}</span>
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

                {/* Payment Button */}
                <RazorpayPaymentButton
                  productId={items[0].product_id} // Using first item for now
                  buttonText={`Pay ₹${totalPrice.toLocaleString()} Securely`}
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />

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
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary items={items} totalPrice={totalPrice} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Shipping Form Component
function ShippingForm({ onSubmit }: { onSubmit: (data: ShippingData) => void }) {
  const [formData, setFormData] = useState<ShippingData>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-cream-200">
      <h3 className="text-lg font-semibold text-charcoal-800 mb-6">Shipping Information</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            Address Line 1 *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            Address Line 2
          </label>
          <input
            type="text"
            name="address2"
            value={formData.address2}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              State *
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-2">
              Pincode *
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            Country *
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          >
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-gold-500 text-white py-3 px-4 rounded-lg hover:bg-gold-600 transition-colors font-medium"
        >
          Continue to Payment
        </button>
      </form>
    </div>
  );
}

// Order Summary Component
function OrderSummary({ items, totalPrice }: { items: any[], totalPrice: number }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-cream-200 sticky top-8">
      <h3 className="text-lg font-semibold text-charcoal-800 mb-4">Order Summary</h3>
      
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <img
              src={item.image_url || '/placeholder-product.jpg'}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-charcoal-800">{item.name}</h4>
              <p className="text-xs text-charcoal-600">Qty: {item.quantity}</p>
            </div>
            <span className="text-sm font-medium text-charcoal-800">
              ₹{(item.price * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-cream-200 pt-4 space-y-2">
        <div className="flex justify-between text-charcoal-600">
          <span>Subtotal</span>
          <span>₹{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-charcoal-600">
          <span>Shipping</span>
          <span className="text-green-600">Free</span>
        </div>
        <div className="flex justify-between font-medium text-charcoal-800 pt-2 border-t border-cream-200">
          <span>Total</span>
          <span className="text-gold-600">₹{totalPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}