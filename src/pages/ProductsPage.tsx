import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

// Import components
import ProductFilters from '../components/products/ProductFilters';
import ProductToolbar from '../components/products/ProductToolbar';
import ProductGrid from '../components/products/ProductGrid';
import ProductPagination from '../components/products/ProductPagination';
import ProductSearch from '../components/products/ProductSearch';
import ProductHeader from '../components/products/ProductHeader';

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

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
  }, [category, debouncedSearchTerm, selectedMetalTypes, selectedCategories, selectedMetalColors, priceRange, diamondWeightRange, sortBy, currentPage, user]);

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
      
      if (debouncedSearchTerm) {
        query = query.or(`product_name.ilike.%${debouncedSearchTerm}%,name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`);
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
    const productName = getProductName(product);
    const productImage = getProductImage(product);
    
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
            <ProductHeader 
              category={category} 
              searchTerm={searchTerm} 
              productCount={products.length} 
            />
            
            {/* Search */}
            <ProductSearch 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <ProductFilters 
            categories={categories}
            metalColors={metalColors}
            selectedMetalTypes={selectedMetalTypes}
            setSelectedMetalTypes={setSelectedMetalTypes}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedMetalColors={selectedMetalColors}
            setSelectedMetalColors={setSelectedMetalColors}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            diamondWeightRange={diamondWeightRange}
            setDiamondWeightRange={setDiamondWeightRange}
            clearFilters={clearFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <ProductToolbar 
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />

            {/* Products Grid */}
            <ProductGrid 
              products={paginatedProducts}
              viewMode={viewMode}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
              handleAddToCart={handleAddToCart}
              getProductName={getProductName}
              getProductImage={getProductImage}
              getProductMetal={getProductMetal}
              getProductCategory={getProductCategory}
            />

            {/* Pagination */}
            <ProductPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;