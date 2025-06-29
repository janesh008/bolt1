import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Role, hasPermission } from '../lib/auth';

interface AdminUser {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  hasRole: (requiredRole: Role) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        // Get admin user data
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (!adminError && adminUser) {
          setUser(adminUser);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (requiredRole: Role): boolean => {
    if (!user) return false;
    return hasPermission(user.role as Role, requiredRole);
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check if this is a development credential first
      // const devCred = DEV_CREDENTIALS[email as keyof typeof DEV_CREDENTIALS];
      // if (devCred) {
      //   // Validate development credentials
      //   if (devCred.password !== password) {
      //     return { error: { message: 'Invalid login credentials' } };
      //   }
        
      //   // Handle development authentication directly
      //   return await handleMockAuth(email, devCred);
      // }

      // For non-development credentials, try Supabase authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return { error: authError };
      }

      if (authData.user) {
        console.log(authData.user);
        // Get or create admin user record
        let { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .eq('status', 'active')
          .maybeSingle();

        if (adminError) {
          console.error('Error fetching admin user:', adminError);
          return { error: adminError };
        }

        if (!adminUser) {
          // Admin user doesn't exist, create one
          // const { data: newAdminUser, error: createError } = await supabase
          //   .from('admin_users')
          //   .insert([{
          //     auth_user_id: authData.user.id,
          //     email,
          //     name: email.split('@')[0], // Use email prefix as name
          //     role: 'Moderator', // Default role
          //     status: 'active'
          //   }])
          //   .select()
          //   .maybeSingle();

          // if (createError) {
          //   console.error('Error creating admin user:', createError);
          //   return { error: createError };
          // }

          // adminUser = newAdminUser;
        }

        // Update auth_user_id if it's null
        if (adminUser && !adminUser.auth_user_id) {
          const { error: updateError } = await supabase
            .from('admin_users')
            .update({ auth_user_id: authData.user.id })
            .eq('id', adminUser.id);

          if (updateError) {
            console.warn('Could not update auth_user_id:', updateError);
          } else {
            adminUser.auth_user_id = authData.user.id;
          }
        }

        setUser(adminUser);
        return { error: null };
      }

      return { error: { message: 'Authentication failed' } };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const _handleMockAuth = async (email: string, devCred: any) => {
    try {
      // Get existing admin user or create mock user
      let { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .maybeSingle();

      if (adminError) {
        console.error('Error fetching admin user:', adminError);
        return { error: adminError };
      }

      if (!adminUser) {
        // Admin user doesn't exist, create one without auth_user_id
        const { data: newAdminUser, error: createError } = await supabase
          .from('admin_users')
          .insert([{
            email,
            name: devCred.name,
            role: devCred.role,
            status: 'active'
          }])
          .select()
          .maybeSingle();

        if (createError) {
          console.error('Error creating mock admin user:', createError);
          // Create a completely mock user if database fails
          const mockUser: AdminUser = {
            id: `dev-${email.split('@')[0]}-${Date.now()}`,
            auth_user_id: null,
            email,
            name: devCred.name,
            role: devCred.role,
            status: 'active',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUser(mockUser);
          return { error: null };
        }

        adminUser = newAdminUser;
      }

      setUser(adminUser);
      return { error: null };
    } catch (error) {
      console.error('Mock auth error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error signing out from Supabase:', error);
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    hasRole
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};