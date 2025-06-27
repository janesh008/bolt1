import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserPlus, 
  Shield, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  RefreshCw,
  Lock,
  Key,
  UserCog,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import Button from '../../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Checkbox } from '../../ui/checkbox';
import { supabase } from '../../../lib/supabase';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import toast from 'react-hot-toast';
import { exportUsersToExcel } from '../../../utils/excelExport';

// Define user types
interface User {
  id: string;
  auth_user_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'SuperAdmin' | 'Admin' | 'Moderator' | 'User';
  status: 'active' | 'blocked' | 'pending';
  last_login?: string;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

const UserManagementSystem: React.FC = () => {
  const { user: currentUser, hasRole } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [showExportModal, setShowExportModal] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'User',
    status: 'active',
    password: '',
    confirmPassword: ''
  });
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
    fetchActivityLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          admin_users (
            name,
            email
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (newUser.password !== newUser.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      // Check if user is SuperAdmin (only SuperAdmin can create Admin users)
      if (newUser.role === 'Admin' && !hasRole('SuperAdmin')) {
        toast.error('Only SuperAdmin can create Admin users');
        return;
      }

      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name
          }
        }
      });

      if (authError) throw authError;

      // Then create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user?.id,
          full_name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          status: newUser.status
        }]);

      if (userError) throw userError;

      // Log activity
      await logActivity('Created user', { 
        email: newUser.email, 
        role: newUser.role 
      });

      toast.success('User created successfully');
      setShowUserModal(false);
      fetchUsers();
      
      // Reset form
      setNewUser({
        email: '',
        full_name: '',
        phone: '',
        role: 'User',
        status: 'active',
        password: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Check if user is SuperAdmin (only SuperAdmin can modify Admin users)
      if (selectedUser.role === 'Admin' && !hasRole('SuperAdmin')) {
        toast.error('Only SuperAdmin can modify Admin users');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: selectedUser.full_name,
          phone: selectedUser.phone,
          role: selectedUser.role,
          status: selectedUser.status
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Log activity
      await logActivity('Updated user', { 
        email: selectedUser.email, 
        role: selectedUser.role 
      });

      toast.success('User updated successfully');
      setShowUserModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      
      if (!userToDelete) {
        toast.error('User not found');
        return;
      }

      // Check if user is SuperAdmin (only SuperAdmin can delete Admin users)
      if (userToDelete.role === 'Admin' && !hasRole('SuperAdmin')) {
        toast.error('Only SuperAdmin can delete Admin users');
        return;
      }

      // Confirm before deleting
      if (!confirm(`Are you sure you want to delete ${userToDelete.full_name}?`)) {
        return;
      }

      // Delete user from auth
      if (userToDelete.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          userToDelete.auth_user_id
        );
        if (authError) throw authError;
      }

      // Delete user profile
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Log activity
      await logActivity('Deleted user', { 
        email: userToDelete.email
      });

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleCreateRole = async () => {
    try {
      // Only SuperAdmin can create roles
      if (!hasRole('SuperAdmin')) {
        toast.error('Only SuperAdmin can create roles');
        return;
      }

      const { error } = await supabase
        .from('roles')
        .insert([{
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions
        }]);

      if (error) throw error;

      // Log activity
      await logActivity('Created role', { 
        name: newRole.name, 
        permissions: newRole.permissions 
      });

      toast.success('Role created successfully');
      setShowRoleModal(false);
      fetchRoles();
      
      // Reset form
      setNewRole({
        name: '',
        description: '',
        permissions: []
      });
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      // Only SuperAdmin can update roles
      if (!hasRole('SuperAdmin')) {
        toast.error('Only SuperAdmin can update roles');
        return;
      }

      const { error } = await supabase
        .from('roles')
        .update({
          name: selectedRole.name,
          description: selectedRole.description,
          permissions: selectedRole.permissions
        })
        .eq('id', selectedRole.id);

      if (error) throw error;

      // Log activity
      await logActivity('Updated role', { 
        name: selectedRole.name, 
        permissions: selectedRole.permissions 
      });

      toast.success('Role updated successfully');
      setShowRoleModal(false);
      fetchRoles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const roleToDelete = roles.find(r => r.id === roleId);
      
      if (!roleToDelete) {
        toast.error('Role not found');
        return;
      }

      // Only SuperAdmin can delete roles
      if (!hasRole('SuperAdmin')) {
        toast.error('Only SuperAdmin can delete roles');
        return;
      }

      // Confirm before deleting
      if (!confirm(`Are you sure you want to delete the role "${roleToDelete.name}"?`)) {
        return;
      }

      // Check if role is in use
      const { data: usersWithRole, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('role', roleToDelete.name);

      if (checkError) throw checkError;

      if (usersWithRole && usersWithRole.length > 0) {
        toast.error(`Cannot delete role "${roleToDelete.name}" because it is assigned to ${usersWithRole.length} users`);
        return;
      }

      // Delete role
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      // Log activity
      await logActivity('Deleted role', { 
        name: roleToDelete.name
      });

      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(error.message || 'Failed to delete role');
    }
  };

  const logActivity = async (action: string, details: any = {}) => {
    try {
      if (!currentUser) return;

      await supabase
        .from('activity_logs')
        .insert([{
          user_id: currentUser.id,
          action,
          details,
          timestamp: new Date().toISOString()
        }]);

      // Refresh activity logs
      fetchActivityLogs();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleExportUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get all users for export
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Export to Excel
      await exportUsersToExcel(data || []);
      
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Active</Badge>;
      case 'blocked':
        return <Badge variant="error" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Blocked</Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SuperAdmin':
        return <Badge className="bg-purple-100 text-purple-800 border border-purple-200">SuperAdmin</Badge>;
      case 'Admin':
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Admin</Badge>;
      case 'Moderator':
        return <Badge className="bg-green-100 text-green-800 border border-green-200">Moderator</Badge>;
      case 'User':
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-200">User</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter(user => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    // Apply role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {hasRole('SuperAdmin') && (
                <Button onClick={() => {
                  setSelectedUser(null);
                  setShowUserModal(true);
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Moderator">Moderator</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                A list of all users in your system including their name, email, status, and role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.full_name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {user.last_login ? formatDate(user.last_login) : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {hasRole('SuperAdmin') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No users found. Adjust your filters or try again later.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* User Modal */}
          <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedUser ? 'Edit User' : 'Create New User'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    value={selectedUser ? selectedUser.full_name : newUser.full_name}
                    onChange={(e) => {
                      if (selectedUser) {
                        setSelectedUser({...selectedUser, full_name: e.target.value});
                      } else {
                        setNewUser({...newUser, full_name: e.target.value});
                      }
                    }}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={selectedUser ? selectedUser.email : newUser.email}
                    onChange={(e) => {
                      if (selectedUser) {
                        setSelectedUser({...selectedUser, email: e.target.value});
                      } else {
                        setNewUser({...newUser, email: e.target.value});
                      }
                    }}
                    placeholder="Enter email address"
                    disabled={!!selectedUser} // Can't change email for existing users
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={selectedUser ? selectedUser.phone || '' : newUser.phone}
                    onChange={(e) => {
                      if (selectedUser) {
                        setSelectedUser({...selectedUser, phone: e.target.value});
                      } else {
                        setNewUser({...newUser, phone: e.target.value});
                      }
                    }}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <Select
                    value={selectedUser ? selectedUser.role : newUser.role}
                    onValueChange={(value) => {
                      if (selectedUser) {
                        setSelectedUser({...selectedUser, role: value as any});
                      } else {
                        setNewUser({...newUser, role: value as any});
                      }
                    }}
                    disabled={!hasRole('SuperAdmin')} // Only SuperAdmin can change roles
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {hasRole('SuperAdmin') && (
                        <>
                          <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </>
                      )}
                      <SelectItem value="Moderator">Moderator</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    value={selectedUser ? selectedUser.status : newUser.status}
                    onValueChange={(value) => {
                      if (selectedUser) {
                        setSelectedUser({...selectedUser, status: value as any});
                      } else {
                        setNewUser({...newUser, status: value as any});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Password fields - only for new users */}
                {!selectedUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={newUser.confirmPassword}
                        onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                        placeholder="Confirm password"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowUserModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={selectedUser ? handleUpdateUser : handleCreateUser}
                  >
                    {selectedUser ? 'Update User' : 'Create User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
              <p className="text-gray-600">Manage user roles and their associated permissions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                fetchRoles();
                fetchPermissions();
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {hasRole('SuperAdmin') && (
                <Button onClick={() => {
                  setSelectedRole(null);
                  setShowRoleModal(true);
                }}>
                  <Shield className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              )}
            </div>
          </div>

          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                Define roles with specific permissions for different user types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="font-medium">{role.name}</div>
                      </TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.length > 0 ? (
                            <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                              {role.permissions.length} permissions
                            </Badge>
                          ) : (
                            <span className="text-gray-500">No permissions</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gray-100 text-gray-800">
                          {users.filter(u => u.role === role.name).length} users
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role);
                              setShowRoleModal(true);
                            }}
                            disabled={!hasRole('SuperAdmin')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={!hasRole('SuperAdmin')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Permissions</CardTitle>
              <CardDescription>
                System permissions that can be assigned to roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {permissions.map((permission) => (
                  <div key={permission.id} className="border rounded-lg p-4">
                    <div className="font-medium">{permission.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{permission.description}</div>
                    <Badge className="mt-2 bg-gray-100 text-gray-800">{permission.module}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Modal */}
          <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedRole ? 'Edit Role' : 'Create New Role'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <Input
                    value={selectedRole ? selectedRole.name : newRole.name}
                    onChange={(e) => {
                      if (selectedRole) {
                        setSelectedRole({...selectedRole, name: e.target.value});
                      } else {
                        setNewRole({...newRole, name: e.target.value});
                      }
                    }}
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    value={selectedRole ? selectedRole.description || '' : newRole.description}
                    onChange={(e) => {
                      if (selectedRole) {
                        setSelectedRole({...selectedRole, description: e.target.value});
                      } else {
                        setNewRole({...newRole, description: e.target.value});
                      }
                    }}
                    placeholder="Enter role description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={selectedRole 
                            ? selectedRole.permissions.includes(permission.id)
                            : newRole.permissions.includes(permission.id)
                          }
                          onCheckedChange={(checked) => {
                            if (selectedRole) {
                              const updatedPermissions = checked
                                ? [...selectedRole.permissions, permission.id]
                                : selectedRole.permissions.filter(id => id !== permission.id);
                              setSelectedRole({...selectedRole, permissions: updatedPermissions});
                            } else {
                              const updatedPermissions = checked
                                ? [...newRole.permissions, permission.id]
                                : newRole.permissions.filter(id => id !== permission.id);
                              setNewRole({...newRole, permissions: updatedPermissions});
                            }
                          }}
                        />
                        <label
                          htmlFor={`permission-${permission.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowRoleModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={selectedRole ? handleUpdateRole : handleCreateRole}
                  >
                    {selectedRole ? 'Update Role' : 'Create Role'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-gray-600">Track user actions and system events</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchActivityLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Activity Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent actions performed by users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium">{log.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{log.user?.email || 'No email'}</div>
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            alert(JSON.stringify(log.details, null, 2));
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600">Configure user management settings</p>
            </div>
          </div>

          {/* Settings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-blue-600" />
                  Authentication Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Password Requirements</div>
                      <div className="text-sm text-gray-500">Minimum password strength and complexity</div>
                    </div>
                    <Select defaultValue="medium">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-500">Require 2FA for admin accounts</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="2fa" />
                      <label
                        htmlFor="2fa"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enabled
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Session Timeout</div>
                      <div className="text-sm text-gray-500">Inactive session expiration time</div>
                    </div>
                    <Select defaultValue="60">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCog className="h-5 w-5 mr-2 text-purple-600" />
                  User Management Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Self-Registration</div>
                      <div className="text-sm text-gray-500">Allow users to create their own accounts</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="self-reg" defaultChecked />
                      <label
                        htmlFor="self-reg"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enabled
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Verification</div>
                      <div className="text-sm text-gray-500">Require email verification for new accounts</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="email-verify" defaultChecked />
                      <label
                        htmlFor="email-verify"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Required
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Default User Role</div>
                      <div className="text-sm text-gray-500">Role assigned to new registrations</div>
                    </div>
                    <Select defaultValue="User">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="User">User</SelectItem>
                        <SelectItem value="Moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2 text-amber-600" />
                  API Access Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">API Access</div>
                      <div className="text-sm text-gray-500">Enable API access for third-party integrations</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="api-access" defaultChecked />
                      <label
                        htmlFor="api-access"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enabled
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">API Rate Limiting</div>
                      <div className="text-sm text-gray-500">Maximum requests per minute</div>
                    </div>
                    <Select defaultValue="100">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 req/min</SelectItem>
                        <SelectItem value="100">100 req/min</SelectItem>
                        <SelectItem value="200">200 req/min</SelectItem>
                        <SelectItem value="500">500 req/min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-4">
                    <Button variant="outline">
                      Generate New API Key
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagementSystem;