import React, { useState, useEffect } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

// Import components
import OrderFilters from '../../components/admin/orders/OrderFilters';
import OrderTable from '../../components/admin/orders/OrderTable';
import OrderPagination from '../../components/admin/orders/OrderPagination';
import OrderDetailsModal from '../../components/admin/orders/OrderDetailsModal';
import ExportModal from '../../components/admin/ExportModal';
import { 
  Order, 
  getStatusBadge, 
  getPaymentStatusBadge, 
  formatDate, 
  getOrderProgress, 
  getPaymentMethodDisplay 
} from '../../components/admin/orders/OrderUtils';
import { exportOrdersToExcel } from '../../utils/excelExport';

const AdminOrdersPage = () => {
  const { hasRole } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const ordersPerPage = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, debouncedSearchTerm, statusFilter, paymentStatusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          order_items (
            id,
            quantity
          ),
          users (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (debouncedSearchTerm) {
        query = query.or(`order_number.ilike.%${debouncedSearchTerm}%,customers.email.ilike.%${debouncedSearchTerm}%,users.email.ilike.%${debouncedSearchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (paymentStatusFilter !== 'all') {
        query = query.eq('payment_status', paymentStatusFilter);
      }
      
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
      
      // Apply pagination
      const from = (currentPage - 1) * ordersPerPage;
      const to = from + ordersPerPage - 1;
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;
      
      setOrders(data || []);
      setTotalPages(Math.ceil((count || 0) / ordersPerPage));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = async (order: Order) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_order_details/${order.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order details');
      }

      const data = await response.json();
      setSelectedOrder(data.order);
      setShowOrderDetails(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    // Update local state
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
        : order
    ));

    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      // Refresh order details to get updated timeline
      handleViewOrder({ ...selectedOrder, status: newStatus as any });
    }
  };

  const handleExportOrders = async (options: any) => {
    try {
      setIsLoading(true);
      
      // Fetch all orders for export
      let query = supabase
        .from('orders')
        .select(`
          *,
          users (
            id,
            full_name,
            email,
            phone
          ),
          order_items (
            *,
            products (
              *,
              product_images (*)
            )
          ),
          shipping_addresses(*)
        `)
        .order('created_at', { ascending: false });
      
      // Apply date range filter if provided
      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.startDate.toISOString())
          .lte('created_at', options.dateRange.endDate.toISOString());
      }
      
      // Apply status filters if provided
      if (options.statuses && options.statuses.length > 0) {
        query = query.in('status', options.statuses);
      }
      
      // Apply payment status filters if provided
      if (options.paymentStatuses && options.paymentStatuses.length > 0) {
        query = query.in('payment_status', options.paymentStatuses);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Export to Excel
      await exportOrdersToExcel(data || [], options);
      
      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage customer orders and track fulfillment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentStatusFilter={paymentStatusFilter}
        setPaymentStatusFilter={setPaymentStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
          <CardDescription>
            Manage and track all customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderTable
            orders={orders}
            isLoading={isLoading}
            getStatusBadge={getStatusBadge}
            getPaymentStatusBadge={getPaymentStatusBadge}
            formatDate={formatDate}
            getOrderProgress={getOrderProgress}
            getPaymentMethodDisplay={getPaymentMethodDisplay}
            handleViewOrder={handleViewOrder}
            handleStatusUpdate={handleStatusUpdate}
            hasRole={hasRole}
          />

          {/* Pagination */}
          {!isLoading && orders.length > 0 && (
            <OrderPagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              ordersPerPage={ordersPerPage}
              totalOrders={orders.length}
            />
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <OrderDetailsModal
        showOrderDetails={showOrderDetails}
        setShowOrderDetails={setShowOrderDetails}
        selectedOrder={selectedOrder}
        getStatusBadge={getStatusBadge}
        getPaymentStatusBadge={getPaymentStatusBadge}
        formatDate={formatDate}
        handleStatusUpdate={handleStatusUpdate}
        hasRole={hasRole}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportOrders}
        type="orders"
      />
    </div>
  );
};

export default AdminOrdersPage;