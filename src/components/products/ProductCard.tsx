import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { Badge } from '../ui/badge';
import Button from '../ui/Button';

interface Product {
  id: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  product_type?: string;
  category?: string;
  price?: number;
  metal?: string;
  metal_type?: string;
  description?: string;
  availability?: boolean;
  featured?: boolean;
  diamond_weight?: number;
  diamond_piece_count?: number;
  categories?: { id: string; name: string };
  metal_colors?: { id: string; name: string };
  product_images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
  }>;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  showQuickActions?: boolean;
}

const ProductCard = ({ product, viewMode = 'grid', showQuickActions = true }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [_isProcessingPayment, setIsProcessingPayment] = useState(false);

  const getProductName = () => {
    return product.product_name || product.name || 'Unknown Product';
  };

  const getProductImage = () => {
    return product.product_images?.[0]?.image_url || 'https://images.pexels.com/photos/10018318/pexels-photo-10018318.jpeg?auto=compress&cs=tinysrgb&w=1600';
  };

  const getProductMetal = () => {
    return product.metal_type || product.metal || 'Unknown';
  };

  const getProductCategory = () => {
    return product.categories?.name || product.category || product.product_type || 'Jewelry';
  };

  const handleAddToWishlist = async () => {
    await toggleWishlist(product.id);
  };

  const handleAddToCart = () => {
    addToCart({
      product_id: product.id,
      name: getProductName(),
      price: product.price || 0,
      image: getProductImage(),
      quantity: 1
    });
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-6 bg-white rounded-lg shadow-soft p-6 hover:shadow-lg transition-shadow"
      >
        <div className="w-32 h-32 flex-shrink-0">
          <Link to={`/product/${product.id}`}>
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-cream-100">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-cream-200 animate-pulse" />
              )}
              <img
                src={getProductImage()}
                alt={getProductName()}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          </Link>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {product.featured && (
                  <Badge className="bg-gold-400 text-charcoal-900 text-xs">Featured</Badge>
                )}
                <Badge variant="secondary" className="text-xs">{getProductCategory()}</Badge>
              </div>
              
              <Link to={`/product/${product.id}`}>
                <h3 className="font-medium text-charcoal-800 hover:text-gold-500 transition-colors text-lg mb-1">
                  {getProductName()}
                </h3>
              </Link>
              
              <p className="text-sm text-charcoal-500 mb-2">
                {getProductMetal()} • {getProductCategory()}
              </p>
              
              {product.description && (
                <p className="text-sm text-charcoal-600 line-clamp-2 mb-3">
                  {product.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-charcoal-500">
                {product.diamond_weight && product.diamond_weight > 0 && (
                  <span>{product.diamond_weight}ct diamond</span>
                )}
                {product.gross_weight && (
                  <span>{product.gross_weight}g</span>
                )}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-gold-400 text-gold-400" />
                  ))}
                  <span className="ml-1">(4.8)</span>
                </div>
              </div>
            </div>
            
            <div className="text-right ml-6">
              <p className="font-medium text-gold-500 text-xl mb-3">
                ₹{product.price?.toLocaleString() || 'N/A'}
              </p>
              
              {showQuickActions && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddToWishlist}
                    className="p-2 rounded-full hover:bg-cream-100 transition-colors"
                    title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-charcoal-600'
                      }`}
                    />
                  </button>
                  
                  <Button size="sm" onClick={handleAddToCart}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>

                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-lg shadow-soft overflow-hidden hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-cream-100">
        <Link to={`/product/${product.id}`}>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-cream-200 animate-pulse" />
          )}
          <img
            src={getProductImage()}
            alt={getProductName()}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.featured && (
            <Badge className="bg-gold-400 text-charcoal-900">Featured</Badge>
          )}
          <Badge variant="secondary">{getProductCategory()}</Badge>
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <>
            {/* Wishlist & Quick View */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                onClick={handleAddToWishlist}
                className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
                title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`h-4 w-4 ${
                    isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-charcoal-600'
                  }`}
                />
              </button>
              
              <Link
                to={`/product/${product.id}`}
                className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
                title="Quick view"
              >
                <Eye className="h-4 w-4 text-charcoal-600" />
              </Link>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ 
                y: isHovered ? 0 : 100, 
                opacity: isHovered ? 1 : 0 
              }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-3 left-3 right-3 flex gap-2"
            >
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={!product.availability}
                className="flex-1"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              

            </motion.div>
          </>
        )}

        {/* Availability indicator */}
        {!product.availability && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="error" className="text-white">Out of Stock</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-charcoal-800 hover:text-gold-500 transition-colors line-clamp-2 mb-2">
            {getProductName()}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-charcoal-500">{getProductMetal()}</p>
            {product.diamond_weight && product.diamond_weight > 0 && (
              <p className="text-xs text-charcoal-400">
                {product.diamond_weight}ct diamond
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-gold-400 text-gold-400" />
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="font-medium text-gold-500 text-lg">
            ₹{product.price?.toLocaleString() || 'N/A'}
          </p>
          {product.diamond_piece_count && product.diamond_piece_count > 0 && (
            <p className="text-xs text-charcoal-400">
              {product.diamond_piece_count} diamonds
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;