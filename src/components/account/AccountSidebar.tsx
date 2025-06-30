import React from 'react';
import { User, Package, Heart, CreditCard, Settings, LogOut, RefreshCw, Headphones } from 'lucide-react';

interface AccountSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  ordersCount: number;
  wishlistCount: number;
  refundsCount: number;
  onSignOut: () => Promise<void>;
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({
  activeTab,
  onTabChange,
  ordersCount,
  wishlistCount,
  refundsCount,
  onSignOut
}) => {
  return (
    <aside className="w-full md:w-64 space-y-2">
      <button
        onClick={() => onTabChange('profile')}
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
        onClick={() => onTabChange('orders')}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          activeTab === 'orders'
            ? 'bg-gold-400 text-white'
            : 'hover:bg-cream-100 text-charcoal-600'
        }`}
      >
        <Package className="h-5 w-5" />
        <span>Orders</span>
        {ordersCount > 0 && (
          <span className="ml-auto bg-cream-200 text-charcoal-800 text-xs px-2 py-1 rounded-full">
            {ordersCount}
          </span>
        )}
      </button>
      
      <button
        onClick={() => onTabChange('refunds')}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          activeTab === 'refunds'
            ? 'bg-gold-400 text-white'
            : 'hover:bg-cream-100 text-charcoal-600'
        }`}
      >
        <RefreshCw className="h-5 w-5" />
        <span>Refunds</span>
        {refundsCount > 0 && (
          <span className="ml-auto bg-cream-200 text-charcoal-800 text-xs px-2 py-1 rounded-full">
            {refundsCount}
          </span>
        )}
      </button>
      
      <button
        onClick={() => onTabChange('wishlist')}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          activeTab === 'wishlist'
            ? 'bg-gold-400 text-white'
            : 'hover:bg-cream-100 text-charcoal-600'
        }`}
      >
        <Heart className="h-5 w-5" />
        <span>Wishlist</span>
        {wishlistCount > 0 && (
          <span className="ml-auto bg-cream-200 text-charcoal-800 text-xs px-2 py-1 rounded-full">
            {wishlistCount}
          </span>
        )}
      </button>
      
      <button
        onClick={() => onTabChange('addresses')}
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
        onClick={() => onTabChange('settings')}
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
        onClick={() => onTabChange('support')}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          activeTab === 'support'
            ? 'bg-gold-400 text-white'
            : 'hover:bg-cream-100 text-charcoal-600'
        }`}
      >
        <Headphones className="h-5 w-5" />
        <span>Support</span>
      </button>
      
      <button
        onClick={onSignOut}
        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-error-500 hover:bg-error-100 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Sign Out</span>
      </button>
    </aside>
  );
};

export default AccountSidebar;