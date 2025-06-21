import React from 'react';
import { Clock, Package, Truck, CheckCircle, X } from 'lucide-react';
import { Badge } from '../../ui/badge';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'confirmed';
  total_amount: number;
  shipping_address: any;
  billing_address: any;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  stripe_payment_intent_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customers?: any;
  order_items?: Array<any>;
  shipping_addresses?: Array<any>;
  order_timeline?: Array<any>;
}

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { variant: 'warning' as const, icon: Clock },
    processing: { variant: 'secondary' as const, icon: Package },
    shipped: { variant: 'default' as const, icon: Truck },
    delivered: { variant: 'success' as const, icon: CheckCircle },
    cancelled: { variant: 'error' as const, icon: X },
    confirmed: { variant: 'secondary' as const, icon: Package }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const getPaymentStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { variant: 'warning' as const },
    completed: { variant: 'success' as const },
    failed: { variant: 'error' as const },
    refunded: { variant: 'secondary' as const }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Badge variant={config.variant}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getOrderProgress = (status: string) => {
  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIndex = steps.indexOf(status);
  return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
};

export const getPaymentMethodDisplay = (order: Order) => {
  if (order.razorpay_payment_id) {
    return 'Razorpay';
  }
  return order.payment_method || 'Unknown';
};

export const getPaymentId = (order: Order) => {
  return order.razorpay_payment_id || order.stripe_payment_intent_id || 'N/A';
};