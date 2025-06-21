import React from 'react';
import { Package, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import Button from '../../ui/Button';
import OrderStatusUpdater from './OrderStatusUpdater';
import { formatCurrency } from '../../../lib/utils';
import { Order } from './OrderUtils';

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  getPaymentStatusBadge: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  getOrderProgress: (status: string) => number;
  getPaymentMethodDisplay: (order: Order) => string;
  handleViewOrder: (order: Order) => void;
  handleStatusUpdate: (orderId: string, newStatus: string) => void;
  hasRole: (role: string) => boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  getStatusBadge,
  getPaymentStatusBadge,
  formatDate,
  getOrderProgress,
  getPaymentMethodDisplay,
  handleViewOrder,
  handleStatusUpdate,
  hasRole
}) => {
  if (isLoading) {
    return (
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
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length > 0 ? (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="font-medium">{order.order_number}</div>
                <div className="text-sm text-gray-500">#{order.id.slice(0, 8)}</div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">
                    {order.customers?.first_name} {order.customers?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{order.customers?.email}</div>
                  <div className="text-sm text-gray-500">{order.customers?.phone}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span>{order.order_items?.length || 0} items</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                <div className="text-sm text-gray-500">{getPaymentMethodDisplay(order)}</div>
              </TableCell>
              <TableCell>
                {getPaymentStatusBadge(order.payment_status)}
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  {getStatusBadge(order.status)}
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${getOrderProgress(order.status)}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {hasRole('Moderator') && (
                    <OrderStatusUpdater
                      orderId={order.id}
                      currentStatus={order.status}
                      onStatusUpdated={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
              No orders found. Adjust your filters or try again later.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default OrderTable;