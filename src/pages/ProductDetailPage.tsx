import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ZoomIn, Share2, Star, ChevronLeft, ChevronRight, Shield, Truck, RotateCcw, Award, Info, Cuboid as Cube, Video as VideoIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import IJewelViewer from '../components/products/IJewelViewer';
import ProductVideoPlayer from '../components/products/ProductVideoPlayer';
import toast from 'react-hot-toast';

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
  ijewel_url?: string;
  model_3d_url?: string;
  created_at: string;
  categories?: { id: string; name: string };
  metal_colors?: { id: string; name: string; hex_color?: string };
  product_images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
  }>;
  product_videos?: Array<{
    id: string;
    video_url: string;
  }>;
}

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Combined media array for slider
  const [combinedMedia, setCombinedMedia] = useState<Array<{type: 'image' | 'video', url: string, id: string}>>([]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id, user]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
      updateSEO();
      
      // Create combined media array from images and videos
      const media: Array<{type: 'image' | 'video', url: string, id: string}> = [];
      
      // Add images
      if (product.product_images && product.product_images.length > 0) {
        product.product_images.forEach(image => {
          media.push({
            type: 'image',
            url: image.image_url,
            id: image.id
          });
        });
      }
      
      // Add videos
      if (product.product_videos && product.product_videos.length > 0) {
        product.product_videos.forEach(video => {
          media.push({
            type: 'video',
            url: video.video_url,
            id: video.id
          });
        });
      }
      
      setCombinedMedia(media);
      
      // Set initial media type based on what's selected
      if (media.length > 0 && selectedMediaIndex < media.length) {
        setSelectedMediaType(media[selectedMediaIndex].type);
      }
    }
  }, [product, selectedMediaIndex]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id(id, name),
          metal_colors:metal_color_id(id, name, hex_color),
          product_images(*),
          product_videos(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error('Product not found');
        return;
      }
      
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id(id, name),
          metal_colors:metal_color_id(id, name),
          product_images(*)
        `)
        .eq('availability', true)
        .neq('id', product.id);

      const orConditions = [];
      
      if (product.categories?.id) {
        orConditions.push(`category_id.eq.${product.categories.id}`);
      }
      
      if (product.metal_type) {
        orConditions.push(`metal_type.eq.${product.metal_type}`);
      }

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      }

      const { data, error } = await query.limit(8);

      if (error) throw error;
      setRelatedProducts(data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const productName = getProductName();
    const productImage = getProductImage(0);
    
    addToCart({
      product_id: product.id,
      name: productName,
      price: product.price || 0,
      image: productImage,
      quantity
    });
    
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please sign in to make a purchase');
      return;
    }

    if (!product || !product.availability) {
      toast.error('Product is currently out of stock');
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = async () => {
        try {
          // Create order
          const orderResponse = await fetch('/orders/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.access_token || ''}`
            },
            body: JSON.stringify({
              amount: (product.price || 0) * quantity,
              currency: 'INR',
              items: [{
                product_id: product.id,
                quantity: quantity
              }],
              shipping_address: {
                name: user.user_metadata?.full_name || user.email || 'Customer',
                phone: user.user_metadata?.phone || '1234567890',
                address_line1: 'Default Address',
                city: 'City',
                state: 'State',
                country: 'India',
                pincode: '123456'
              }
            })
          });

          if (!orderResponse.ok) {
            const errorData = await orderResponse.json();
            throw new Error(errorData.error || 'Failed to create order');
          }

          const orderData = await orderResponse.json();

          // Configure Razorpay options
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_95lpU4BLVjzNkI',
            amount: orderData.razorpay_order.amount,
            currency: orderData.razorpay_order.currency,
            name: 'AXELS Jewelry',
            description: `Purchase: ${getProductName()}`,
            image: '/favicon.svg',
            order_id: orderData.razorpay_order.id,
            handler: async (response: any) => {
              try {
                // Verify payment
                const verifyResponse = await fetch('/orders/verify-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.access_token || ''}`
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });

                if (!verifyResponse.ok) {
                  const errorData = await verifyResponse.json();
                  throw new Error(errorData.error || 'Payment verification failed');
                }

                const verifyData = await verifyResponse.json();

                if (verifyData.success) {
                  toast.success('Payment successful! Your order has been confirmed.');
                } else {
                  throw new Error('Payment verification failed');
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                toast.error('Payment verification failed. Please contact support.');
              } finally {
                setIsProcessingPayment(false);
              }
            },
            prefill: {
              name: orderData.customer.name,
              email: orderData.customer.email,
            },
            notes: {
              product_id: product.id,
              product_name: getProductName(),
              quantity: quantity
            },
            theme: {
              color: '#C6A050'
            },
            modal: {
              ondismiss: () => {
                setIsProcessingPayment(false);
                toast.error('Payment cancelled');
              }
            }
          };

          // Open Razorpay checkout
          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();

        } catch (error) {
          console.error('Payment initiation error:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to initiate payment');
          setIsProcessingPayment(false);
        }
      };

      script.onerror = () => {
        toast.error('Failed to load payment gateway');
        setIsProcessingPayment(false);
      };

    } catch (error) {
      console.error('Buy now error:', error);
      toast.error('Failed to process purchase');
      setIsProcessingPayment(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: getProductName(),
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const updateSEO = () => {
    if (!product) return;

    const productName = getProductName();
    const title = `${productName} | AXELS Luxury Jewelry`;
    const description = product.description || `Discover the ${productName} - premium ${getProductMetal()} jewelry crafted with precision and elegance. Free shipping worldwide.`;
    
    document.title = title;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": productName,
      "description": description,
      "image": product.product_images?.map(img => img.image_url) || [],
      "brand": {
        "@type": "Brand",
        "name": "AXELS"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "INR",
        "price": product.price,
        "availability": product.availability ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      },
      "category": getProductCategory(),
      "material": getProductMetal()
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  };

  const getProductName = () => {
    return product?.product_name || product?.name || 'Unknown Product';
  };

  const getProductMetal = () => {
    return product?.metal_type || product?.metal || 'Unknown';
  };

  const getProductCategory = () => {
    return product?.categories?.name || product?.category || product?.product_type || 'Jewelry';
  };

  const getProductImage = (index: number = 0) => {
    return product?.product_images?.[index]?.image_url || 'https://images.pexels.com/photos/10018318/pexels-photo-10018318.jpeg?auto=compress&cs=tinysrgb&w=1600';
  };

  const getProductVideo = () => {
    return product?.product_videos?.[0]?.video_url || '';
  };

  const hasProductVideo = () => {
    return product?.product_videos && product.product_videos.length > 0;
  };

  const nextMedia = () => {
    if (combinedMedia.length > 0) {
      setSelectedMediaIndex((prev) => 
        prev === combinedMedia.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevMedia = () => {
    if (combinedMedia.length > 0) {
      setSelectedMediaIndex((prev) => 
        prev === 0 ? combinedMedia.length - 1 : prev - 1
      );
    }
  };

  const selectMedia = (index: number) => {
    setSelectedMediaIndex(index);
    setSelectedMediaType(combinedMedia[index].type);
  };

  const get3DModelUrl = () => {
    return product?.model_3d_url || product?.ijewel_url || '';
  };

  const isValidIJewelUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'ijewel.design' && urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const has3DModel = () => {
    const modelUrl = get3DModelUrl();
    return modelUrl && isValidIJewelUrl(modelUrl);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!product) return <div className="container mx-auto px-4 py-16 text-center">Product not found</div>;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 py-4 pt-20">
          <nav className="flex items-center space-x-2 text-sm text-charcoal-500">
            <Link to="/" className="hover:text-charcoal-800">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-charcoal-800">Products</Link>
            <span>/</span>
            <Link to={`/products/${getProductCategory().toLowerCase()}`} className="hover:text-charcoal-800">
              {getProductCategory()}
            </Link>
            <span>/</span>
            <span className="text-charcoal-800">{getProductName()}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Media (Images & Videos) */}
          <div className="space-y-4">
            {/* Main Media (Image or Video) */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-white">
              {selectedMediaType === 'image' && combinedMedia[selectedMediaIndex] && (
                <img
                  src={combinedMedia[selectedMediaIndex].url}
                  alt={getProductName()}
                  className="w-full h-full object-cover"
                />
              )}
              
              {selectedMediaType === 'video' && combinedMedia[selectedMediaIndex] && (
                <ProductVideoPlayer
                  videoUrl={combinedMedia[selectedMediaIndex].url}
                  productName={getProductName()}
                  height="100%"
                  autoPlay={true}
                />
              )}
              
              {/* Navigation Arrows */}
              {combinedMedia.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
                  >
                    <ChevronLeft className="h-5 w-5 text-charcoal-600" />
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
                  >
                    <ChevronRight className="h-5 w-5 text-charcoal-600" />
                  </button>
                </>
              )}

              {/* Zoom Button (only for images) */}
              {selectedMediaType === 'image' && (
                <button className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg">
                  <ZoomIn className="h-5 w-5 text-charcoal-600" />
                </button>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.featured && (
                  <Badge className="bg-gold-400 text-charcoal-900">Featured</Badge>
                )}
                <Badge variant="secondary">{getProductCategory()}</Badge>
                {hasProductVideo() && (
                  <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                    <VideoIcon className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                )}
                {has3DModel() && (
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                    <Cube className="h-3 w-3 mr-1" />
                    3D Model
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Images & Videos */}
            {combinedMedia.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {combinedMedia.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => selectMedia(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedMediaIndex === index
                        ? 'border-gold-400'
                        : 'border-cream-200 hover:border-gold-300'
                    } relative`}
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`${getProductName()} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full relative bg-gray-100">
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <VideoIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 3D Model Viewer */}
            {has3DModel() && (
              <div className="mt-6">
                {!show3DViewer ? (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Cube className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Experience in 3D
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        View this jewelry piece in an interactive 3D environment. Rotate, zoom, and explore every detail.
                      </p>
                      <Button
                        onClick={() => setShow3DViewer(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                        size="lg"
                      >
                        <Cube className="h-5 w-5 mr-2" />
                        Launch 3D Viewer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">3D Model Viewer</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShow3DViewer(false)}
                      >
                        Hide 3D Viewer
                      </Button>
                    </div>
                    <IJewelViewer
                      ijewelUrl={get3DModelUrl()}
                      productName={getProductName()}
                      height="600px"
                      showFullscreenButton={true}
                      lazy={false}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl text-charcoal-800 mb-2">
                {getProductName()}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-3xl font-medium text-gold-500">
                  ₹{product.price?.toLocaleString() || 'N/A'}
                </p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                  ))}
                  <span className="text-sm text-charcoal-500 ml-2">(24 reviews)</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <Badge 
                  variant={product.availability ? "success" : "error"}
                  className="text-sm"
                >
                  {product.availability ? 'In Stock' : 'Out of Stock'}
                </Badge>
                <span className="text-sm text-charcoal-500">SKU: {product.product_id || product.id.slice(0, 8)}</span>
              </div>

              {has3DModel() && (
                <div className="mb-4">
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                    <Cube className="h-3 w-3 mr-1" />
                    3D Model Available
                  </Badge>
                </div>
              )}

              {hasProductVideo() && (
                <div className="mb-4">
                  <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                    <VideoIcon className="h-3 w-3 mr-1" />
                    Product Video Available
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
              <div>
                <span className="text-sm text-charcoal-500">Metal Type</span>
                <p className="font-medium text-charcoal-800">{getProductMetal()}</p>
              </div>
              <div>
                <span className="text-sm text-charcoal-500">Category</span>
                <p className="font-medium text-charcoal-800">{getProductCategory()}</p>
              </div>
              {product.metal_colors && (
                <div>
                  <span className="text-sm text-charcoal-500">Metal Color</span>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-charcoal-800">{product.metal_colors.name}</p>
                    {product.metal_colors.hex_color && (
                      <div 
                        className="w-4 h-4 rounded-full border border-charcoal-200"
                        style={{ backgroundColor: product.metal_colors.hex_color }}
                      />
                    )}
                  </div>
                </div>
              )}
              {product.diamond_weight && product.diamond_weight > 0 && (
                <div>
                  <span className="text-sm text-charcoal-500">Diamond Weight</span>
                  <p className="font-medium text-charcoal-800">{product.diamond_weight}ct</p>
                </div>
              )}
              {product.diamond_piece_count && product.diamond_piece_count > 0 && (
                <div>
                  <span className="text-sm text-charcoal-500">Diamond Count</span>
                  <p className="font-medium text-charcoal-800">{product.diamond_piece_count} pieces</p>
                </div>
              )}
              {product.diamond_color && (
                <div>
                  <span className="text-sm text-charcoal-500">Diamond Color</span>
                  <p className="font-medium text-charcoal-800">{product.diamond_color}</p>
                </div>
              )}
              {product.gross_weight && (
                <div>
                  <span className="text-sm text-charcoal-500">Gross Weight</span>
                  <p className="font-medium text-charcoal-800">{product.gross_weight}g</p>
                </div>
              )}
              {product.net_weight && (
                <div>
                  <span className="text-sm text-charcoal-500">Net Weight</span>
                  <p className="font-medium text-charcoal-800">{product.net_weight}g</p>
                </div>
              )}
              {hasProductVideo() && (
                <div>
                  <span className="text-sm text-charcoal-500">Product Video</span>
                  <p className="font-medium text-purple-600">Available</p>
                </div>
              )}
              {has3DModel() && (
                <div>
                  <span className="text-sm text-charcoal-500">3D Viewer</span>
                  <p className="font-medium text-blue-600">Available</p>
                </div>
              )}
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-charcoal-800">Quantity:</span>
                <div className="flex items-center border border-cream-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-cream-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-cream-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.availability}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleWishlist(product.id)}
                  size="lg"
                  className="px-4"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''
                    }`}
                  />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  size="lg"
                  className="px-4"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <Button 
                onClick={handleBuyNow}
                isLoading={isProcessingPayment}
                disabled={!product.availability}
                size="lg" 
                className="w-full bg-gold-500 hover:bg-gold-600"
              >
                Buy Now - ₹{((product.price || 0) * quantity).toLocaleString()}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-charcoal-800">Authentic Guarantee</p>
                  <p className="text-xs text-charcoal-500">100% genuine products</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-charcoal-800">Free Shipping</p>
                  <p className="text-xs text-charcoal-500">Worldwide delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-charcoal-800">Easy Returns</p>
                  <p className="text-xs text-charcoal-500">30-day return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gold-500" />
                <div>
                  <p className="text-sm font-medium text-charcoal-800">Lifetime Warranty</p>
                  <p className="text-xs text-charcoal-500">Craftsmanship guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="care">Care Instructions</TabsTrigger>
              <TabsTrigger value="reviews">Reviews (24)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-serif text-xl text-charcoal-800 mb-4">Product Description</h3>
                <div className="prose prose-charcoal max-w-none">
                  <p>{product.description || 'No description available.'}</p>
                  <p className="mt-4">
                    Each piece in our collection is carefully crafted by skilled artisans using the finest materials. 
                    This {getProductName().toLowerCase()} represents the perfect blend of traditional craftsmanship 
                    and contemporary design, making it an ideal choice for those who appreciate timeless elegance.
                  </p>
                  
                  {hasProductVideo() && (
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <VideoIcon className="h-5 w-5 text-purple-600" />
                        <h4 className="font-medium text-purple-900">Product Video</h4>
                      </div>
                      <p className="text-purple-800 text-sm">
                        Watch our product video to see this piece in action and appreciate its beauty from all angles.
                        The video showcases the craftsmanship and details that make this piece special.
                      </p>
                    </div>
                  )}

                  {has3DModel() && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Cube className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Interactive 3D Model</h4>
                      </div>
                      <p className="text-blue-800 text-sm">
                        This product features an interactive 3D model that allows you to view it from every angle. 
                        Use the 3D viewer above to rotate, zoom, and explore the intricate details of this piece.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-serif text-xl text-charcoal-800 mb-4">Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-cream-200">
                      <span className="text-charcoal-600">Product ID</span>
                      <span className="font-medium">{product.product_id || product.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-cream-200">
                      <span className="text-charcoal-600">Metal Type</span>
                      <span className="font-medium">{getProductMetal()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-cream-200">
                      <span className="text-charcoal-600">Category</span>
                      <span className="font-medium">{getProductCategory()}</span>
                    </div>
                    {product.metal_colors && (
                      <div className="flex justify-between py-2 border-b border-cream-200">
                        <span className="text-charcoal-600">Metal Color</span>
                        <span className="font-medium">{product.metal_colors.name}</span>
                      </div>
                    )}
                    {has3DModel() && (
                      <div className="flex justify-between py-2 border-b border-cream-200">
                        <span className="text-charcoal-600">3D Model</span>
                        <span className="font-medium text-blue-600">Available</span>
                      </div>
                    )}
                    {hasProductVideo() && (
                      <div className="flex justify-between py-2 border-b border-cream-200">
                        <span className="text-charcoal-600">Product Video</span>
                        <span className="font-medium text-purple-600">Available</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {product.gross_weight && (
                      <div className="flex justify-between py-2 border-b border-cream-200">
                        <span className="text-charcoal-600">Gross Weight</span>
                        <span className="font-medium">{product.gross_weight}g</span>
                      </div>
                    )}
                    {product.net_weight && (
                      <div className="flex justify-between py-2 border-b border-cream-200">
                        <span className="text-charcoal-600">Net Weight</span>
                        <span className="font-medium">{product.net_weight}g</span>
                      </div>
                    )}
                    {product.diamond_weight && product.diamond_weight > 0 && (
                      <div className="flex justify-between py-2 border-b border-cream-200">
                        <span className="text-charcoal-600">Diamond Weight</span>
                        <span className="font-medium">{product.diamond_weight}ct</span>
                      </div>
                    )}
                    {product.diamond_piece_count && product.diamond_piece_count > 0 && (
                      <div className="flex justify-between py-2 border-b border-cream-200">
                        <span className="text-charcoal-600">Diamond Count</span>
                        <span className="font-medium">{product.diamond_piece_count} pieces</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="care" className="mt-6">
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-serif text-xl text-charcoal-800 mb-4">Care Instructions</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-charcoal-800">Daily Care</h4>
                      <p className="text-charcoal-600 text-sm">Remove jewelry before swimming, exercising, or using cleaning products.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-charcoal-800">Cleaning</h4>
                      <p className="text-charcoal-600 text-sm">Clean with a soft, dry cloth. For deeper cleaning, use warm soapy water and a soft brush.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-charcoal-800">Storage</h4>
                      <p className="text-charcoal-600 text-sm">Store in the provided jewelry box or a soft pouch to prevent scratches.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-serif text-xl text-charcoal-800 mb-4">Customer Reviews</h3>
                <div className="space-y-6">
                  {/* Review Summary */}
                  <div className="flex items-center gap-6 p-4 bg-cream-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-charcoal-800">4.8</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                        ))}
                      </div>
                      <div className="text-sm text-charcoal-500 mt-1">24 reviews</div>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-charcoal-600 w-8">{rating}★</span>
                          <div className="flex-1 bg-cream-200 rounded-full h-2">
                            <div 
                              className="bg-gold-400 h-2 rounded-full" 
                              style={{ width: `${rating === 5 ? 70 : rating === 4 ? 20 : 5}%` }}
                            />
                          </div>
                          <span className="text-sm text-charcoal-500 w-8">
                            {rating === 5 ? 17 : rating === 4 ? 5 : rating === 3 ? 1 : rating === 2 ? 1 : 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  <div className="space-y-4">
                    {[
                      {
                        name: "Sarah M.",
                        rating: 5,
                        date: "2 weeks ago",
                        review: "Absolutely stunning piece! The craftsmanship is exceptional and it arrived beautifully packaged. The 3D viewer really helped me see all the details before purchasing. Highly recommend!"
                      },
                      {
                        name: "Michael R.",
                        rating: 5,
                        date: "1 month ago",
                        review: "Perfect for my wife's anniversary gift. The quality exceeded my expectations and the customer service was excellent. The 3D model feature is amazing!"
                      },
                      {
                        name: "Emma L.",
                        rating: 4,
                        date: "2 months ago",
                        review: "Beautiful jewelry, though delivery took a bit longer than expected. Overall very satisfied with the purchase. Love being able to view it in 3D first."
                      }
                    ].map((review, index) => (
                      <div key={index} className="border-b border-cream-200 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-charcoal-800">{review.name}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${
                                    i < review.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-300'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-charcoal-500">{review.date}</span>
                        </div>
                        <p className="text-charcoal-600">{review.review}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl text-charcoal-800 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-white rounded-lg shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Link to={`/product/${relatedProduct.id}`}>
                      <img
                        src={relatedProduct.product_images?.[0]?.image_url || getProductImage()}
                        alt={relatedProduct.product_name || relatedProduct.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                  </div>
                  <div className="p-4">
                    <Link to={`/product/${relatedProduct.id}`}>
                      <h3 className="font-medium text-charcoal-800 hover:text-gold-500 transition-colors line-clamp-2">
                        {relatedProduct.product_name || relatedProduct.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-charcoal-500 mt-1">
                      {relatedProduct.metal_type || relatedProduct.metal}
                    </p>
                    <p className="font-medium text-gold-500 mt-2">
                      ₹{relatedProduct.price?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;