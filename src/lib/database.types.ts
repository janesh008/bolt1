export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          dob: string | null
          gender: string | null
          country: string | null
          state: string | null
          city: string | null
          zip_code: string | null
          created_at: string | null
          status: string | null
          role: string | null
          last_login: string | null
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          dob?: string | null
          gender?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          zip_code?: string | null
          created_at?: string | null
          status?: string | null
          role?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          dob?: string | null
          gender?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          zip_code?: string | null
          created_at?: string | null
          status?: string | null
          role?: string | null
          last_login?: string | null
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          address: string
          city: string
          state: string
          zip_code: string
          type: string
          is_default: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          address: string
          city: string
          state: string
          zip_code: string
          type: string
          is_default?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          address?: string
          city?: string
          state?: string
          zip_code?: string
          type?: string
          is_default?: boolean | null
          created_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          product_type: string
          price: number
          metal: string
          tags: string[] | null
          certification_info: Json | null
          description: string
          availability: boolean | null
          model_3d_url: string | null
          created_at: string | null
          product_id: string | null
          product_name: string | null
          metal_type: string | null
          category_id: string | null
          diamond_color: string | null
          diamond_piece_count: number | null
          diamond_weight: number | null
          gross_weight: number | null
          net_weight: number | null
          metal_color_id: string | null
          stock_quantity: number | null
          featured: boolean | null
          updated_at: string | null
          ijewel_url: string | null
        }
        Insert: {
          id?: string
          name: string
          product_type: string
          price: number
          metal: string
          tags?: string[] | null
          certification_info?: Json | null
          description: string
          availability?: boolean | null
          model_3d_url?: string | null
          created_at?: string | null
          product_id?: string | null
          product_name?: string | null
          metal_type?: string | null
          category_id?: string | null
          diamond_color?: string | null
          diamond_piece_count?: number | null
          diamond_weight?: number | null
          gross_weight?: number | null
          net_weight?: number | null
          metal_color_id?: string | null
          stock_quantity?: number | null
          featured?: boolean | null
          updated_at?: string | null
          ijewel_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          product_type?: string
          price?: number
          metal?: string
          tags?: string[] | null
          certification_info?: Json | null
          description?: string
          availability?: boolean | null
          model_3d_url?: string | null
          created_at?: string | null
          product_id?: string | null
          product_name?: string | null
          metal_type?: string | null
          category_id?: string | null
          diamond_color?: string | null
          diamond_piece_count?: number | null
          diamond_weight?: number | null
          gross_weight?: number | null
          net_weight?: number | null
          metal_color_id?: string | null
          stock_quantity?: number | null
          featured?: boolean | null
          updated_at?: string | null
          ijewel_url?: string | null
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string
          angle: string | null
          storage_path: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          image_url: string
          angle?: string | null
          storage_path?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          image_url?: string
          angle?: string | null
          storage_path?: string | null
          created_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          created_at: string
          is_active: boolean | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          is_active?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          is_active?: boolean | null
        }
      }
      metal_colors: {
        Row: {
          id: string
          name: string
          hex_color: string | null
          created_at: string | null
          updated_at: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          name: string
          hex_color?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          hex_color?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_active?: boolean | null
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string | null
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
          role: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          role?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          role?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          order_number: string
          status: string
          total_amount: number
          shipping_address: Json | null
          billing_address: Json | null
          payment_status: string | null
          payment_method: string | null
          stripe_payment_intent_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          order_number: string
          status?: string
          total_amount: number
          shipping_address?: Json | null
          billing_address?: Json | null
          payment_status?: string | null
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          order_number?: string
          status?: string
          total_amount?: number
          shipping_address?: Json | null
          billing_address?: Json | null
          payment_status?: string | null
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
    }
  }
}