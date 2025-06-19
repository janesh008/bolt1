import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, User, Phone, Mail } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import RazorpayPaymentSection from '../components/checkout/RazorpayPaymentSection';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ShippingAddress {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

const CheckoutPage: React.FC = () => {
  const { items, total, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [items, loading, navigate]);

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
      }));
    }
  }, [user]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['name', 'phone', 'address_line1', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field as keyof ShippingAddress]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setStep('payment');
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }

  const orderData = {
    items: items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
    shipping_address: shippingAddress,
    amount: total,
  };

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal-800 mb-2">Checkout</h1>
          <p className="text-charcoal-600">Complete your order securely</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'address' ? 'bg-gold-500 text-white' : 'bg-gold-100 text-gold-600'
            }`}>
              1
            </div>
            <span className={`text-sm font-medium ${
              step === 'address' ? 'text-gold-600' : 'text-charcoal-500'
            }`}>
              Shipping Address
            </span>
            <div className="w-12 h-0.5 bg-cream-300"></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'payment' ? 'bg-gold-500 text-white' : 'bg-cream-200 text-charcoal-400'
            }`}>
              2
            </div>
            <span className={`text-sm font-medium ${
              step === 'payment' ? 'text-gold-600' : 'text-charcoal-400'
            }`}>
              Payment
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'address' && (
              <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6">
                <h2 className="text-xl font-semibold text-charcoal-800 mb-6 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gold-500" />
                  Shipping Address
                </h2>

                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        <User className="h-4 w-4 inline mr-1" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address_line1}
                      onChange={(e) => handleInputChange('address_line1', e.target.value)}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="Street address, apartment, suite, etc."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address_line2}
                      onChange={(e) => handleInputChange('address_line2', e.target.value)}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-2">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.pincode}
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                        className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-cream-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      required
                    >
                      <option value="India">India</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600"
                    size="lg"
                  >
                    Continue to Payment
                  </Button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-charcoal-800">Payment</h2>
                  <Button
                    variant="outline"
                    onClick={() => setStep('address')}
                    size="sm"
                  >
                    Edit Address
                  </Button>
                </div>

                <RazorpayPaymentSection orderData={orderData} />
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-charcoal-800 mb-4 flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-gold-500" />
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-cream-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-gold-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-800 truncate">
                        {item.product?.name || 'Product'}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-charcoal-800">
                      ₹{(Number(item.product?.price || 0) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-cream-200 pt-4 space-y-2">
                <div className="flex justify-between text-charcoal-600">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Taxes</span>
                  <span>Included</span>
                </div>
                <div className="border-t border-cream-200 pt-2">
                  <div className="flex justify-between font-semibold text-charcoal-800">
                    <span>Total</span>
                    <span className="text-gold-600">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {step === 'address' && (
                <div className="mt-6 p-4 bg-gold-50 rounded-lg border border-gold-200">
                  <p className="text-sm text-gold-700">
                    <strong>Free shipping</strong> on all orders. Secure payment with 256-bit SSL encryption.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;