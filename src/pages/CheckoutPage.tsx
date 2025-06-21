import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, User, Phone, Mail, PlusCircle, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import RazorpayPaymentSection from '../components/checkout/RazorpayPaymentSection';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { supabase } from '../lib/supabase';
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

interface SavedAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  landmark?: string;
  address_type: 'shipping' | 'billing' | 'both';
  is_default: boolean;
}

const CheckoutPage: React.FC = () => {
  const { items, totalPrice, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
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

  // Fetch saved addresses and pre-fill user data
  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
      }));
    }
    
    fetchSavedAddresses();
  }, [user]);
  
  const fetchSavedAddresses = async () => {
    if (!user) return;
    
    try {
      setIsLoadingAddresses(true);
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .in('address_type', ['shipping', 'both'])
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSavedAddresses(data || []);
      
      // Select default address if available
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        
        // Pre-fill shipping address form with default address
        setShippingAddress({
          name: defaultAddress.recipient_name,
          phone: defaultAddress.recipient_phone,
          address_line1: defaultAddress.address_line1,
          address_line2: defaultAddress.address_line2,
          city: defaultAddress.city,
          state: defaultAddress.state,
          country: defaultAddress.country || 'India',
          pincode: defaultAddress.zip_code
        });
      }
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

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

  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    
    // Update shipping address form
    setShippingAddress({
      name: address.recipient_name,
      phone: address.recipient_phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      country: address.country || 'India',
      pincode: address.zip_code
    });
    
    // Hide new address form
    setShowNewAddressForm(false);
  };
  
  const handleSaveNewAddress = async () => {
    if (!user) {
      toast.error('You must be logged in to save addresses');
      return;
    }
    
    try {
      setIsSavingAddress(true);
      
      // Validate required fields
      const requiredFields = ['name', 'phone', 'address_line1', 'city', 'state', 'pincode'];
      const missingFields = requiredFields.filter(field => !shippingAddress[field as keyof ShippingAddress]);
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Save new address
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          recipient_name: shippingAddress.name,
          recipient_phone: shippingAddress.phone,
          address_line1: shippingAddress.address_line1,
          address_line2: shippingAddress.address_line2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip_code: shippingAddress.pincode,
          country: shippingAddress.country,
          address_type: 'shipping',
          is_default: savedAddresses.length === 0 // Make default if first address
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchSavedAddresses();
      setSelectedAddressId(data.id);
      toast.success('Address saved successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setIsSavingAddress(false);
      setShowNewAddressForm(false);
    }
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
    amount: totalPrice,
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
                
                {/* Saved Addresses Section */}
                {isLoadingAddresses ? (
                  <div className="flex justify-center py-4">
                    <div className="w-8 h-8 border-4 border-cream-200 border-t-gold-400 rounded-full animate-spin"></div>
                  </div>
                ) : savedAddresses.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-charcoal-700 mb-4">Saved Addresses</h3>
                    
                    <div className="space-y-4 mb-4">
                      {savedAddresses.map((address) => (
                        <div 
                          key={address.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedAddressId === address.id 
                              ? 'border-gold-400 bg-gold-50' 
                              : 'border-cream-200 hover:border-gold-300'
                          }`}
                          onClick={() => handleSelectAddress(address)}
                        >
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-charcoal-800">
                                  {address.recipient_name}
                                </p>
                                {address.is_default && (
                                  <span className="text-xs px-2 py-0.5 bg-gold-100 text-gold-600 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-charcoal-600 mt-1">
                                {address.recipient_phone}
                              </p>
                              
                              <p className="text-charcoal-600 mt-2">
                                {address.address_line1}
                                {address.address_line2 && <>, {address.address_line2}</>}
                                {address.landmark && <>, {address.landmark}</>}
                              </p>
                              
                              <p className="text-charcoal-600">
                                {address.city}, {address.state}, {address.zip_code}
                              </p>
                              
                              <p className="text-charcoal-600">
                                {address.country || 'India'}
                              </p>
                            </div>
                            
                            {selectedAddressId === address.id && (
                              <div className="flex items-center justify-center h-6 w-6 bg-gold-400 rounded-full">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                      className="mb-4"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {showNewAddressForm ? 'Cancel New Address' : 'Add New Address'}
                    </Button>
                  </div>
                ) : null}
                
                {/* New Address Form */}
                {(showNewAddressForm || savedAddresses.length === 0) && (
                  <div className="bg-cream-50 rounded-lg p-6 border border-cream-200 mb-6">
                    <h3 className="text-lg font-medium text-charcoal-700 mb-4">
                      {savedAddresses.length === 0 ? 'Shipping Address' : 'Add New Address'}
                    </h3>
                    
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
                          value={shippingAddress.address_line2 || ''}
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
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </div>
                      
                      {savedAddresses.length > 0 && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="save_address"
                            className="h-4 w-4 text-gold-400 focus:ring-gold-400 border-cream-300 rounded"
                          />
                          <label htmlFor="save_address" className="ml-2 block text-sm text-charcoal-700">
                            Save this address for future use
                          </label>
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        {savedAddresses.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSaveNewAddress()}
                            isLoading={isSavingAddress}
                          >
                            Save Address
                          </Button>
                        )}
                        
                        <Button
                          type="submit"
                          className={savedAddresses.length > 0 ? "" : "w-full"}
                        >
                          Continue to Payment
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Continue Button for Saved Addresses */}
                {savedAddresses.length > 0 && selectedAddressId && !showNewAddressForm && (
                  <Button
                    onClick={handleAddressSubmit}
                    className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600"
                    size="lg"
                  >
                    Continue to Payment
                  </Button>
                )}
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
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-gold-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-charcoal-800">
                      ${(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-cream-200 pt-4 space-y-2">
                <div className="flex justify-between text-charcoal-600">
                  <span>Subtotal</span>
                  <span>${totalPrice.toLocaleString()}</span>
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
                    <span className="text-gold-600">${totalPrice.toLocaleString()}</span>
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