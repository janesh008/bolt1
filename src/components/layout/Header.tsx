import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, Heart, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { cn } from '../../lib/utils';
import Logo from '../ui/Logo';
import MobileMenu from './MobileMenu';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isDevMode } = useAuth();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  
  const isHomePage = pathname === '/';
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        {
          'bg-transparent': !isScrolled && isHomePage,
          'bg-cream-50 shadow-soft': isScrolled || !isHomePage
        }
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="mr-4 lg:hidden focus:outline-none" 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6 text-charcoal-600" />
          </button>
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>
        </div>
        
        <nav className="hidden lg:flex items-center space-x-8">
          <Link to="/" className={cn(
            'text-sm font-medium transition-colors',
            pathname === '/' ? 'text-charcoal-800' : 'text-charcoal-500 hover:text-charcoal-800'
          )}>
            Home
          </Link>
          <Link to="/products" className={cn(
            'text-sm font-medium transition-colors',
            pathname.includes('/products') ? 'text-charcoal-800' : 'text-charcoal-500 hover:text-charcoal-800'
          )}>
            Shop
          </Link>
          <Link to="/products/gold" className={cn(
            'text-sm font-medium transition-colors',
            pathname === '/products/gold' ? 'text-charcoal-800' : 'text-charcoal-500 hover:text-charcoal-800'
          )}>
            Gold
          </Link>
          <Link to="/products/diamond" className={cn(
            'text-sm font-medium transition-colors',
            pathname === '/products/diamond' ? 'text-charcoal-800' : 'text-charcoal-500 hover:text-charcoal-800'
          )}>
            Diamond
          </Link>
          <Link to="/products/silver" className={cn(
            'text-sm font-medium transition-colors',
            pathname === '/products/silver' ? 'text-charcoal-800' : 'text-charcoal-500 hover:text-charcoal-800'
          )}>
            Silver
          </Link>
          <Link to="/ai-designer" className={cn(
            'text-sm font-medium transition-colors flex items-center',
            pathname.includes('/ai-designer') ? 'text-charcoal-800' : 'text-charcoal-500 hover:text-charcoal-800'
          )}>
            <Sparkles className="h-4 w-4 mr-1" />
            AI Designer
          </Link>
        </nav>
        
        <div className="flex items-center space-x-5">
          <button className="text-charcoal-600 hover:text-charcoal-800 transition-colors">
            <Search className="h-5 w-5" />
          </button>
          
          {user ? (
            <Link to="/account" className="text-charcoal-600 hover:text-charcoal-800 transition-colors">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link to="/login" className="text-charcoal-600 hover:text-charcoal-800 transition-colors">
              <User className="h-5 w-5" />
            </Link>
          )}
          
          <Link to="/wishlist" className="relative text-charcoal-600 hover:text-charcoal-800 transition-colors">
            <Heart className="h-5 w-5" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
          </Link>
          
          <Link to="/cart" className="relative text-charcoal-600 hover:text-charcoal-800 transition-colors">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </header>
  );
};

export default Header;