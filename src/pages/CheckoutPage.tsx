import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { CreditCard, Truck, ChevronRight, MapPin, User, Phone, Mail } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import RazorpayCheckout from '../components/checkout/RazorpayCheckout';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  notes?: string;
}

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment'>('shipping');
  const [isLoading, setIsLoading] = useState(false);
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ShippingFormData>();
  
  useEffect(() => {
    document.title = 'Checkout | AXELS';
    
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Load user data if available
    if (user) {
      loadUserData();
    }
  }, [items.length, navigate, user]);

  const loadUserData = async () => {
    try {
      // Try to get customer data
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (customer) {
        setValue('firstName', customer.first_name || '');
        setValue('lastName', customer.last_name || '');
        setValue('email', customer.email || '');
        setValue('phone', customer.phone || '');
      }

      // Try to get user profile data
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (userProfile) {
        const [firstName, ...lastNameParts] = (userProfile.full_name || '').split(' ');
        setValue('firstName', firstName || '');
        setValue('lastName', lastNameParts.join(' ') || '');
        setValue('email', userProfile.email || '');
        setValue('phone', userProfile.phone || '');
        setValue('city', userProfile.city || '');
        setValue('state', userProfile.state || '');
        setValue('pincode', userProfile.zip_code || '');
        setValue('country', userProfile.country || 'India');
      }

      // Try to get default address
      const { data: address } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_default', true)
        .maybeSingle();

      if (address) {
        setValue('address', address.address || '');
        setValue('city', address.city || '');
        setValue('state', address.state || '');
        setValue('pincode', address.zip_code || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  const handleShippingSubmit = async (data: ShippingFormData) => {
    try {
      setIsLoading(true);

      // Validate that we have products in cart
      if (items.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
        return;
      }

      // Ensure user is authenticated
      if (!user) {
        toast.error('Please sign in to continue');
        navigate('/login');
        return;
      }

      // Create or update customer profile
      const { error: customerError } = await supabase
        .from('customers')
        .upsert({
          user_id: user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone
        }, {
          onConflict: 'user_id'
        });

      if (customerError) {
        console.error('Customer upsert error:', customerError);
        toast.error('Failed to save customer information');
        return;
      }

      // Save shipping data and proceed to payment
      setShippingData(data);
      setCurrentStep('payment');
      
    } catch (error) {
      console.error('Shipping form error:', error);
      toast.error('Failed to process shipping information');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    toast.success('Order placed successfully!');
    clearCart();
    navigate('/account?tab=orders');
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/products')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-cream-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${currentStep === 'shipping' ? 'text-gold-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'shipping' ? 'bg-gold-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {currentStep === 'payment' ? '✓' : '1'}
                </div>
                <span className="ml-2 font-medium">Shipping</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${currentStep === 'payment' ? 'text-gold-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'payment' ? 'bg-gold-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentStep === 'shipping' ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg shadow-soft p-6"
                >
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-gold-500" />
                    Shipping Information
                  </h2>
                  
                  <form onSubmit={handleSubmit(handleShippingSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="font-medium text-charcoal-800 mb-4 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            {...register('firstName', { required: 'First name is required' })}
                            className="mt-1"
                          />
                          {errors.firstName && (
                            <span className="text-sm text-red-600">{errors.firstName.message}</span>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            {...register('lastName', { required: 'Last name is required' })}
                            className="mt-1"
                          />
                          {errors.lastName && (
                            <span className="text-sm text-red-600">{errors.lastName.message}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="font-medium text-charcoal-800 mb-4 flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            {...register('email', { 
                              required: 'Email is required',
                              pattern: {
                                value: /^\S+@\S+$/i,
                                message: 'Invalid email address'
                              }
                            })}
                            className="mt-1"
                          />
                          {errors.email && (
                            <span className="text-sm text-red-600">{errors.email.message}</span>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...register('phone', { 
                              required: 'Phone number is required',
                              pattern: {
                                value: /^[0-9]{10}$/,
                                message: 'Please enter a valid 10-digit phone number'
                              }
                            })}
                            className="mt-1"
                            placeholder="10-digit mobile number"
                          />
                          {errors.phone && (
                            <span className="text-sm text-red-600">{errors.phone.message}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h3 className="font-medium text-charcoal-800 mb-4 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Shipping Address
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="address">Address Line 1 *</Label>
                          <Input
                            id="address"
                            {...register('address', { required: 'Address is required' })}
                            className="mt-1"
                            placeholder="House/Flat No., Street Name"
                          />
                          {errors.address && (
                            <span className="text-sm text-red-600">{errors.address.message}</span>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                          <Input
                            id="address2"
                            {...register('address2')}
                            className="mt-1"
                            placeholder="Landmark, Area"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="city">City *</Label>
                            <Input
                              id="city"
                              {...register('city', { required: 'City is required' })}
                              className="mt-1"
                            />
                            {errors.city && (
                              <span className="text-sm text-red-600">{errors.city.message}</span>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="state">State *</Label>
                            <Input
                              id="state"
                              {...register('state', { required: 'State is required' })}
                              className="mt-1"
                            />
                            {errors.state && (
                              <span className="text-sm text-red-600">{errors.state.message}</span>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="pincode">Pincode *</Label>
                            <Input
                              id="pincode"
                              {...register('pincode', { 
                                required: 'Pincode is required',
                                pattern: {
                                  value: /^[0-9]{6}$/,
                                  message: 'Please enter a valid 6-digit pincode'
                                }
                              })}
                              className="mt-1"
                              placeholder="6-digit pincode"
                            />
                            {errors.pincode && (
                              <span className="text-sm text-red-600">{errors.pincode.message}</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="country">Country *</Label>
                          <Input
                            id="country"
                            {...register('country', { required: 'Country is required' })}
                            defaultValue="India"
                            className="mt-1"
                          />
                          {errors.country && (
                            <span className="text-sm text-red-600">{errors.country.message}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Notes */}
                    <div>
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        {...register('notes')}
                        className="mt-1"
                        placeholder="Any special instructions for delivery..."
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full py-3"
                      isLoading={isLoading}
                      size="lg"
                    >
                      Continue to Payment
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg shadow-soft p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-gold-500" />
                      Payment
                    </h2>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('shipping')}
                      size="sm"
                    >
                      Back to Shipping
                    </Button>
                  </div>
                  
                  {shippingData && (
                    <RazorpayCheckout
                      orderData={{
                        amount: totalPrice,
                        currency: 'INR',
                        items: items.map(item => ({
                          product_id: item.id,
                          quantity: item.quantity
                        })),
                        shipping_address: {
                          name: `${shippingData.firstName} ${shippingData.lastName}`,
                          phone: shippingData.phone,
                          address_line1: shippingData.address,
                          address_line2: shippingData.address2,
                          city: shippingData.city,
                          state: shippingData.state,
                          country: shippingData.country,
                          pincode: shippingData.pincode
                        }
                      }}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  )}
                </motion.div>
              )}
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-soft p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-charcoal-800 text-sm line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-sm text-charcoal-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-gold-600">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-cream-200 pt-4 space-y-3">
                  <div className="flex justify-between text-charcoal-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Taxes</span>
                    <span>Included</span>
                  </div>
                  <div className="border-t border-cream-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-charcoal-800">
                      <span>Total</span>
                      <span className="text-gold-600">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center text-green-700">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Secure Payment</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;