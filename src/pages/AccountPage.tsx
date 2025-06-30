import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { Tabs, TabsContent } from '../components/ui/tabs';
import toast from 'react-hot-toast';

// Import components
import AccountSidebar from '../components/account/AccountSidebar';
import ProfileTab from '../components/account/ProfileTab';
import OrdersTab from '../components/account/OrdersTab';
import WishlistTab from '../components/account/WishlistTab';
import AddressesTab from '../components/account/AddressesTab';
import SettingsTab from '../components/account/SettingsTab';
import RefundsTab from '../components/account/RefundsTab';
import SupportTab from '../components/account/SupportTab';
import SupportAgent from '../components/support-agent/SupportAgent';

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
  const highlightedRefundId = searchParams.get('refund');
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<{name?: string, email?: string, phone?: string}>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  
  useEffect(() => {
    document.title = 'My Account | AXELS';
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);
  
  // Add this effect to handle tab changes from URL params
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    
    if (highlightedOrderId) {
      setActiveTab('orders');
    }

    if (highlightedRefundId) {
      setActiveTab('refunds');
    }
  }, [initialTab, highlightedOrderId, highlightedRefundId]);

  const fetchUserData = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch user profile from user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        
        // Fallback to users table if user_profiles doesn't exist
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!userError && userProfile) {
          setProfileData({
            name: userProfile.full_name || '',
            email: userProfile.email || '',
            phone: userProfile.phone || ''
          });
        }
      } else if (profile) {
        setProfileData({
          name: profile.full_name || '',
          email: profile.email || user.email || '',
          phone: profile.phone || ''
        });
      }
      
      // Fetch addresses
      setAddressesLoading(true);
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);
      setAddressesLoading(false);
        
      if (addressError) {
        console.error('Error fetching addresses:', addressError);
      } else if (addressData) {
        setAddresses(addressData);
      }
      
      // Fetch orders
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (orderError) {
        console.error('Error fetching orders:', orderError);
      } else {
        setOrders(orderData || []);
      }

      // Fetch refunds
      const { data: refundData, error: refundError } = await supabase
        .from('refunds')
        .select(`
          *,
          orders (
            order_number,
            payment_method,
            payment_status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (refundError) {
        console.error('Error fetching refunds:', refundError);
      } else {
        setRefunds(refundData || []);
      }

      // Fetch wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (wishlistError) {
        console.error('Error fetching wishlist:', wishlistError);
      } else if (wishlistData) {
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
  
  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user?.id)
        .eq('product_id', productId);
        
      if (error) throw error;
      
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
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
  
  // Add authentication check
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl text-charcoal-800 mb-4">Please Sign In</h1>
          <p className="text-charcoal-600 mb-4">You need to be signed in to view your account.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl text-charcoal-800 mb-8">My Account</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <AccountSidebar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            ordersCount={orders.length}
            wishlistCount={wishlistItems.length}
            refundsCount={refunds.length}
            onSignOut={handleSignOut}
          />
          
          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="profile">
                <ProfileTab 
                  userId={user.id} 
                  initialData={profileData}
                />
              </TabsContent>
              
              <TabsContent value="orders">
                <OrdersTab 
                  userId={user.id}
                  highlightedOrderId={highlightedOrderId}
                />
              </TabsContent>
              
              <TabsContent value="refunds">
                <RefundsTab 
                  userId={user.id}
                  highlightedRefundId={highlightedRefundId}
                />
              </TabsContent>
              
              <TabsContent value="wishlist">
                <div className="bg-white rounded-lg shadow-soft p-6">
                  <h2 className="text-xl font-medium text-charcoal-800 mb-6">My Wishlist</h2>
                  <WishlistTab 
                    items={wishlistItems}
                    onRemoveItem={handleRemoveFromWishlist}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="addresses">
                <AddressesTab />
              </TabsContent>
              
              <TabsContent value="settings">
                <SettingsTab onSignOut={handleSignOut} />
              </TabsContent>
              
              <TabsContent value="support">
                <SupportTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Support Agent */}
      <SupportAgent />
    </div>
  );
};

export default AccountPage;