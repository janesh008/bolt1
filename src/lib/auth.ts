import { supabase } from './supabase';

export type Role = 'SuperAdmin' | 'Admin' | 'Moderator' | 'User';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'active' | 'blocked' | 'pending';
  created_at: string;
}

// Role hierarchy for permission checking
const roleHierarchy: Record<Role, number> = {
  SuperAdmin: 4,
  Admin: 3,
  Moderator: 2,
  User: 1,
};

export const hasPermission = (userRole: Role, requiredRole: Role): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const getCurrentAdminUser = async (): Promise<AdminUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      status: profile.status,
      created_at: profile.created_at,
    };
  } catch (error) {
    console.error('Error getting current admin user:', error);
    return null;
  }
};

export const signInAdmin = async (email: string, password: string) => {
  try {
    // Verify user has admin privileges
    const adminUser = await getCurrentAdminUser();
    
    if (!adminUser || !hasPermission(adminUser.role, 'Moderator')) {
      await supabase.auth.signOut();
      throw new Error('Insufficient permissions for admin access');
    }

    return { user: adminUser, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signOutAdmin = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Activity logging
export const logActivity = async (action: string, details?: Record<string, any>) => {
  try {
    const adminUser = await getCurrentAdminUser();
    
    if (!adminUser) {
      return;
    }

    await supabase
      .from('activity_logs')
      .insert([{
        user_id: adminUser.id,
        action,
        details: details || {},
        timestamp: new Date().toISOString(),
      }]);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};