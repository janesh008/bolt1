import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import Button from '../../ui/Button';
import { useLocation, useNavigate } from 'react-router-dom';

interface OrderFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  dateFilter,
  setDateFilter
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (params.has('search')) {
      setSearchTerm(params.get('search') || '');
    }
    
    if (params.has('status')) {
      setStatusFilter(params.get('status') || 'all');
    }
    
    if (params.has('paymentStatus')) {
      setPaymentStatusFilter(params.get('paymentStatus') || 'all');
    }
    
    if (params.has('date')) {
      setDateFilter(params.get('date') || 'all');
    }
  }, [location.search]);
  
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
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    updateUrlParams('search', value);
  };
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateUrlParams('status', value);
  };
  
  const handlePaymentStatusChange = (value: string) => {
    setPaymentStatusFilter(value);
    updateUrlParams('paymentStatus', value);
  };
  
  const handleDateChange = (value: string) => {
    setDateFilter(value);
    updateUrlParams('date', value);
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setDateFilter('all');
    navigate({ search: '' });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusFilter} onValueChange={handlePaymentStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
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
          
          {(searchTerm || statusFilter !== 'all' || paymentStatusFilter !== 'all' || dateFilter !== 'all') && (
            <div className="md:col-span-5 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderFilters;