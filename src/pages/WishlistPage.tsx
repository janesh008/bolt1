import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../lib/utils';

const WishlistPage = () => {
  const { items, isLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  useEffect(() => {
    document.title = 'My Wishlist | AXELS';
  }, []);
  
  const handleAddToCart = (item: any) => {
    addToCart({
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    });
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-charcoal-800">My Wishlist</h1>
        <p className="mt-2 text-charcoal-500">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-soft">
          <Heart className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-charcoal-800 mb-2">Your wishlist is empty</h3>
          <p className="text-charcoal-500 mb-6">Browse our collections and add your favorite pieces.</p>
          <Link to="/products">
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Explore Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-soft overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden bg-cream-100">
                <Link to={`/product/${item.product_id}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                  />
                </Link>
                
                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(item.product_id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
                  title="Remove from wishlist"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </button>
                
                {/* Add to cart button */}
                <div className="absolute bottom-3 left-3 right-3">
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="w-full"
                    size="sm"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <Link to={`/product/${item.product_id}`}>
                  <h3 className="font-medium text-charcoal-800 hover:text-gold-500 transition-colors line-clamp-2 mb-2">
                    {item.name}
                  </h3>
                </Link>
                
                <p className="font-medium text-gold-500 text-lg">
                  {formatCurrency(item.price)}
                </p>
                
                <p className="text-xs text-charcoal-500 mt-2">
                  Added on {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;