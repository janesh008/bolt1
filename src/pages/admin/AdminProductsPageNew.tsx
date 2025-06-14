import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, Product Videos
  Edit, 
  Info,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Package,
  Image as ImageIcon,
  RefreshCw,
  Video as VideoIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import Button from '../../components/ui/Button';
import ProductInfoModal from '../../components/admin/products/ProductInfoModal';
import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '../../lib/supabase';
import { deleteProductImage, deleteProductVideo } from '../../lib/supabase-storage';
import { useAdminAuth } from '../../context/AdminAuthContext';
import toast from 'react-hot-toast';

interface DatabaseProduct {
  id: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  product_link?: string;
  metal_type?: string;
  metal?: string;
  category_id?: string;
  category?: string;
  diamond_color?: string;
  diamond_piece_count?: number;
  diamond_weight?: number;
  gross_weight?: number;
  net_weight?: number;
  metal_color_id?: string;
  description?: string;
  price?: number;
  availability?: boolean;
  featured?: boolean;
  created_at: string;
  updated_at?: string;
  categories?: { id: string; name: string; created_at: string };
  metal_colors?: { id: string; name: string; created_at: string };
  product_images?: Array<{
    id: string;
    product_id: string;
    image_url: string;
    storage_path?: string;
    created_at: string;
  }>;
  product_videos?: Array<{
    id: string;
    product_id: string;
    video_url: string;
    storage_path?: string;
    created_at: string;
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

const AdminProductsPageNew = () => {
  const { hasRole } = useAdminAuth();
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [metalColors, setMetalColors] = useState<MetalColor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [metalTypeFilter, setMetalTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedProductInfo, setSelectedProductInfo] = useState<DatabaseProduct | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<DatabaseProduct | null>(null);

  const productsPerPage = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchMetalColors();
  }, [currentPage, debouncedSearchTerm, categoryFilter, metalTypeFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id(id, name, created_at),
          metal_colors:metal_color_id(id, name, created_at),
          product_images(id, product_id, image_url, storage_path, created_at),
          product_videos(id, product_id, video_url, storage_path, created_at)
        `)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`product_name.ilike.%${debouncedSearchTerm}%,name.ilike.%${debouncedSearchTerm}%,product_id.ilike.%${debouncedSearchTerm}%`);
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      // Apply metal type filter
      if (metalTypeFilter !== 'all') {
        query = query.or(`metal_type.eq.${metalTypeFilter},metal.eq.${metalTypeFilter}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Fetched products:', data);
      setProducts(data || []);
      setTotalPages(Math.ceil((data?.length || 0) / productsPerPage));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchMetalColors = async () => {
    try {
      const { data, error } = await supabase
        .from('metal_colors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMetalColors(data || []);
    } catch (error) {
      console.error('Error fetching metal colors:', error);
      toast.error('Failed to load metal colors');
    }
  };

  const handleDeleteClick = (product: DatabaseProduct) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    if (!hasRole('Admin')) {
      toast.error('Insufficient permissions to delete products');
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete product images from storage first
      if (productToDelete.product_images && productToDelete.product_images.length > 0) {
        console.log('Deleting product images:', productToDelete.product_images);
        for (const image of productToDelete.product_images) {
          if (image.storage_path) {
            console.log('Deleting image from storage:', image.storage_path);
            await deleteProductImage(image.storage_path);
          }
        }
      }

      // Delete product videos from storage
      if (productToDelete.product_videos && productToDelete.product_videos.length > 0) {
        console.log('Deleting product videos:', productToDelete.product_videos);
        for (const video of productToDelete.product_videos) {
          if (video.storage_path) {
            console.log('Deleting video from storage:', video.storage_path);
            await deleteProductVideo(video.storage_path);
          }
        }
      }

      // Delete product images from database
      const { error: imageError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productToDelete.id);

      if (imageError) {
        console.warn('Error deleting product images:', imageError);
      }

      // Delete product videos from database
      const { error: videoError } = await supabase
        .from('product_videos')
        .delete()
        .eq('product_id', productToDelete.id);

      if (videoError) {
        console.warn('Error deleting product videos:', videoError);
      }

      // Delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;
      
      // Update local state
      setProducts(products.filter(product => product.id !== productToDelete.id));
      setSelectedProducts(selectedProducts.filter(id => id !== productToDelete.id));
      
      toast.success('Product deleted successfully');
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!hasRole('Admin')) {
      toast.error('Insufficient permissions to delete products');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('No products selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete product images and videos from storage first
      const productsToDelete = products.filter(p => selectedProducts.includes(p.id));
      for (const product of productsToDelete) {
        // Delete images
        if (product.product_images) {
          for (const image of product.product_images) {
            if (image.storage_path) {
              console.log('Deleting image from storage:', image.storage_path);
              await deleteProductImage(image.storage_path);
            }
          }
        }
        
        // Delete videos
        if (product.product_videos) {
          for (const video of product.product_videos) {
            if (video.storage_path) {
              console.log('Deleting video from storage:', video.storage_path);
              await deleteProductVideo(video.storage_path);
            }
          }
        }
      }

      // Delete product images from database
      const { error: imageError } = await supabase
        .from('product_images')
        .delete()
        .in('product_id', selectedProducts);

      if (imageError) {
        console.warn('Error deleting product images:', imageError);
      }

      // Delete product videos from database
      const { error: videoError } = await supabase
        .from('product_videos')
        .delete()
        .in('product_id', selectedProducts);

      if (videoError) {
        console.warn('Error deleting product videos:', videoError);
      }

      // Delete products
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;
      
      setProducts(products.filter(product => !selectedProducts.includes(product.id)));
      setSelectedProducts([]);
      toast.success(`${selectedProducts.length} products deleted successfully`);
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      toast.error('Failed to delete products');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product.id));
    }
  };

  const handleShowProductInfo = (product: DatabaseProduct) => {
    setSelectedProductInfo(product);
    setShowInfoModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProductName = (product: DatabaseProduct) => {
    return product.product_name || product.name || 'Unnamed Product';
  };

  const getProductMetal = (product: DatabaseProduct) => {
    return product.metal_type || product.metal || 'Unknown';
  };

  const getCategoryName = (product: DatabaseProduct) => {
    if (product.categories) {
      return product.categories.name;
    }
    return product.category || 'Uncategorized';
  };

  const getMetalColorName = (product: DatabaseProduct) => {
    if (product.metal_colors) {
      return product.metal_colors.name;
    }
    return 'Unknown';
  };

  const getProductImage = (product: DatabaseProduct) => {
    if (product.product_images && product.product_images.length > 0) {
      return product.product_images[0].image_url;
    }
    return null;
  };

  const hasProductVideo = (product: DatabaseProduct) => {
    return product.product_videos && product.product_videos.length > 0;
  };

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return products.slice(startIndex, startIndex + productsPerPage);
  }, [products, currentPage, productsPerPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your jewelry product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {hasRole('Moderator') && (
            <Link to="/admin/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Metal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Metals</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                >
                  Clear Selection
                </Button>
                {hasRole('Admin') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    isLoading={isDeleting}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete Selected
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({products.length})</CardTitle>
          <CardDescription>
            Manage your jewelry product inventory with detailed specifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="rounded bg-gray-200 h-16 w-16"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Diamond</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {getProductImage(product) ? (
                              <img
                                src={getProductImage(product)!}
                                alt={getProductName(product)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{getProductName(product)}</div>
                            <div className="text-sm text-gray-500">{product.product_id || product.id}</div>
                            <div className="flex gap-1 mt-1">
                              {hasProductVideo(product) && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                  <VideoIcon className="h-3 w-3" />
                                  Video
                                </Badge>
                              )}
                              {product.featured && (
                                <Badge className="bg-gold-400 text-xs">Featured</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getCategoryName(product)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{getProductMetal(product)}</div>
                          <div className="text-gray-500">{getMetalColorName(product)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          ${product.price?.toLocaleString() || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.gross_weight ? (
                            <>
                              <div>Gross: {product.gross_weight}g</div>
                              <div className="text-gray-500">Net: {product.net_weight || 0}g</div>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.diamond_weight ? (
                          <div className="text-sm">
                            <div>{product.diamond_weight}ct</div>
                            <div className="text-gray-500">{product.diamond_piece_count || 0} pcs</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(product.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasRole('Moderator') && (
                            <Link to={`/admin/products/${product.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasRole('Admin') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowProductInfo(product)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, products.length)} of {products.length} products
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete ? getProductName(productToDelete) : ''}"? 
              This action cannot be undone and will also delete all associated images and videos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              Delete Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Info Modal */}
      <ProductInfoModal
        isOpen={showInfoModal}
        onClose={() => {
          setShowInfoModal(false);
          setSelectedProductInfo(null);
        }}
        product={selectedProductInfo}
      />
    </div>
  );
};

export default AdminProductsPageNew;