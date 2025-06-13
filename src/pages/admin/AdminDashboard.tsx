import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Eye, Cuboid as Cube } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import QuickIJewelTool from '../../components/admin/QuickIJewelTool';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  popularProducts: any[];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    popularProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIJewelTool, setShowIJewelTool] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics with proper error handling
      const [
        usersResult,
        productsResult,
        ordersResult,
        revenueResult,
        recentOrdersResult,
        popularProductsResult
      ] = await Promise.allSettled([
        // Total users count
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true }),
        
        // Total products count
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true }),
        
        // Total orders count
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true }),
        
        // Total revenue
        supabase
          .from('orders')
          .select('total_amount')
          .eq('status', 'completed'),
        
        // Recent orders with customer info
        supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total_amount,
            status,
            created_at,
            customers (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Popular products
        supabase
          .from('products')
          .select(`
            id,
            name,
            product_name,
            price,
            stock_quantity,
            featured
          `)
          .eq('availability', true)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Process results with fallbacks
      const totalUsers = usersResult.status === 'fulfilled' ? (usersResult.value.count || 0) : 0;
      const totalProducts = productsResult.status === 'fulfilled' ? (productsResult.value.count || 0) : 0;
      const totalOrders = ordersResult.status === 'fulfilled' ? (ordersResult.value.count || 0) : 0;
      
      let totalRevenue = 0;
      if (revenueResult.status === 'fulfilled' && revenueResult.value.data) {
        totalRevenue = revenueResult.value.data.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      }

      const recentOrders = recentOrdersResult.status === 'fulfilled' ? (recentOrdersResult.value.data || []) : [];
      const popularProducts = popularProductsResult.status === 'fulfilled' ? (popularProductsResult.value.data || []) : [];

      setStats({
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        recentOrders,
        popularProducts
      });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowIJewelTool(!showIJewelTool)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Cube className="h-4 w-4" />
            {showIJewelTool ? 'Hide' : 'Show'} 3D Tool
          </button>
          <button 
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick iJewel Tool */}
      {showIJewelTool && (
        <div className="mb-8">
          <QuickIJewelTool />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Recent Orders and Popular Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">#{order.order_number}</p>
                    <p className="text-sm text-gray-600">
                      {order.customers?.first_name} {order.customers?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${parseFloat(order.total_amount).toFixed(2)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </Card>

        {/* Popular Products */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Products</h2>
          <div className="space-y-4">
            {stats.popularProducts.length > 0 ? (
              stats.popularProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {product.product_name || product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stock_quantity || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${parseFloat(product.price).toFixed(2)}</p>
                    {product.featured && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No products available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;