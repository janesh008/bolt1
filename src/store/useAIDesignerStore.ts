import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid'; 
import { 
  AIDesignerStore, 
  DesignFormValues 
} from '../types/ai-designer';
import toast from 'react-hot-toast';

const useAIDesignerStore = create<AIDesignerStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isLoading: false,
  error: null,

  // Fetch all sessions for the current user
  fetchSessions: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      const { data: sessions, error } = await supabase
        .from('ai_design_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });
      
      if (error) throw error;
      
      set({ sessions: sessions || [] });
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      set({ error: error.message });
      toast.error('Failed to load your design sessions');
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch a specific session by ID
  fetchSession: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      const { data: session, error } = await supabase
        .from('ai_design_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      set({ currentSession: session });
      
      // Also fetch messages for this session
      get().fetchMessages(id);
    } catch (error: any) {
      console.error('Error fetching session:', error);
      set({ error: error.message });
      toast.error('Failed to load design session');
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new design session
  createSession: async (formData: DesignFormValues, imageFile?: File) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Check if user has reached the limit of favorite sessions
      if (formData.is_favorite) {
        const { data: favoriteCount, error: countError } = await supabase
          .from('ai_design_sessions')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_favorite', true);
        
        if (countError) throw countError;
        
        if ((favoriteCount?.length || 0) >= 5) {
          toast.error('You can only have up to 5 favorite sessions');
          return null;
        }
      }
      
      // Upload reference image if provided
      let reference_image_url = undefined;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `design-references/${user.id}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('design-references')
          .upload(filePath, imageFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('design-references')
          .getPublicUrl(filePath);
        
        reference_image_url = publicUrl;
      }
      
      // Calculate expiration date (15 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);
      
      // Create session record
      const { data: session, error } = await supabase
        .from('ai_design_sessions')
        .insert([{
          user_id: user.id,
          category: formData.category,
          metal_type: formData.metal_type,
          style: formData.style,
          diamond_type: formData.diamond_type,
          description: formData.description,
          reference_image_url,
          status: 'active',
          is_favorite: false,
          expires_at: expiresAt.toISOString(),
          last_message_at: new Date().toISOString(),
          title: `${formData.category} in ${formData.metal_type} (${formData.style})`,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Generate initial AI message
      if (session) {
        await get().sendInitialMessage(session.id, formData, reference_image_url);
        set({ currentSession: session });
        
        // Refresh sessions list
        await get().fetchSessions();
        
        return session.id;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error creating session:', error);
      set({ error: error.message });
      toast.error('Failed to create design session');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Send initial message to AI
  sendInitialMessage: async (sessionId: string, formData: DesignFormValues, imageUrl?: string) => {
    try {
      // Get current user and session for authentication
      const { data: { user, session }, error: authError } = await supabase.auth.getSession();
      if (authError || !user || !session) {
        throw new Error('User not authenticated');
      }
      
      // Create user's initial message
      const initialMessage = `I'd like to design a ${formData.style} ${formData.category} in ${formData.metal_type}${formData.diamond_type !== 'none' ? ` with ${formData.diamond_type} diamonds` : ''}. ${formData.description}`;
      
      const { error: messageError } = await supabase
        .from('ai_messages')
        .insert([{
          session_id: sessionId,
          sender: 'user',
          message: initialMessage,
          image_url: imageUrl,
        }]);
      
      if (messageError) throw messageError;
      
      // Get AI response
      const response = await fetch('/api/ai/send-message', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: initialMessage,
          reference_image_url: imageUrl,
          is_initial: true,
          form_data: formData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }
      
      const aiResponse = await response.json();
      
      // Save AI response to database
      const { error: aiMessageError } = await supabase
        .from('ai_messages')
        .insert([{
          session_id: sessionId,
          sender: 'assistant',
          message: aiResponse.message,
          image_url: aiResponse.image_url,
        }]);
      
      if (aiMessageError) throw aiMessageError;
      
      // Update session with last message timestamp
      await supabase
        .from('ai_design_sessions')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', sessionId);
      
    } catch (error: any) {
      console.error('Error sending initial message:', error);
      toast.error('Failed to generate initial design');
    }
  },

  // Delete a session
  deleteSession: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Delete all messages in the session
      const { error: messagesError } = await supabase
        .from('ai_messages')
        .delete()
        .eq('session_id', id);
      
      if (messagesError) throw messagesError;
      
      // Delete the session (only if it belongs to the current user)
      const { error } = await supabase
        .from('ai_design_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        sessions: state.sessions.filter(session => session.id !== id),
        currentSession: state.currentSession?.id === id ? null : state.currentSession,
      }));
      
      toast.success('Design session deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting session:', error);
      set({ error: error.message });
      toast.error('Failed to delete design session');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Toggle favorite status
  toggleFavorite: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Get current session
      const { data: session, error: fetchError } = await supabase
        .from('ai_design_sessions')
        .select('is_favorite')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newFavoriteStatus = !session.is_favorite;
      
      // If trying to favorite, check if limit reached
      if (newFavoriteStatus) {
        const { data: favoriteCount, error: countError } = await supabase
          .from('ai_design_sessions')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_favorite', true);
        
        if (countError) throw countError;
        
        if ((favoriteCount?.length || 0) >= 5) {
          toast.error('You can only have up to 5 favorite sessions');
          return false;
        }
      }
      
      // Update favorite status
      const { error } = await supabase
        .from('ai_design_sessions')
        .update({ 
          is_favorite: newFavoriteStatus,
          // If favorited, remove expiration; if unfavorited, set expiration to 15 days from now
          expires_at: newFavoriteStatus ? null : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        sessions: state.sessions.map(s => 
          s.id === id ? { ...s, is_favorite: newFavoriteStatus } : s
        ),
        currentSession: state.currentSession?.id === id 
          ? { ...state.currentSession, is_favorite: newFavoriteStatus }
          : state.currentSession
      }));
      
      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
      return true;
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      set({ error: error.message });
      toast.error('Failed to update favorite status');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch messages for a session
  fetchMessages: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: messages, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      set({ messages: messages || [] });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({ error: error.message });
      toast.error('Failed to load conversation');
    } finally {
      set({ isLoading: false });
    }
  },

  // Send a message in a session
  sendMessage: async (sessionId: string, message: string, imageFile?: File) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get current user and session for authentication
      const { data: { user, session }, error: authError } = await supabase.auth.getSession();
      if (authError || !user || !session) {
        throw new Error('User not authenticated');
      }
      
      // Upload image if provided
      let imageUrl = undefined;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `design-references/${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('design-references')
          .upload(filePath, imageFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('design-references')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }
      
      // Save user message
      const { data: userMessage, error: messageError } = await supabase
        .from('ai_messages')
        .insert([{
          session_id: sessionId,
          sender: 'user',
          message,
          image_url: imageUrl,
        }])
        .select()
        .single();
      
      if (messageError) throw messageError;
      
      // Update local state with user message
      set(state => ({
        messages: [...state.messages, userMessage],
      }));
      
      // Get AI response
      const response = await fetch('/api/ai/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message,
          reference_image_url: imageUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }
      
      const aiResponse = await response.json();
      
      // Save AI response
      const { data: assistantMessage, error: aiMessageError } = await supabase
        .from('ai_messages')
        .insert([{
          session_id: sessionId,
          sender: 'assistant',
          message: aiResponse.message,
          image_url: aiResponse.image_url,
        }])
        .select()
        .single();
      
      if (aiMessageError) throw aiMessageError;
      
      // Update local state with AI message
      set(state => ({
        messages: [...state.messages, assistantMessage],
      }));
      
      // Update session with last message timestamp
      await supabase
        .from('ai_design_sessions')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', sessionId);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      set({ error: error.message });
      toast.error('Failed to send message');
    } finally {
      set({ isLoading: false });
    }
  },

  // UI state management
  setCurrentSession: (session) => {
    set({ currentSession: session });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));

export default useAIDesignerStore;