import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  user_id?: string;
  session_id?: string;
}

interface SupabaseCartItemRow {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    product_name?: string;
    name?: string;
    price: number;
    product_images: {
      image_url: string;
    }[];
  }[];
}

interface UseCartReturn {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  addToCart: (item: Omit<CartItem, 'id' | 'user_id' | 'session_id'>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
}

const CART_STORAGE_KEY = 'axels_cart';

export const useCart = (): UseCartReturn => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate session ID for guest users
  const getSessionId = useCallback(() => {
    let sessionId = localStorage.getItem('axels_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('axels_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Load cart from localStorage
  const loadLocalCart = useCallback(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  }, []);

  // Save cart to localStorage
  const saveLocalCart = useCallback((cartItems: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, []);

  // Load cart from Supabase
  const loadServerCart = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
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
        .eq('user_id', user.id);

      if (error) throw error;

      return (data || []).map((item: SupabaseCartItemRow) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products?.[0]?.product_name || item.products?.[0]?.name || 'Unknown Product',
        price: item.products?.[0]?.price || 0,
        image: item.products?.[0]?.product_images?.[0]?.image_url || '',
        quantity: item.quantity,
        user_id: user.id,
      }));
    } catch (error) {
      console.error('Error loading cart from server:', error);
      return [];
    }
  }, [user]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      if (user && !itemId.startsWith('local_')) {
        // Authenticated user - remove from server
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Update local state
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      saveLocalCart(updatedItems);

      toast.success('Removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart');
    }
  }, [user, items, saveLocalCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      if (user && !itemId.startsWith('local_')) {
        // Authenticated user - update on server
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Update local state
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      setItems(updatedItems);
      saveLocalCart(updatedItems);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  }, [user, items, removeFromCart, saveLocalCart]);

  // Add item to cart
  const addToCart = useCallback(async (newItem: Omit<CartItem, 'id' | 'user_id' | 'session_id'>) => {
    try {
      setIsLoading(true);

      if (!newItem.product_id) {
        console.error('Product ID is required');
        toast.error('Failed to add to cart: Missing product ID');
        return;
      }

      if (user) {
        // Authenticated user - save to server
        const existingItem = items.find(item => item.product_id === newItem.product_id);

        if (existingItem) {
          // Update existing item
          const newQuantity = existingItem.quantity + newItem.quantity;
          await updateQuantity(existingItem.id, newQuantity);
        } else {
          // Add new item
          const { data, error } = await supabase
            .from('cart_items')
            .insert([{
              user_id: user.id,
              product_id: newItem.product_id,
              quantity: newItem.quantity,
            }])
            .select()
            .single();

          if (error) throw error;

          // Fetch product details
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select(`
              id,
              product_name,
              name,
              price,
              product_images (
                image_url
              )
            `)
            .eq('id', newItem.product_id)
            .single();

          if (productError) throw productError;

          const cartItem: CartItem = {
            id: data.id,
            product_id: data.product_id,
            name: productData?.product_name || productData?.name || newItem.name,
            price: productData?.price || newItem.price,
            image: productData?.product_images?.[0]?.image_url || newItem.image,
            quantity: data.quantity,
            user_id: user.id,
          };

          const updatedItems = [...items, cartItem];
          setItems(updatedItems);
          saveLocalCart(updatedItems);
        }
      } else {
        // Guest user - save to localStorage
        const existingIndex = items.findIndex(item => item.product_id === newItem.product_id);
        let updatedItems: CartItem[];

        if (existingIndex >= 0) {
          // Update existing item
          updatedItems = items.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          );
        } else {
          // Add new item
          const cartItem: CartItem = {
            ...newItem,
            id: `local_${Date.now()}_${Math.random()}`,
            session_id: getSessionId(),
          };
          updatedItems = [...items, cartItem];
        }

        setItems(updatedItems);
        saveLocalCart(updatedItems);
      }

      toast.success('Added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  }, [user, items, updateQuantity, saveLocalCart, getSessionId]);

  // Sync guest cart with server cart on login
  const syncCart = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const localCart = loadLocalCart();
      
      // Filter out items that don't have product_id
      const validLocalCart = localCart.filter(item => item.product_id);
      
      if (validLocalCart.length === 0) {
        // No valid local items to sync, just load server cart
        const serverCart = await loadServerCart();
        setItems(serverCart);
        saveLocalCart(serverCart);
        return;
      }
      
      const serverCart = await loadServerCart();

      // Merge carts - prioritize local cart quantities
      const mergedCart = [...serverCart];
      
      for (const localItem of validLocalCart) {
        const existingIndex = mergedCart.findIndex(
          item => item.product_id === localItem.product_id
        );

        if (existingIndex >= 0) {
          // Update quantity if item exists in server cart
          mergedCart[existingIndex].quantity += localItem.quantity;
        } else {
          // Add new item from local cart
          mergedCart.push({
            ...localItem,
            id: `temp_${Date.now()}_${Math.random()}`,
            user_id: user.id,
          });
        }
      }

      // Save merged cart to server
      // Clear existing cart items
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      // Insert merged cart
      const cartInserts = mergedCart.map(item => ({
        user_id: user.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      if (cartInserts.length > 0) {
        const { error } = await supabase
          .from('cart_items')
          .insert(cartInserts);

        if (error) throw error;
      }

      // Clear local cart after successful sync
      localStorage.removeItem(CART_STORAGE_KEY);

      // Load final cart state
      const finalCart = await loadServerCart();
      setItems(finalCart);
      saveLocalCart(finalCart);
    } catch (error) {
      console.error('Error syncing cart:', error);
      toast.error('Failed to sync cart');
    } finally {
      setIsLoading(false);
    }
  }, [user, loadLocalCart, loadServerCart, saveLocalCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true);

      if (user) {
        // Authenticated user - clear from server
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Clear local state
      setItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initialize cart
  useEffect(() => {
    const initializeCart = async () => {
      if (isInitialized) return;
      
      setIsLoading(true);
      
      try {
        if (user) {
          // User is logged in - sync and load from server
          await syncCart();
        } else {
          // Guest user - load from localStorage
          const localCart = loadLocalCart();
          setItems(localCart);
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeCart();
  }, [user, syncCart, loadLocalCart, isInitialized]);

  // Calculate totals
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  return {
    items,
    totalItems,
    totalPrice,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCart,
  };
};