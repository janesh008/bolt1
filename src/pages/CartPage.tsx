import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, isLoading } = useCart();
  
  useEffect(() => {
    document.title = 'Shopping Cart | AXELS';
  }, []);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-cream-200 border-t-gold-400 rounded-full animate-spin mb-4"></div>
        <p className="text-charcoal-500">Loading your cart...</p>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center">
        <ShoppingBag className="w-16 h-16 text-charcoal-300 mb-4" />
        <h1 className="text-2xl font-serif text-charcoal-800 mb-4">Your cart is empty</h1>
        <p className="text-charcoal-500 mb-8">Add some beautiful pieces to your cart and they will appear here.</p>
        <Link to="/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-serif text-charcoal-800 mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-4 p-4 border-b border-cream-200 last:border-b-0"
            >
              <div className="w-24 h-24 bg-cream-100 rounded-md overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-grow">
                <h3 className="font-medium text-charcoal-800">{item.name}</h3>
                <p className="text-gold-500 mt-1">{formatCurrency(item.price)}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-cream-200 text-charcoal-600 hover:border-gold-400 transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-12 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-cream-200 text-charcoal-600 hover:border-gold-400 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              <div className="text-right min-w-[100px]">
                <p className="font-medium text-charcoal-800">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
              
              <button
                onClick={() => removeFromCart(item.id)}
                className="p-2 text-charcoal-400 hover:text-error-500 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
        
        <div className="lg:w-80">
          <div className="bg-cream-100 rounded-lg p-6">
            <h2 className="text-xl font-serif text-charcoal-800 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
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
                <div className="flex justify-between font-medium text-charcoal-800">
                  <span>Total</span>
                  <span className="text-gold-600">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
            
            <Link to="/checkout">
              <Button className="w-full">
                Proceed to Checkout
              </Button>
            </Link>
            
            <Link to="/products">
              <Button variant="ghost" className="w-full mt-3">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;