import React, { useState, useEffect } from 'react';
import { 
  User, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Shield,
  Key
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Checkbox } from '../../ui/checkbox';
import Button from '../../ui/Button';
import { supabase } from '../../../lib/supabase';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import toast from 'react-hot-toast';
import { exportUsersToExcel } from '../../../utils/excelExport';

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: 'active' | 'blocked' | 'pending';
  created_at: string;
  last_login: string | null;
}

const UserManagementSystem: React.FC = () => {
  const { hasRole } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showRolePermissionsModal, setShowRolePermissionsModal] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'User',
    status: 'active' as const
  });
  
  const [editUser, setEditUser] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    status: '' as 'active' | 'blocked' | 'pending'
  });
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
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
      toast.error('Failed to fetch users');
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
      toast.error('Failed to fetch roles');
    }
  };
  
  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true });
      
      if (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to fetch permissions');
        return;
      }
      
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to fetch permissions');
    }
  };
  
  const handleCreateUser = async () => {
    try {
      // Validate required fields
      if (!newUser.full_name || !newUser.email || !newUser.password) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            phone: newUser.phone
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      // Create user in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          full_name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          status: newUser.status
        });
      
      if (userError) throw userError;
      
      toast.success('User created successfully');
      setShowCreateUserModal(false);
      setNewUser({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'User',
        status: 'active'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };
  
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Update user in users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: editUser.full_name,
          phone: editUser.phone,
          role: editUser.role,
          status: editUser.status
        })
        .eq('id', selectedUser.id);
      
      if (userError) throw userError;
      
      toast.success('User updated successfully');
      setShowEditUserModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(
        selectedUser.id
      );
      
      if (authError) throw authError;
      
      // Delete user from users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);
      
      if (userError) throw userError;
      
      toast.success('User deleted successfully');
      setShowDeleteUserModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  
  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      const { error } = await supabase
        .from('roles')
        .update({
         permissions: Array.isArray(selectedPermissions) ? selectedPermissions : []
        })
        .eq('id', selectedRole.id);
      
      if (error) throw error;
      
      toast.success('Role permissions updated successfully');
      setShowRolePermissionsModal(false);
      fetchRoles();
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast.error('Failed to update role permissions');
    }
  };
  
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status
    });
    setShowEditUserModal(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
  };
  
  const handleRolePermissionsClick = (role: Role) => {
    setSelectedRole(role);
   setSelectedPermissions(Array.isArray(role.permissions) ? role.permissions : []);
    setShowRolePermissionsModal(true);
  };
  
  const handleExportUsers = async () => {
    try {
      // Apply filters
      let filteredUsers = [...users];
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.full_name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }
      
      if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
      }
      
      if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
      }
      
      await exportUsersToExcel(filteredUsers);
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
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
        return <Badge className="bg-purple-100 text-purple-800 border border-purple-200">Super Admin</Badge>;
      case 'Admin':
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Admin</Badge>;
      case 'Moderator':
        return <Badge className="bg-green-100 text-green-800 border border-green-200">Moderator</Badge>;
      case 'User':
        return <Badge variant="secondary">User</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });
  
  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {hasRole('Admin') && (
            <Button onClick={() => setShowCreateUserModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SuperAdmin">Super Admin</SelectItem>
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
                        {formatDate(user.last_login)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {hasRole('Moderator') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasRole('Admin') && user.role !== 'SuperAdmin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
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

      {/* Roles & Permissions */}
      {hasRole('Admin') && (
        <Card>
          <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>
              Manage role-based access control for your system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {roles.map((role) => (
                <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRolePermissionsClick(role)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Manage Permissions
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(role.permissions) ? role.permissions.map((permissionId) => {
                      const permission = permissions.find(p => p.id === permissionId);
                      return permission ? (
                        <Badge key={permission.id} variant="outline" className="text-xs">
                          {permission.module}.{permission.action}
                        </Badge>
                      ) : null;
                    }) : null}
                    {(!role.permissions || !Array.isArray(role.permissions) || role.permissions.length === 0) && (
                      <span className="text-sm text-gray-500">No permissions assigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create User Modal */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive an email to set their password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <Input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone (Optional)</label>
                <Input
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {hasRole('SuperAdmin') && (
                      <SelectItem value="Admin">Admin</SelectItem>
                    )}
                    <SelectItem value="Moderator">Moderator</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select
                  value={newUser.status}
                  onValueChange={(value: 'active' | 'blocked' | 'pending') => 
                    setNewUser({ ...newUser, status: value })
                  }
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
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateUserModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <Input
                  value={editUser.full_name}
                  onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={editUser.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input
                  value={editUser.phone}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Select
                  value={editUser.role}
                  onValueChange={(value) => setEditUser({ ...editUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {hasRole('SuperAdmin') && (
                      <>
                        <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </>
                    )}
                    <SelectItem value="Moderator">Moderator</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                value={editUser.status}
                onValueChange={(value: 'active' | 'blocked' | 'pending') => 
                  setEditUser({ ...editUser, status: value })
                }
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
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowEditUserModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={showDeleteUserModal} onOpenChange={setShowDeleteUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {selectedUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedUser.full_name}</div>
                  <div className="text-sm text-gray-500">{selectedUser.email}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteUserModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Permissions Modal */}
      <Dialog open={showRolePermissionsModal} onOpenChange={setShowRolePermissionsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions for {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Select the permissions that users with this role should have.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                <div key={module} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 capitalize">{module}</h3>
                  <div className="space-y-2">
                    {modulePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.id}
                         checked={Array.isArray(selectedPermissions) && selectedPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                             setSelectedPermissions(Array.isArray(selectedPermissions) ? [...selectedPermissions, permission.id] : [permission.id]);
                            } else {
                             setSelectedPermissions(Array.isArray(selectedPermissions) ? selectedPermissions.filter(id => id !== permission.id) : []);
                            }
                          }}
                        />
                        <label htmlFor={permission.id} className="text-sm">
                          <span className="font-medium capitalize">{permission.action}</span>
                          {permission.description && (
                            <span className="text-gray-500 ml-1">- {permission.description}</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowRolePermissionsModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRolePermissions}>
              <Shield className="h-4 w-4 mr-2" />
              Update Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementSystem;