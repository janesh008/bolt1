import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
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
  diamond_color?: string;
  gross_weight?: number;
  net_weight?: number;
  created_at: string;
  categories?: { id: string; name: string };
  metal_colors?: { id: string; name: string };
  product_images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
  }>;
}

interface ProductGridProps {
  products: Product[];
  viewMode: 'grid' | 'list';
  wishlist: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  handleAddToCart: (product: Product) => void;
  getProductName: (product: Product) => string;
  getProductImage: (product: Product) => string;
  getProductMetal: (product: Product) => string;
  getProductCategory: (product: Product) => string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  viewMode,
  wishlist,
  toggleWishlist,
  handleAddToCart,
  getProductName,
  getProductImage,
  getProductMetal,
  getProductCategory
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-charcoal-800 mb-2">No products found</h3>
        <p className="text-charcoal-500 mb-4">Try adjusting your filters or search terms.</p>
        <Button onClick={() => window.location.reload()}>Reset Filters</Button>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' 
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
      : 'space-y-6'
    }>
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={viewMode === 'grid' ? 'group' : 'flex gap-6 bg-white rounded-lg shadow-soft p-6'}
        >
          {viewMode === 'grid' ? (
            // Grid View
            <div className="bg-white rounded-lg shadow-soft overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square overflow-hidden">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={getProductImage(product)}
                    alt={getProductName(product)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                
                {/* Wishlist & Quick Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        wishlist.has(product.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-charcoal-600'
                      }`}
                    />
                  </button>
                </div>

                {/* Quick Add to Cart */}
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {product.featured && (
                    <Badge className="bg-gold-400 text-charcoal-900">Featured</Badge>
                  )}
                  <Badge variant="secondary">{getProductCategory(product)}</Badge>
                </div>
              </div>

              <div className="p-4">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-medium text-charcoal-800 hover:text-gold-500 transition-colors line-clamp-2">
                    {getProductName(product)}
                  </h3>
                </Link>
                
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal-500">{getProductMetal(product)}</p>
                    {product.diamond_weight && product.diamond_weight > 0 && (
                      <p className="text-xs text-charcoal-400">
                        {product.diamond_weight}ct diamond
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gold-500">
                      ₹{product.price?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // List View
            <>
              <div className="w-32 h-32 flex-shrink-0">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={getProductImage(product)}
                    alt={getProductName(product)}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </Link>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-medium text-charcoal-800 hover:text-gold-500 transition-colors">
                        {getProductName(product)}
                      </h3>
                    </Link>
                    <p className="text-sm text-charcoal-500 mt-1">
                      {getProductMetal(product)} • {getProductCategory(product)}
                    </p>
                    {product.description && (
                      <p className="text-sm text-charcoal-600 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3">
                      {product.diamond_weight && product.diamond_weight > 0 && (
                        <span className="text-xs text-charcoal-500">
                          {product.diamond_weight}ct diamond
                        </span>
                      )}
                      {product.gross_weight && (
                        <span className="text-xs text-charcoal-500">
                          {product.gross_weight}g
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-gold-500 text-lg">
                      ₹{product.price?.toLocaleString() || 'N/A'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="p-2 rounded-full hover:bg-cream-100 transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            wishlist.has(product.id) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-charcoal-600'
                          }`}
                        />
                      </button>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default ProductGrid;