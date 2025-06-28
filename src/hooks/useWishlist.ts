import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface WishlistItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image: string;
  created_at: string;
}

interface SupabaseWishlistRow {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    product_name?: string;
    name?: string;
    price: number;
    product_images: {
      image_url: string;
    }[];
  };
}

interface UseWishlistReturn {
  items: WishlistItem[];
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
}

export const useWishlist = (): UseWishlistReturn => {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist from server
  const loadWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            product_name,
            name,
            price,
            product_images (
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const wishlistItems: WishlistItem[] = (data || []).map((item: SupabaseWishlistRow) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products?.product_name || item.products?.name || 'Unknown Product',
        price: item.products?.price || 0,
        image: item.products?.product_images?.[0]?.image_url || '',
        created_at: item.created_at,
      }));

      setItems(wishlistItems);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initialize wishlist
  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.product_id === productId);
  }, [items]);

  // Add to wishlist
  const addToWishlist = useCallback(async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }

    if (isInWishlist(productId)) {
      return; // Already in wishlist
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('wishlists')
        .insert([{
          user_id: user.id,
          product_id: productId,
        }])
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            product_name,
            name,
            price,
            product_images (
              image_url
            )
          )
        `)
        .single();

      if (error) throw error;

      const newItem: WishlistItem = {
        id: data.id,
        product_id: data.product_id,
        name: data.products?.product_name || data.products?.name || 'Unknown Product',
        price: data.products?.price || 0,
        image: data.products?.product_images?.[0]?.image_url || '',
        created_at: data.created_at,
      };

      setItems(prev => [newItem, ...prev]);
      toast.success('Added to wishlist');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [user, isInWishlist]);

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to manage your wishlist');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Toggle wishlist
  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  // Clear wishlist
  const clearWishlist = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    items,
    isLoading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
  };
};