import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../ui/Button';
import { formatCurrency } from '../../lib/utils';

interface WishlistItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image: string;
  created_at: string;
}

interface WishlistTabProps {
  items: WishlistItem[];
  onRemoveItem: (productId: string) => Promise<void>;
}

const WishlistTab: React.FC<WishlistTabProps> = ({ items, onRemoveItem }) => {
  const { addToCart } = useCart();
  
  const handleAddToCart = (item: WishlistItem) => {
    addToCart({
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    });
  };
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
        <p className="text-charcoal-500 mb-4">Your wishlist is empty.</p>
        <Button onClick={() => window.location.href = '/products'}>
          Explore Products
        </Button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
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
                onClick={() => handleAddToCart(item)}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
            <button
              onClick={() => onRemoveItem(item.product_id)}
              className="w-full mt-2 text-xs text-charcoal-500 hover:text-red-500 transition-colors"
            >
              Remove from wishlist
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WishlistTab;