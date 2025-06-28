import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{error: any | null}>;
  signUp: (email: string, password: string) => Promise<{data: any | null, error: any | null}>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  resendVerification: (email: string) => Promise<{error: any | null}>;
  // Temporary bypass methods
  bypassAuth: () => void;
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Temporary test user for development
const DEV_USER: User = {
  id: 'dev-user-123',
  email: 'test@axels.com',
  email_confirmed_at: new Date().toISOString()
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  
  // Temporary bypass function for development
  const bypassAuth = () => {
    setIsDevMode(true);
    setUser(DEV_USER);
    setIsLoading(false);
    localStorage.setItem('dev_auth_bypass', 'true');
  };
  
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if dev mode is enabled
      const devBypass = localStorage.getItem('dev_auth_bypass');
      if (devBypass === 'true') {
        setIsDevMode(true);
        setUser(DEV_USER);
        setIsLoading(false);
        return;
      }
      
      const { user, error } = await getCurrentUser();
      
      if (error || !user) {
        setUser(null);
        return;
      }
      
      setUser({
        id: user.id,
        email: user.email || '',
        email_confirmed_at: user.email_confirmed_at
      });
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    checkAuth();
    
    // Subscribe to auth changes (only if not in dev mode)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (isDevMode) return; // Skip auth changes in dev mode
      
      if (session && session.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          email_confirmed_at: session.user.email_confirmed_at
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkAuth, isDevMode]);
  
  const signIn = async (email: string, password: string) => {
    // Check for test credentials
    if (email === 'test@axels.com' && password === 'password123') {
      setUser(DEV_USER);
      setIsDevMode(true);
      localStorage.setItem('dev_auth_bypass', 'true');
      return { error: null };
    }
    
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        email_confirmed_at: data.user.email_confirmed_at
      });
    }
    
    setIsLoading(false);
    return { error };
  };
  
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    
    setIsLoading(false);
    return { data, error };
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    
    return { error };
  };
  
  const signOut = async () => {
    if (isDevMode) {
      setIsDevMode(false);
      localStorage.removeItem('dev_auth_bypass');
    } else {
      await supabase.auth.signOut();
    }
    setUser(null);
  };
  
  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    checkAuth,
    resendVerification,
    bypassAuth,
    isDevMode
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};