import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Eye, ArrowLeft, AlertTriangle, ExternalLink, Video } from 'lucide-react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import Button from '../../ui/Button';
import ImageUploadZone, { ProductImage } from './ImageUploadZone';
import VideoUploadZone, { ProductVideo } from './VideoUploadZone';
import IJewelViewer from '../../products/IJewelViewer';
import { supabase } from '../../../lib/supabase';
import { deleteProductImage, deleteProductVideo } from '../../../lib/supabase-storage';
import toast from 'react-hot-toast';

// Validation Schema with iJewel URL validation
const productSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  product_name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  metal_type: z.enum(['Gold', 'Silver', 'Platinum']),
  category_id: z.string().min(1, 'Category is required'),
  metal_color_id: z.string().min(1, 'Metal color is required'),
  gross_weight: z.coerce.number().min(0, 'Gross weight must be positive'),
  net_weight: z.coerce.number().min(0, 'Net weight must be positive'),
  diamond_color: z.string().optional(),
  diamond_piece_count: z.coerce.number().int().min(0).optional(),
  diamond_weight: z.coerce.number().min(0).optional(),
  product_link: z.string().url().optional().or(z.literal('')),
  ijewel_url: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      try {
        const url = new URL(val);
        return url.hostname === 'ijewel.design' && url.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'iJewel URL must be a valid https://ijewel.design/... link'),
  featured: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

interface MetalColor {
  id: string;
  name: string;
}

interface ProductFormNewProps {
  mode: 'create' | 'edit';
}

