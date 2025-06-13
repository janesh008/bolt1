export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  angle: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  metal: string;
  tags?: string[] | null;
  certification_info?: any | null;
  description: string;
  availability: boolean;
  model_3d_url?: string | null;
  created_at: string;
  product_images?: ProductImage[];
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  profile_image?: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  address: string;
  type: string;
  is_default: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total_price: number;
  status: string;
  payment_mode: string;
  payment_id: string | null;
  placed_at: string;
  items?: OrderItem[];
}