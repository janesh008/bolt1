import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RazorpayPaymentButton from '../components/checkout/RazorpayPaymentButton';
import IJewelViewer from '../components/products/IJewelViewer';
import ProductVideoPlayer from '../components/products/ProductVideoPlayer';
import { Heart, ShoppingCart, Share2, Star, Minus, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  product_name: string;
  description: string;
  price: number;
  metal_type: string;
  diamond_color: string;
  diamond_piece_count: number;
  diamond_weight: number;
  gross_weight: number;
  net_weight: number;
  stock_quantity: number;
  availability: boolean;
  featured: boolean;
  ijewel_url: string;
  categories: {
    name: string;
  };
  metal_colors: {
    name: string;
    hex_color: string;
  };
  product_images: Array<{
    id: string;
    image_url: string;
    angle: string;
  }>;
  product_videos: Array<{
    id: string;
    video_url: string;
  }>;
  product_models: Array<{
    id: string;
    model_url: string;
    model_type: string;
  }>;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          metal_colors (name, hex_color),
          product_images (id, image_url, angle),
          product_videos (id, video_url),
          product_models (id, model_url, model_type)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      setIsAddingToCart(true);
      await addToCart(product.id, quantity);
      toast.success('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Product',
          text: product?.description || '',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Button onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  const displayName = product.product_name || product.name;
  const images = product.product_images || [];
  const videos = product.product_videos || [];
  const models = product.product_models || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.image_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-gold-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${displayName} ${image.angle || index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Video Player */}
            {videos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Product Video</h3>
                <ProductVideoPlayer videoUrl={videos[0].video_url} />
              </div>
            )}

            {/* 3D Model Viewer */}
            {product.ijewel_url && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">360° View</h3>
                <IJewelViewer iJewelUrl={product.ijewel_url} />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
              {product.categories && (
                <p className="text-sm text-gray-600 mb-4">{product.categories.name}</p>
              )}
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-gold-600">
                  ₹{product.price?.toLocaleString()}
                </span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">(4.8)</span>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Specifications</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.metal_type && (
                  <div>
                    <span className="text-gray-600">Metal:</span>
                    <span className="ml-2 font-medium">{product.metal_type}</span>
                  </div>
                )}
                {product.metal_colors && (
                  <div>
                    <span className="text-gray-600">Color:</span>
                    <span className="ml-2 font-medium">{product.metal_colors.name}</span>
                  </div>
                )}
                {product.diamond_weight > 0 && (
                  <div>
                    <span className="text-gray-600">Diamond Weight:</span>
                    <span className="ml-2 font-medium">{product.diamond_weight} ct</span>
                  </div>
                )}
                {product.diamond_piece_count > 0 && (
                  <div>
                    <span className="text-gray-600">Diamond Count:</span>
                    <span className="ml-2 font-medium">{product.diamond_piece_count}</span>
                  </div>
                )}
                {product.gross_weight && (
                  <div>
                    <span className="text-gray-600">Gross Weight:</span>
                    <span className="ml-2 font-medium">{product.gross_weight} g</span>
                  </div>
                )}
                {product.net_weight && (
                  <div>
                    <span className="text-gray-600">Net Weight:</span>
                    <span className="ml-2 font-medium">{product.net_weight} g</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Quantity</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <RazorpayPaymentButton
                  productId={product.id}
                  buttonText={`Buy Now - ₹${((product.price || 0) * quantity).toLocaleString()}`}
                  className="w-full py-3 text-lg font-semibold bg-gold-500 hover:bg-gold-600"
                  onSuccess={(data) => {
                    toast.success('Payment successful! Your order has been confirmed.');
                    navigate('/account?tab=orders');
                  }}
                  onError={(error) => {
                    console.error('Payment error:', error);
                    toast.error('Payment failed. Please try again.');
                  }}
                />

                <Button
                  onClick={handleAddToCart}
                  isLoading={isAddingToCart}
                  disabled={!product.availability}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleWishlistToggle}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Heart
                      className={`w-5 h-5 mr-2 ${
                        isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                    {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </Button>

                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mt-4 text-sm">
                {product.availability ? (
                  <span className="text-green-600 font-medium">
                    ✓ In Stock ({product.stock_quantity} available)
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Out of Stock</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}