const ProductFormNew: React.FC<ProductFormNewProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [metalColors, setMetalColors] = useState<MetalColor[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showIJewelPreview, setShowIJewelPreview] = useState(false);
  const [tempProductId, setTempProductId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_id: '',
      product_name: '',
      description: '',
      price: 0,
      metal_type: 'Gold',
      category_id: '',
      metal_color_id: '',
      gross_weight: 0,
      net_weight: 0,
      diamond_color: '',
      diamond_piece_count: 0,
      diamond_weight: 0,
      product_link: '',
      ijewel_url: '',
      featured: false,
    }
  });

  const watchedData = watch();

  // Load data
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        fetchCategories(),
        fetchMetalColors(),
        mode === 'edit' && productId ? fetchProduct(productId) : Promise.resolve()
      ]);
    };

    initialize();
  }, [mode, productId]);

  // Track unsaved changes
  useEffect(() => {
    const hasFormChanges = isDirty;
    const hasImageChanges = images.some(img => img.isNew || img.markedForDeletion);
    const hasVideoChanges = videos.some(vid => vid.isNew || vid.markedForDeletion);
    setHasUnsavedChanges(hasFormChanges || hasImageChanges || hasVideoChanges);
  }, [isDirty, images, videos]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Generate a temporary product ID for uploads when creating a new product
  useEffect(() => {
    if (mode === 'create' && !tempProductId) {
      setTempProductId(`temp_${Date.now()}`);
    }
  }, [mode, tempProductId]);

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

  const fetchProduct = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(id, image_url, storage_path),
          product_videos(id, video_url, storage_path)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Populate form
      reset({
        product_id: product.product_id || '',
        product_name: product.product_name || product.name || '',
        description: product.description || '',
        price: product.price || 0,
        metal_type: product.metal_type || 'Gold',
        category_id: product.category_id || '',
        metal_color_id: product.metal_color_id || '',
        gross_weight: product.gross_weight || 0,
        net_weight: product.net_weight || 0,
        diamond_color: product.diamond_color || '',
        diamond_piece_count: product.diamond_piece_count || 0,
        diamond_weight: product.diamond_weight || 0,
        product_link: product.product_link || '',
        ijewel_url: product.ijewel_url || '',
        featured: product.featured || false,
      });

      // Load existing images
      const existingImages: ProductImage[] = (product.product_images || []).map((img: any) => ({
        id: img.id,
        url: img.image_url,
        path: img.storage_path || '',
        isNew: false,
        markedForDeletion: false,
      }));

      setImages(existingImages);

      // Load existing videos
      const existingVideos: ProductVideo[] = (product.product_videos || []).map((vid: any) => ({
        id: vid.id,
        url: vid.video_url,
        path: vid.storage_path || '',
        isNew: false,
        markedForDeletion: false,
      }));

      setVideos(existingVideos);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      navigate('/admin/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: ProductFormData) => {
    try {
      setIsSaving(true);

      let savedProductId = productId;

      if (mode === 'create') {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([{
            product_id: data.product_id,
            product_name: data.product_name,
            name: data.product_name,
            description: data.description,
            price: data.price,
            metal_type: data.metal_type,
            category_id: data.category_id,
            metal_color_id: data.metal_color_id,
            gross_weight: data.gross_weight,
            net_weight: data.net_weight,
            diamond_color: data.diamond_color || null,
            diamond_piece_count: data.diamond_piece_count || 0,
            diamond_weight: data.diamond_weight || 0,
            product_link: data.product_link || null,
            ijewel_url: data.ijewel_url || null,
            featured: data.featured,
            availability: true,
          }])
          .select('id')
          .single();

        if (error) throw error;
        savedProductId = newProduct.id;
      } else {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            product_id: data.product_id,
            product_name: data.product_name,
            name: data.product_name,
            description: data.description,
            price: data.price,
            metal_type: data.metal_type,
            category_id: data.category_id,
            metal_color_id: data.metal_color_id,
            gross_weight: data.gross_weight,
            net_weight: data.net_weight,
            diamond_color: data.diamond_color || null,
            diamond_piece_count: data.diamond_piece_count || 0,
            diamond_weight: data.diamond_weight || 0,
            product_link: data.product_link || null,
            ijewel_url: data.ijewel_url || null,
            featured: data.featured,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId);

        if (error) throw error;
      }

      // Handle image operations
      await handleImageOperations(savedProductId!);
      
      // Handle video operations
      await handleVideoOperations(savedProductId!);

      toast.success(`Product ${mode === 'create' ? 'created' : 'updated'} successfully`);
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'} product`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageOperations = async (productId: string) => {
    // Delete marked images
    const imagesToDelete = images.filter(img => img.markedForDeletion && img.id && !img.id.startsWith('temp-'));
    for (const image of imagesToDelete) {
      try {
        // Delete from storage if path exists
        if (image.path) {
          await deleteProductImage(image.path);
        }
        
        // Delete from database
        if (image.id) {
          await supabase
            .from('product_images')
            .delete()
            .eq('id', image.id);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    // Add new images to database
    const newImages = images.filter(img => img.isNew && !img.markedForDeletion && img.path);
    if (newImages.length > 0) {
      const imageInserts = newImages.map((img) => ({
        product_id: productId,
        image_url: img.url,
        storage_path: img.path
      }));

      await supabase
        .from('product_images')
        .insert(imageInserts);
    }
  };

  const handleVideoOperations = async (productId: string) => {
    // Delete marked videos
    const videosToDelete = videos.filter(vid => vid.markedForDeletion && vid.id && !vid.id.startsWith('temp-'));
    for (const video of videosToDelete) {
      try {
        // Delete from storage if path exists
        if (video.path) {
          await deleteProductVideo(video.path);
        }
        
        // Delete from database
        if (video.id) {
          await supabase
            .from('product_videos')
            .delete()
            .eq('id', video.id);
        }
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    }

    // Add new videos to database
    const newVideos = videos.filter(vid => vid.isNew && !vid.markedForDeletion && vid.path);
    if (newVideos.length > 0) {
      const videoInserts = newVideos.map((vid) => ({
        product_id: productId,
        video_url: vid.url,
        storage_path: vid.path
      }));

      await supabase
        .from('product_videos')
        .insert(videoInserts);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation('/admin/products');
      setShowUnsavedDialog(true);
    } else {
      navigate('/admin/products');
    }
  };

  const handleReset = () => {
    if (mode === 'edit') {
      fetchProduct(productId!);
    } else {
      reset();
      setImages([]);
      setVideos([]);
    }
    toast.success('Form reset successfully');
  };

  const confirmNavigation = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === watchedData.category_id);
  };

  const getSelectedMetalColor = () => {
    return metalColors.find(color => color.id === watchedData.metal_color_id);
  };

  const isValidIJewelUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'ijewel.design' && urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'create' ? 'Add New Product' : 'Edit Product'}
            </h1>
            {hasUnsavedChanges && (
              <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="h-4 w-4" />
                You have unsaved changes
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!watchedData.product_name}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSave)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product_id">Product ID *</Label>
                    <Input
                      id="product_id"
                      {...register('product_id')}
                      placeholder="e.g., RING-001"
                    />
                    {errors.product_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.product_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="product_name">Product Name *</Label>
                    <Input
                      id="product_name"
                      {...register('product_name')}
                      placeholder="e.g., Diamond Solitaire Ring"
                    />
                    {errors.product_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.product_name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('price')}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="product_link">Product Link</Label>
                    <Input
                      id="product_link"
                      {...register('product_link')}
                      placeholder="https://example.com/product"
                      type="url"
                    />
                    {errors.product_link && (
                      <p className="text-sm text-red-600 mt-1">{errors.product_link.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Detailed product description..."
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="featured"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="featured"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="featured">Featured Product</Label>
                </div>
              </CardContent>
            </Card>

            {/* Material & Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Material & Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="metal_type">Metal Type *</Label>
                    <Controller
                      name="metal_type"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select metal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Gold">Gold</SelectItem>
                            <SelectItem value="Silver">Silver</SelectItem>
                            <SelectItem value="Platinum">Platinum</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.metal_type && (
                      <p className="text-sm text-red-600 mt-1">{errors.metal_type.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category_id">Category *</Label>
                    <Controller
                      name="category_id"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.category_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="metal_color_id">Metal Color *</Label>
                    <Controller
                      name="metal_color_id"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select metal color" />
                          </SelectTrigger>
                          <SelectContent>
                            {metalColors.map((color) => (
                              <SelectItem key={color.id} value={color.id}>
                                {color.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.metal_color_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.metal_color_id.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gross_weight">Gross Weight (g) *</Label>
                    <Input
                      id="gross_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('gross_weight')}
                      placeholder="0.00"
                    />
                    {errors.gross_weight && (
                      <p className="text-sm text-red-600 mt-1">{errors.gross_weight.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="net_weight">Net Weight (g) *</Label>
                    <Input
                      id="net_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('net_weight')}
                      placeholder="0.00"
                    />
                    {errors.net_weight && (
                      <p className="text-sm text-red-600 mt-1">{errors.net_weight.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diamond Information */}
            <Card>
              <CardHeader>
                <CardTitle>Diamond Information (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="diamond_color">Diamond Color</Label>
                    <Input
                      id="diamond_color"
                      {...register('diamond_color')}
                      placeholder="e.g., D, E, F"
                    />
                  </div>

                  <div>
                    <Label htmlFor="diamond_piece_count">Diamond Pieces</Label>
                    <Input
                      id="diamond_piece_count"
                      type="number"
                      min="0"
                      {...register('diamond_piece_count')}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="diamond_weight">Diamond Weight (ct)</Label>
                    <Input
                      id="diamond_weight"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('diamond_weight')}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3D Model Viewer */}
            <Card>
              <CardHeader>
                <CardTitle>3D Model Viewer (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ijewel_url">iJewel 3D Viewer URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ijewel_url"
                      {...register('ijewel_url')}
                      placeholder="https://ijewel.design/profile/..."
                      type="url"
                      className="flex-1"
                    />
                    {watchedData.ijewel_url && isValidIJewelUrl(watchedData.ijewel_url) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowIJewelPreview(true)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {errors.ijewel_url && (
                    <p className="text-sm text-red-600 mt-1">{errors.ijewel_url.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Enter a valid iJewel.design URL to enable 3D model viewing for this product.
                  </p>
                </div>

                {/* iJewel URL Preview */}
                {watchedData.ijewel_url && isValidIJewelUrl(watchedData.ijewel_url) && (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <ExternalLink className="h-4 w-4" />
                      <span className="font-medium">3D Viewer Ready</span>
                    </div>
                    <p className="text-sm text-green-600">
                      This product will display an interactive 3D model viewer on the product detail page.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploadZone
                  images={images}
                  onImagesChange={setImages}
                  productId={mode === 'edit' ? productId : tempProductId}
                  maxImages={10}
                  disabled={isSaving}
                />
              </CardContent>
            </Card>

            {/* Product Videos */}
            <Card>
              <CardHeader>
                <CardTitle>Product Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoUploadZone
                  videos={videos}
                  onVideosChange={setVideos}
                  productId={mode === 'edit' ? productId : tempProductId}
                  maxVideos={3}
                  disabled={isSaving}
                />
              </CardContent>
            </Card>
          </div>

          {/* Live Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {images.length > 0 && !images[0].markedForDeletion ? (
                      <img
                        src={images[0].url}
                        alt={watchedData.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <h3 className="font-medium text-gray-800 line-clamp-2">
                      {watchedData.product_name || 'Product Name'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {watchedData.metal_type} • {getSelectedCategory()?.name || 'Category'}
                    </p>
                    <p className="font-medium text-blue-600 mt-2">
                      ${watchedData.price?.toLocaleString() || '0'}
                    </p>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Metal Color:</span>
                      <span className="text-gray-800">{getSelectedMetalColor()?.name || '-'}</span>
                    </div>
                    {watchedData.diamond_weight && watchedData.diamond_weight > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Diamond:</span>
                        <span className="text-gray-800">{watchedData.diamond_weight}ct</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Weight:</span>
                      <span className="text-gray-800">{watchedData.gross_weight || 0}g</span>
                    </div>
                    {watchedData.ijewel_url && isValidIJewelUrl(watchedData.ijewel_url) && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">3D Viewer:</span>
                        <span className="text-green-600">✓ Available</span>
                      </div>
                    )}
                    {videos.length > 0 && !videos[0].markedForDeletion && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Video:</span>
                        <span className="text-green-600">✓ Available</span>
                      </div>
                    )}
                  </div>

                  {watchedData.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {watchedData.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              Reset
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              disabled={!watchedData.product_name || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Create Product' : 'Update Product'}
            </Button>
          </div>
        </div>
      </form>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
            >
              Stay
            </Button>
            <Button
              variant="outline"
              onClick={confirmNavigation}
              className="text-red-600 hover:text-red-700"
            >
              Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* iJewel Preview Modal */}
      <Dialog open={showIJewelPreview} onOpenChange={setShowIJewelPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>iJewel 3D Viewer Preview</DialogTitle>
          </DialogHeader>
          {watchedData.ijewel_url && isValidIJewelUrl(watchedData.ijewel_url) && (
            <IJewelViewer
              ijewelUrl={watchedData.ijewel_url}
              productName={watchedData.product_name || 'Product Preview'}
              height="500px"
              showFullscreenButton={false}
              lazy={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Preview</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {images.length > 0 && !images[0].markedForDeletion ? (
                <img
                  src={images[0].url}
                  alt={watchedData.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-serif text-gray-800">
                  {watchedData.product_name || 'Product Name'}
                </h2>
                <p className="text-xl font-medium text-blue-600 mt-2">
                  ${watchedData.price?.toLocaleString() || '0'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Metal Type</span>
                  <p className="font-medium">{watchedData.metal_type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="font-medium">{getSelectedCategory()?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Metal Color</span>
                  <p className="font-medium">{getSelectedMetalColor()?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Weight</span>
                  <p className="font-medium">{watchedData.gross_weight || 0}g</p>
                </div>
              </div>
              
              {watchedData.description && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-600">{watchedData.description}</p>
                </div>
              )}

              {videos.length > 0 && !videos[0].markedForDeletion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Video className="h-4 w-4" />
                    <span className="font-medium">Product Video Available</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    This product includes a video that will be displayed on the product page.
                  </p>
                </div>
              )}

              {watchedData.ijewel_url && isValidIJewelUrl(watchedData.ijewel_url) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <ExternalLink className="h-4 w-4" />
                    <span className="font-medium">3D Model Available</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    This product includes an interactive 3D model viewer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductFormNew;