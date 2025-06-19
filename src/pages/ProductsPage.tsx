import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Filter, Grid, List, SlidersHorizontal, ChevronDown, X, Search, Star, Heart, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
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
  created_at: string;
  categories?: { id: string; name: string };
  metal_colors?: { id: string; name: string };
  product_images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
  }>;
}

interface Category {
  id: string;
  name: string;
}

interface MetalColor {
  id: string;
  name: string;
}

const ProductsPage = () => {
  const { category } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [metalColors, setMetalColors] = useState<MetalColor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedMetalTypes, setSelectedMetalTypes] = useState<string[]>(
    searchParams.get('metals')?.split(',').filter(Boolean) || []
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [selectedMetalColors, setSelectedMetalColors] = useState<string[]>(
    searchParams.get('metalColors')?.split(',').filter(Boolean) || []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '10000')
  ]);
  const [diamondWeightRange, setDiamondWeightRange] = useState<[number, number]>([
    parseFloat(searchParams.get('minDiamondWeight') || '0'),
    parseFloat(searchParams.get('maxDiamondWeight') || '5')
  ]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'featured');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 24;

  // SEO Meta
  useEffect(() => {
    const title = category 
      ? `${category.charAt(0).toUpperCase() + category.slice(1)} Jewelry | AXELS`
      : searchTerm 
        ? `Search: ${searchTerm} | AXELS Jewelry`
        : 'Premium Jewelry Collection | AXELS';
    
    const description = category
      ? `Discover our exquisite ${category} jewelry collection. Premium quality ${category} pieces crafted with precision and elegance.`
      : 'Browse our complete collection of premium jewelry including gold, silver, platinum, and diamond pieces. Free shipping worldwide.';
    
    document.title = title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, [category, searchTerm]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (selectedMetalTypes.length) params.set('metals', selectedMetalTypes.join(','));
    if (selectedCategories.length) params.set('categories', selectedCategories.join(','));
    if (selectedMetalColors.length) params.set('metalColors', selectedMetalColors.join(','));
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 10000) params.set('maxPrice', priceRange[1].toString());
    if (diamondWeightRange[0] > 0) params.set('minDiamondWeight', diamondWeightRange[0].toString());
    if (diamondWeightRange[1] < 5) params.set('maxDiamondWeight', diamondWeightRange[1].toString());
    if (sortBy !== 'featured') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [searchTerm, selectedMetalTypes, selectedCategories, selectedMetalColors, priceRange, diamondWeightRange, sortBy, currentPage, setSearchParams]);

  // Fetch data
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchMetalColors();
    if (user) fetchWishlist();
  }, [category, searchTerm, selectedMetalTypes, selectedCategories, selectedMetalColors, priceRange, diamondWeightRange, sortBy, currentPage, user]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id(id, name),
          metal_colors:metal_color_id(id, name),
          product_images(*)
        `)
        .eq('availability', true);

      // Apply filters
      if (category) {
        query = query.or(`product_type.eq.${category},categories.name.eq.${category}`);
      }
      
      if (searchTerm) {
        query = query.or(`product_name.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (selectedMetalTypes.length) {
        query = query.in('metal_type', selectedMetalTypes);
      }
      
      if (selectedCategories.length) {
        query = query.in('category_id', selectedCategories);
      }
      
      if (selectedMetalColors.length) {
        query = query.in('metal_color_id', selectedMetalColors);
      }
      
      if (priceRange[0] > 0 || priceRange[1] < 10000) {
        query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
      }
      
      if (diamondWeightRange[0] > 0 || diamondWeightRange[1] < 5) {
        query = query.gte('diamond_weight', diamondWeightRange[0]).lte('diamond_weight', diamondWeightRange[1]);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'featured':
        default:
          query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
          break;
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setProducts(data || []);
      setTotalPages(Math.ceil((count || data?.length || 0) / productsPerPage));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMetalColors = async () => {
    try {
      const { data, error } = await supabase
        .from('metal_colors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setMetalColors(data || []);
    } catch (error) {
      console.error('Error fetching metal colors:', error);
    }
  };

  const fetchWishlist = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setWishlist(new Set(data?.map(item => item.product_id) || []));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }

    try {
      if (wishlist.has(productId)) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        setWishlist(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        toast.success('Removed from wishlist');
      } else {
        await supabase
          .from('wishlists')
          .insert([{ user_id: user.id, product_id: productId }]);
        
        setWishlist(prev => new Set([...prev, productId]));
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = (product: Product) => {
    const productName = product.product_name || product.name || 'Unknown Product';
    const productImage = product.product_images?.[0]?.image_url || '';
    
    addToCart({
      product_id: product.id,
      name: productName,
      price: product.price || 0,
      image: productImage,
      quantity: 1
    });
    toast.success('Added to cart');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMetalTypes([]);
    setSelectedCategories([]);
    setSelectedMetalColors([]);
    setPriceRange([0, 10000]);
    setDiamondWeightRange([0, 5]);
    setSortBy('featured');
    setCurrentPage(1);
  };

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return products.slice(startIndex, startIndex + productsPerPage);
  }, [products, currentPage]);

  const getProductName = (product: Product) => {
    return product.product_name || product.name || 'Unknown Product';
  };

  const getProductImage = (product: Product) => {
    return product.product_images?.[0]?.image_url || 'https://images.pexels.com/photos/10018318/pexels-photo-10018318.jpeg?auto=compress&cs=tinysrgb&w=1600';
  };

  const getProductMetal = (product: Product) => {
    return product.metal_type || product.metal || 'Unknown';
  };

  const getProductCategory = (product: Product) => {
    return product.categories?.name || product.category || product.product_type || 'Jewelry';
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-charcoal-800">
                {category 
                  ? `${category.charAt(0).toUpperCase() + category.slice(1)} Jewelry` 
                  : searchTerm 
                    ? `Search Results for "${searchTerm}"`
                    : 'All Jewelry'
                }
              </h1>
              <p className="mt-2 text-charcoal-500">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
            </div>
            
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <Input
                type="text"
                placeholder="Search jewelry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl text-charcoal-800">Filters</h2>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              <div className="space-y-6">
                {/* Metal Type Filter */}
                <div>
                  <h3 className="font-medium text-charcoal-800 mb-3">Metal Type</h3>
                  <div className="space-y-2">
                    {['Gold', 'Silver', 'Platinum'].map((metal) => (
                      <label key={metal} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={selectedMetalTypes.includes(metal)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMetalTypes([...selectedMetalTypes, metal]);
                            } else {
                              setSelectedMetalTypes(selectedMetalTypes.filter(m => m !== metal));
                            }
                          }}
                        />
                        <span className="text-sm text-charcoal-600">{metal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="font-medium text-charcoal-800 mb-3">Category</h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={selectedCategories.includes(cat.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, cat.id]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                            }
                          }}
                        />
                        <span className="text-sm text-charcoal-600">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Metal Color Filter */}
                <div>
                  <h3 className="font-medium text-charcoal-800 mb-3">Metal Color</h3>
                  <div className="space-y-2">
                    {metalColors.map((color) => (
                      <label key={color.id} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={selectedMetalColors.includes(color.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMetalColors([...selectedMetalColors, color.id]);
                            } else {
                              setSelectedMetalColors(selectedMetalColors.filter(c => c !== color.id));
                            }
                          }}
                        />
                        <span className="text-sm text-charcoal-600">{color.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-medium text-charcoal-800 mb-3">Price Range</h3>
                  <div className="space-y-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={10000}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-charcoal-600">
                      <span>₹{priceRange[0].toLocaleString()}</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Diamond Weight Range */}
                <div>
                  <h3 className="font-medium text-charcoal-800 mb-3">Diamond Weight (ct)</h3>
                  <div className="space-y-4">
                    <Slider
                      value={diamondWeightRange}
                      onValueChange={setDiamondWeightRange}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-charcoal-600">
                      <span>{diamondWeightRange[0]}ct</span>
                      <span>{diamondWeightRange[1]}ct</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-charcoal-600">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Sort by:</span>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-charcoal-800 mb-2">No products found</h3>
                <p className="text-charcoal-500 mb-4">Try adjusting your filters or search terms.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-6'
              }>
                {paginatedProducts.map((product, index) => (
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
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;