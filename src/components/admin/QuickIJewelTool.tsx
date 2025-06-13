import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import Button from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ExternalLink, Cuboid as Cube } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  product_name?: string;
  name?: string;
  ijewel_url?: string;
}

const QuickIJewelTool: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [ijewelUrl, setIjewelUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name, name, ijewel_url')
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    setIjewelUrl(product?.ijewel_url || '');
  };

  const handleSave = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    // Validate iJewel URL
    if (ijewelUrl && !isValidIJewelUrl(ijewelUrl)) {
      toast.error('Please enter a valid iJewel.design URL');
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('products')
        .update({ ijewel_url: ijewelUrl || null })
        .eq('id', selectedProductId);

      if (error) throw error;

      toast.success('iJewel URL updated successfully!');
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update iJewel URL');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidIJewelUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'ijewel.design' && urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const getProductName = (product: Product) => {
    return product.product_name || product.name || 'Unknown Product';
  };

  const addSampleUrl = () => {
    setIjewelUrl('https://ijewel.design/profile/shared/6751a4b5e4b0c8a2a8f5d123');
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cube className="h-5 w-5 text-blue-600" />
          Quick iJewel URL Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="product-select">Select Product</Label>
          <Select value={selectedProductId} onValueChange={handleProductSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a product to add 3D viewer..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{getProductName(product)}</span>
                    {product.ijewel_url && (
                      <Cube className="h-3 w-3 text-blue-600 ml-2" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="ijewel-url">iJewel 3D Viewer URL</Label>
          <div className="flex gap-2">
            <Input
              id="ijewel-url"
              type="url"
              value={ijewelUrl}
              onChange={(e) => setIjewelUrl(e.target.value)}
              placeholder="https://ijewel.design/profile/..."
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={addSampleUrl}
              title="Add sample URL for testing"
            >
              Sample
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter a valid iJewel.design URL to enable 3D model viewing for this product.
          </p>
          {ijewelUrl && !isValidIJewelUrl(ijewelUrl) && (
            <p className="text-sm text-red-600 mt-1">
              Please enter a valid https://ijewel.design/... URL
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            isLoading={isLoading}
            disabled={!selectedProductId}
            className="flex-1"
          >
            Save iJewel URL
          </Button>
          {ijewelUrl && isValidIJewelUrl(ijewelUrl) && (
            <Button
              variant="outline"
              onClick={() => window.open(ijewelUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Select a product from the dropdown</li>
            <li>2. Enter a valid iJewel.design URL or click "Sample" for testing</li>
            <li>3. Click "Save" to update the product</li>
            <li>4. Visit the product page to see the 3D viewer in action</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickIJewelTool;