import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock, 
  Eye, 
  Search,
  Download,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import AdminRefundModal from './AdminRefundModal';
import ExportModal from './ExportModal';
import { exportRefundsToExcel } from '../../utils/excelExport';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';

interface Refund {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_id: string | null;
  reason: string | null;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_notes: string | null; 
  processed_by: string | null; 
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  orders?: {
    order_number: string;
  };
  full_name?: string;
  email?: string;
  order_number?: string;
  processed_by_name?: string;
  processed_by_role?: string;
}

const AdminRefundManagement: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Parse URL parameters on component mount
    const params = new URLSearchParams(location.search);
    
    if (params.has('search')) {
      setSearchTerm(params.get('search') || '');
    }
    
    if (params.has('status')) {
      setStatusFilter(params.get('status') || 'all');
    }
    
    if (params.has('date')) {
      setDateFilter(params.get('date') || 'all');
    }
    
    fetchRefunds();
    
    // Set up real-time subscription for new refund requests
    const refundsSubscription = supabase
      .channel('refunds-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'refunds' 
      }, (payload) => {
        // Show notification for new refund request
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex`}>
            <div className="flex-1 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <AlertTriangle className="h-10 w-10 text-amber-500" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">New Refund Request</p>
                  <p className="mt-1 text-sm text-gray-500">
                    A new refund request has been submitted for order #{payload.new.order_number || 'Unknown'}
                  </p>
                  <div className="mt-2">
                    <Button 
                      size="sm"
                      onClick={() => {
                        fetchRefunds();
                        toast.dismiss(t.id);
                      }}
                    >
                      View Refunds
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ), { duration: 5000 });
        
        // Refresh refunds list
        fetchRefunds();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(refundsSubscription);
    };
  }, [debouncedSearchTerm, statusFilter, dateFilter, location.search]);

  // Update URL when filters change
  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(location.search);
    
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    navigate({ search: params.toString() });
  };

  const fetchRefunds = async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('refunds_with_user_info')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`order_number.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`);
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      let filteredData = data || [];
      
      setRefunds(filteredData);
      
      // Count pending refunds
      const pendingRefunds = filteredData.filter(refund => refund.status === 'pending');
      setPendingCount(pendingRefunds.length);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Failed to fetch refunds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRefund = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowRefundModal(true);
  };

  const handleRefundProcessed = () => {
    fetchRefunds();
    setShowRefundModal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Processing</Badge>;
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="error" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  const getProcessingTime = (refund: Refund) => {
    if (refund.status === 'completed' && refund.completed_at) {
      const created = new Date(refund.created_at);
      const completed = new Date(refund.completed_at);
      const diffTime = Math.abs(completed.getTime() - created.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h`;
      } else {
        return `${diffHours}h`;
      }
    }
    return '-';
  };

  const handleExportRefunds = async (options: any) => {
    try {
      setIsLoading(true);
      
      // Fetch all refunds for export
      let query = supabase
        .from('refunds_with_user_info')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply date range filter if provided
      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.startDate.toISOString())
          .lte('created_at', options.dateRange.endDate.toISOString());
      }
      
      // Apply status filters if provided
      if (options.refundStatuses && options.refundStatuses.length > 0) {
        query = query.in('status', options.refundStatuses);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Export to Excel
      await exportRefundsToExcel(data || [], options);
      
      toast.success('Refunds exported successfully');
    } catch (error) {
      console.error('Error exporting refunds:', error);
      toast.error('Failed to export refunds');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    updateUrlParams('search', value);
  };
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateUrlParams('status', value);
  };
  
  const handleDateChange = (value: string) => {
    setDateFilter(value);
    updateUrlParams('date', value);
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    navigate({ search: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-600">Process and track customer refund requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRefunds}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Refunds</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {refunds.filter(r => r.status === 'processing').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {refunds.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {refunds.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search refunds..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={handleDateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <div className="md:col-span-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>
            Manage and process customer refund requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="rounded bg-gray-200 h-16 w-16"></div>
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
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.length > 0 ? (
                  refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell>
                        <div className="font-medium">{refund.order_number}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{refund.full_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{refund.email || 'No email'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">{formatCurrency(refund.amount)}</div>
                      </TableCell>
                      <TableCell>{refund.payment_method}</TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(refund.created_at)}
                      </TableCell>
                      <TableCell>
                        {getProcessingTime(refund)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRefund(refund)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No refunds found. Adjust your filters or try again later.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Refund Details Modal */}
      {selectedRefund && (
        <AdminRefundModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          refund={selectedRefund}
          onRefundProcessed={handleRefundProcessed}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportRefunds}
        type="refunds"
      />
    </div>
  );
};

export default AdminRefundManagement;