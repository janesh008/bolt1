import { z } from 'zod';

// Form schema for the AI designer initial input
export const designFormSchema = z.object({
  category: z.enum(['ring', 'necklace', 'earrings', 'bracelet', 'pendant'], {
    required_error: "Please select a jewelry category",
  }),
  metal_type: z.enum(['gold', 'silver', 'platinum', 'rose-gold'], {
    required_error: "Please select a metal type",
  }),
  style: z.enum(['modern', 'classic', 'vintage', 'minimalist', 'statement'], {
    required_error: "Please select a style",
  }),
  diamond_type: z.enum(['none', 'small', 'medium', 'large', 'multiple'], {
    required_error: "Please select a diamond option",
  }),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  reference_image: z.any().optional(),
});

export type DesignFormValues = z.infer<typeof designFormSchema>;

// Session status types
export type SessionStatus = 'active' | 'completed' | 'expired';

// Sender types for messages
export type MessageSender = 'user' | 'assistant';

// AI Design Session interface
export interface AIDesignSession {
  id: string;
  user_id: string;
  category: string;
  metal_type: string;
  style: string;
  diamond_type: string;
  description: string;
  reference_image_url?: string;
  status: SessionStatus;
  is_favorite: boolean;
  created_at: string;
  expires_at: string | null;
  last_message_at?: string;
  title?: string;
}

// AI Message interface
export interface AIMessage {
  id: string;
  session_id: string;
  sender: MessageSender;
  message: string;
  image_url?: string;
  created_at: string;
}

// Response from the AI service
export interface AIResponse {
  message: string;
  image_url?: string;
}

// Store types for Zustand
export interface AIDesignerStore {
  sessions: AIDesignSession[];
  currentSession: AIDesignSession | null;
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Session actions
  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  createSession: (formData: DesignFormValues, imageFile?: File) => Promise<string | null>;
  deleteSession: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  
  // Message actions
  fetchMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, message: string, imageFile?: File) => Promise<void>;
  
  // UI state
  setCurrentSession: (session: AIDesignSession | null) => void;
  clearError: () => void;
}