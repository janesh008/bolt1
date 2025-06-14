import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { X, ShoppingBag, Heart, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Logo from '../ui/Logo';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-cream-50 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Logo />
                  <button
                    type="button"
                    className="text-charcoal-500 hover:text-charcoal-800 focus:outline-none"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4 space-y-6">
                  <nav className="flex flex-col space-y-4">
                    <Link 
                      to="/" 
                      className="text-lg font-medium text-charcoal-800 py-2 border-b border-cream-200"
                      onClick={onClose}
                    >
                      Home
                    </Link>
                    <Link 
                      to="/products" 
                      className="text-lg font-medium text-charcoal-800 py-2 border-b border-cream-200"
                      onClick={onClose}
                    >
                      Shop All
                    </Link>
                    <Link 
                      to="/products/gold" 
                      className="text-lg font-medium text-charcoal-800 py-2 border-b border-cream-200"
                      onClick={onClose}
                    >
                      Gold
                    </Link>
                    <Link 
                      to="/products/diamond" 
                      className="text-lg font-medium text-charcoal-800 py-2 border-b border-cream-200"
                      onClick={onClose}
                    >
                      Diamond
                    </Link>
                    <Link 
                      to="/products/silver" 
                      className="text-lg font-medium text-charcoal-800 py-2 border-b border-cream-200"
                      onClick={onClose}
                    >
                      Silver
                    </Link>
                    <Link 
                      to="/products/platinum" 
                      className="text-lg font-medium text-charcoal-800 py-2 border-b border-cream-200"
                      onClick={onClose}
                    >
                      Platinum
                    </Link>
                    <Link 
                      to="/ai-designer" 
                      className="text-lg font-medium text-charcoal-800 py-2 border-b border-cream-200 flex items-center"
                      onClick={onClose}
                    >
                      <Sparkles className="h-5 w-5 mr-2 text-gold-500" />
                      AI Designer
                    </Link>
                  </nav>

                  <div className="grid grid-cols-3 gap-4">
                    <Link 
                      to="/account" 
                      className="flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-sm"
                      onClick={onClose}
                    >
                      <User className="h-6 w-6 text-charcoal-600 mb-2" />
                      <span className="text-sm">Account</span>
                    </Link>
                    
                    <Link 
                      to="/wishlist" 
                      className="flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-sm relative"
                      onClick={onClose}
                    >
                      <Heart className="h-6 w-6 text-charcoal-600 mb-2" />
                      <span className="text-sm">Wishlist</span>
                      {wishlistItems.length > 0 && (
                        <span className="absolute top-2 right-2 bg-gold-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {wishlistItems.length}
                        </span>
                      )}
                    </Link>
                    
                    <Link 
                      to="/cart" 
                      className="flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-sm relative"
                      onClick={onClose}
                    >
                      <ShoppingBag className="h-6 w-6 text-charcoal-600 mb-2" />
                      <span className="text-sm">Cart</span>
                      {totalItems > 0 && (
                        <span className="absolute top-2 right-2 bg-gold-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {user ? (
                      <Link 
                        to="/account" 
                        className="block w-full text-center py-3 px-4 rounded-md bg-charcoal-800 text-white text-sm font-medium"
                        onClick={onClose}
                      >
                        My Account
                      </Link>
                    ) : (
                      <Link 
                        to="/login" 
                        className="block w-full text-center py-3 px-4 rounded-md bg-charcoal-800 text-white text-sm font-medium"
                        onClick={onClose}
                      >
                        Sign In
                      </Link>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MobileMenu;