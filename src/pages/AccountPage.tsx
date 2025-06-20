import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Settings, Package, CreditCard, LogOut, Heart, ShoppingBag, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import OrderDetails from '../components/account/OrderDetails';
import toast from 'react-hot-toast';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

interface Address {
  id: string;
  address: string;
  type: string;
  is_default: boolean;
}

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const highlightedOrderId = searchParams.get('highlight');
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(highlightedOrderId);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileForm>();
  
  useEffect(() => {
    document.title = 'My Account | AXELS';
    fetchUserData();
  }, []);
  
  // Add this effect to handle tab changes from URL params
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    
    if (highlightedOrderId) {
      setSelectedOrderId(highlightedOrderId);
      setActiveTab('orders');
    }
  }, [initialTab, highlightedOrderId]);
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      if (profile) {
        setValue('name', profile.full_name || '');
        setValue('email', profile.email || '');
        setValue('phone', profile.phone || '');
      }
      
      // Fetch addresses
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id);
        
      if (addressData) {
        setAddresses(addressData);
      }
      
      // Fetch orders - Updated query to use customer_id and proper relationships
      console.log('Fetching orders for user:', user?.id);
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              *,
              product_images (*)
            )
          )
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (orderError) {
        console.error('Error fetching orders:', orderError);
      } else {
        console.log('Fetched orders:', orderData);
        setOrders(orderData || []);
      }

      // Fetch wishlist items
      const { data: wishlistData } = await supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            product_name,
            name,
            price,
            product_images (
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (wishlistData) {
        setWishlistItems(wishlistData.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          name: item.products?.product_name || item.products?.name || 'Unknown Product',
          price: item.products?.price || 0,
          image: item.products?.product_images?.[0]?.image_url || '',
          created_at: item.created_at,
        })));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load account data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (data: ProfileForm) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: data.name,
          phone: data.phone
        })
        .eq('id', user?.id);
        
      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleViewOrder = (orderId: string) => {
    console.log('Viewing order:', orderId);
    setSelectedOrderId(orderId);
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl text-charcoal-800 mb-8">My Account</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-gold-400 text-white'
                  : 'hover:bg-cream-100 text-charcoal-600'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('orders');
                setSelectedOrderId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'orders'
                  ? 'bg-gold-400 text-white'
                  : 'hover:bg-cream-100 text-charcoal-600'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Orders</span>
              {orders.length > 0 && (
                <span className="ml-auto bg-cream-200 text-charcoal-800 text-xs px-2 py-1 rounded-full">
                  {orders.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'wishlist'
                  ? 'bg-gold-400 text-white'
                  : 'hover:bg-cream-100 text-charcoal-600'
              }`}
            >
              <Heart className="h-5 w-5" />
              <span>Wishlist</span>
              {wishlistItems.length > 0 && (
                <span className="ml-auto bg-cream-200 text-charcoal-800 text-xs px-2 py-1 rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'addresses'
                  ? 'bg-gold-400 text-white'
                  : 'hover:bg-cream-100 text-charcoal-600'
              }`}
            >
              <CreditCard className="h-5 w-5" />
              <span>Addresses</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-gold-400 text-white'
                  : 'hover:bg-cream-100 text-charcoal-600'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-error-500 hover:bg-error-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </aside>
          
          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="profile">
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-medium text-charcoal-800 mb-6">Profile Information</h2>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-600 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        className="w-full px-4 py-2 rounded-md border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-charcoal-600 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        disabled
                        className="w-full px-4 py-2 rounded-md border border-cream-200 bg-cream-50 cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-charcoal-600 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full px-4 py-2 rounded-md border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>
                    
                    <Button type="submit" className="mt-4">
                      Save Changes
                    </Button>
                  </form>
                </div>
              </TabsContent>
              
              <TabsContent value="orders">
                <div className="bg-white rounded-lg shadow-soft p-6">
                  {selectedOrderId ? (
                    <OrderDetails 
                      orderId={selectedOrderId} 
                      onBack={handleBackToOrders} 
                    />
                  ) : (
                    <>
                      <h2 className="text-xl font-medium text-charcoal-800 mb-6">Order History</h2>
                      
                      {orders.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingBag className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                          <p className="text-charcoal-500 mb-4">You haven't placed any orders yet.</p>
                          <Button onClick={() => window.location.href = '/products'}>
                            Start Shopping
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order: any) => (
                            <div
                              key={order.id}
                              className={`border ${
                                highlightedOrderId === order.id 
                                  ? 'border-gold-400 bg-gold-50' 
                                  : 'border-cream-200'
                              } rounded-lg p-4 transition-all duration-300`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="font-medium text-charcoal-800">
                                    Order #{order.order_number}
                                  </p>
                                  <p className="text-sm text-charcoal-500">
                                    {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-charcoal-800">
                                    {formatCurrency(order.total_amount)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant={
                                        order.status === 'delivered' ? 'success' : 
                                        order.status === 'cancelled' ? 'error' : 
                                        order.status === 'pending' ? 'warning' : 
                                        'secondary'
                                      }
                                      className="capitalize"
                                    >
                                      {order.status}
                                    </Badge>
                                    <Badge 
                                      variant={
                                        order.payment_status === 'completed' ? 'success' : 
                                        order.payment_status === 'failed' ? 'error' : 
                                        'warning'
                                      }
                                    >
                                      {order.payment_status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {order.order_items?.slice(0, 2).map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center space-x-4"
                                  >
                                    <div className="w-12 h-12 bg-cream-100 rounded-lg flex items-center justify-center overflow-hidden">
                                      {item.products?.product_images?.[0]?.image_url ? (
                                        <img
                                          src={item.products.product_images[0].image_url}
                                          alt={item.products?.name || item.products?.product_name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Package className="h-6 w-6 text-charcoal-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-charcoal-800 text-sm">
                                        {item.products?.product_name || item.products?.name || 'Product'}
                                      </p>
                                      <p className="text-xs text-charcoal-500">
                                        Qty: {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                
                                {order.order_items && order.order_items.length > 2 && (
                                  <p className="text-xs text-charcoal-500">
                                    +{order.order_items.length - 2} more items
                                  </p>
                                )}
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-cream-200 flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewOrder(order.id)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="wishlist">
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-medium text-charcoal-800 mb-6">My Wishlist</h2>
                  
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
                      <p className="text-charcoal-500 mb-4">Your wishlist is empty.</p>
                      <Button onClick={() => window.location.href = '/products'}>
                        Explore Products
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="border border-cream-200 rounded-lg overflow-hidden">
                          <div className="aspect-square bg-cream-100">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-charcoal-800 line-clamp-1">{item.name}</h3>
                            <p className="text-gold-500 mt-1">{formatCurrency(item.price)}</p>
                            <div className="flex gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => window.location.href = `/product/${item.product_id}`}
                              >
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1"
                              >
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="addresses">
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-medium text-charcoal-800 mb-6">Saved Addresses</h2>
                  
                  {addresses.length === 0 ? (
                    <p className="text-charcoal-500">No addresses found.</p>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="border border-cream-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-charcoal-800 capitalize">
                                {address.type}
                              </p>
                              <p className="text-charcoal-600 mt-1">
                                {address.address}
                              </p>
                            </div>
                            {address.is_default && (
                              <span className="text-sm text-gold-400 font-medium">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button className="mt-6">
                    Add New Address
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-medium text-charcoal-800 mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-charcoal-800 mb-2">
                        Email Preferences
                      </h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded text-gold-400 focus:ring-gold-400" />
                          <span className="text-charcoal-600">Order updates</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded text-gold-400 focus:ring-gold-400" />
                          <span className="text-charcoal-600">Promotional emails</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded text-gold-400 focus:ring-gold-400" />
                          <span className="text-charcoal-600">New product launches</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-charcoal-800 mb-2">
                        Password
                      </h3>
                      <Button variant="outline">
                        Change Password
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-charcoal-800 mb-2">
                        Delete Account
                      </h3>
                      <p className="text-charcoal-500 text-sm mb-2">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button variant="outline" className="text-error-500 border-error-500 hover:bg-error-50">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;