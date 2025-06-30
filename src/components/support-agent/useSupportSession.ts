import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SupportAgentController, Message } from './SupportAgentController';

export interface SupportSessionState {
  isOpen: boolean;
  isListening: boolean;
  messages: Message[];
  language: string;
  isLoading: boolean;
  error: string | null;
  customerName: string;
}

export function useSupportSession() {
  const { user } = useAuth();
  const [state, setState] = useState<SupportSessionState>({
    isOpen: false,
    isListening: false,
    messages: [],
    language: 'en', // Default language
    isLoading: false,
    error: null,
    customerName: ''
  });
  
  const controllerRef = useRef<SupportAgentController | null>(null);
  
  // Initialize controller
  useEffect(() => {
    if (user) {
      const controller = new SupportAgentController((newState) => {
        setState(prevState => ({ ...prevState, ...newState }));
      });
      
      controller.init(user.id).catch(console.error);
      controllerRef.current = controller;
      
      // Set customer name from user data
      setState(prev => ({
        ...prev,
        customerName: user.email_confirmed_at ? (user.user_metadata?.full_name || user.email) : 'Guest'
      }));
      
      return () => {
        controller.dispose();
        controllerRef.current = null;
      };
    }
  }, [user]);
  
  const toggleOpen = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };
  
  const startListening = () => {
    if (controllerRef.current) {
      controllerRef.current.startRecording(state.language);
    }
  };
  
  const stopListening = () => {
    if (controllerRef.current) {
      controllerRef.current.stopRecording();
    }
  };
  
  const sendMessage = (message: string) => {
    if (controllerRef.current) {
      controllerRef.current.sendMessage(message);
    }
  };
  
  const setLanguage = (language: string) => {
    setState(prev => ({ ...prev, language }));
  };
  
  const clearMessages = () => {
    setState(prev => ({ ...prev, messages: [] }));
  };
  
  return {
    state,
    toggleOpen,
    startListening,
    stopListening,
    sendMessage,
    setLanguage,
    clearMessages
  };
}