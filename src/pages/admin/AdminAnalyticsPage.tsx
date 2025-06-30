import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Download, 
  Filter, 
  RefreshCw,
  Layers,
  Map,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import Button from '../../components/ui/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { supabase } from '../../lib/supabase';
import { DateRangePicker } from '../../components/admin/analytics/DateRangePicker';
import RevenueChart from '../../components/admin/analytics/RevenueChart';
import CategoryPerformance from '../../components/admin/analytics/CategoryPerformance';
import RegionalSales from '../../components/admin/analytics/RegionalSales';
import CustomerEngagement from '../../components/admin/analytics/CustomerEngagement';
import KPICards from '../../components/admin/analytics/KPICards';
import TopProducts from '../../components/admin/analytics/TopProducts';
import { formatCurrency } from '../../lib/utils';
import { exportAnalyticsToCSV, exportAnalyticsToPDF } from '../../utils/exportAnalytics';
import toast from 'react-hot-toast';

// Define types for analytics data
interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  category: string;
  revenue: number;
  orders: number;
  averagePrice: number;
}

interface RegionalData {
  region: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface TopProductData {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
  category: string;
  inStock: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  salesTrend: SalesData[];
  categoryPerformance: CategoryData[];
  regionalSales: RegionalData[];
  topProducts: TopProductData[];
  stockLevels: { low: number; medium: number; high: number; outOfStock: number };
}

const AdminAnalyticsPage: React.FC = () => {
  const { hasRole } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  
  // Get available categories and regions from data
  const categories = useMemo(() => {
    if (!analyticsData?.categoryPerformance) return [];
    return ['all', ...analyticsData.categoryPerformance.map(cat => cat.category)];
  }, [analyticsData?.categoryPerformance]);
  
  const regions = useMemo(() => {
    if (!analyticsData?.regionalSales) return [];
    return ['all', ...analyticsData.regionalSales.map(reg => reg.region)];
  }, [analyticsData?.regionalSales]);
  
  // Effect to fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
    
    // Set up real-time subscription for new orders
    const ordersSubscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders' 
      }, () => {
        // Refresh data when new order comes in
        fetchAnalyticsData();
        toast.success('New order received! Analytics updated.');
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [dateRange, selectedCategory, selectedRegion]);
  
  // Function to fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      // Prepare query parameters
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        category: selectedCategory,
        region: selectedRegion
      });
      
      // Fetch analytics summary
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/getAnalyticsSummary?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }
      
      const data = await response.json();
      
      // For development/demo purposes, if the edge function isn't set up yet, use mock data
      if (!data || Object.keys(data).length === 0) {
        setAnalyticsData(generateMockData());
      } else {
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      // Use mock data for development/demo
      setAnalyticsData(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to handle export to CSV
  const handleExportCSV = async () => {
    if (!analyticsData) return;
    
    try {
      await exportAnalyticsToCSV(analyticsData, {
        dateRange,
        category: selectedCategory,
        region: selectedRegion
      });
      toast.success('Analytics exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export analytics to CSV');
    }
  };
  
  // Function to handle export to PDF
  const handleExportPDF = async () => {
    if (!analyticsData) return;
    
    try {
      await exportAnalyticsToPDF(analyticsData, {
        dateRange,
        category: selectedCategory,
        region: selectedRegion
      });
      toast.success('Analytics exported to PDF successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export analytics to PDF');
    }
  };
  
  // Function to update URL with filter parameters
  const updateUrlParams = () => {
    const params = new URLSearchParams(searchParams);
    
    params.set('from', dateRange.from.toISOString());
    params.set('to', dateRange.to.toISOString());
    
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    
    if (selectedRegion !== 'all') {
      params.set('region', selectedRegion);
    } else {
      params.delete('region');
    }
    
    params.set('tab', selectedTab);
    
    setSearchParams(params);
  };
  
  // Effect to update URL when filters change
  useEffect(() => {
    updateUrlParams();
  }, [dateRange, selectedCategory, selectedRegion, selectedTab]);
  
  // Effect to read filters from URL on initial load
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const categoryParam = searchParams.get('category');
    const regionParam = searchParams.get('region');
    const tabParam = searchParams.get('tab');
    
    if (fromParam && toParam) {
      setDateRange({
        from: new Date(fromParam),
        to: new Date(toParam)
      });
    }
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    if (regionParam) {
      setSelectedRegion(regionParam);
    }
    
    if (tabParam) {
      setSelectedTab(tabParam);
    }
  }, []);
  
  // Check if user has permission to view analytics
  if (!hasRole('Moderator')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your jewelry business performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-2" />
                Date Range
              </label>
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onUpdate={setDateRange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="h-4 w-4 inline mr-2" />
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(cat => cat !== 'all').map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Map className="h-4 w-4 inline mr-2" />
                Region
              </label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.filter(reg => reg !== 'all').map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {(selectedCategory !== 'all' || selectedRegion !== 'all' || 
            dateRange.from.getTime() !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).setHours(0,0,0,0) ||
            dateRange.to.getTime() !== new Date().setHours(23,59,59,999)) && (
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setDateRange({
                    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    to: new Date()
                  });
                  setSelectedCategory('all');
                  setSelectedRegion('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Error State */}
      {error && !isLoading && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Analytics</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <Button 
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white" 
                  onClick={fetchAnalyticsData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Analytics Content */}
      {!isLoading && !error && analyticsData && (
        <>
          {/* KPI Cards */}
          <KPICards data={analyticsData.summary} />
          
          {/* Tabs for Different Analytics Views */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-6">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Sales</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Customers</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Inventory</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-blue-600" />
                      Revenue Trend
                    </CardTitle>
                    <CardDescription>
                      Daily revenue for the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <RevenueChart data={analyticsData.salesTrend} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-600" />
                      Regional Distribution
                    </CardTitle>
                    <CardDescription>
                      Sales distribution by region
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <RegionalSales data={analyticsData.regionalSales} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-green-600" />
                    Category Performance
                  </CardTitle>
                  <CardDescription>
                    Revenue and orders by product category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <CategoryPerformance data={analyticsData.categoryPerformance} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    Top Selling Products
                  </CardTitle>
                  <CardDescription>
                    Best performing products by revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TopProducts products={analyticsData.topProducts} />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-600" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>
                    Daily and monthly revenue trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <RevenueChart data={analyticsData.salesTrend} showOrders={true} />
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-green-600" />
                      Category Performance
                    </CardTitle>
                    <CardDescription>
                      Revenue by product category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <CategoryPerformance data={analyticsData.categoryPerformance} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-600" />
                      Regional Sales
                    </CardTitle>
                    <CardDescription>
                      Sales distribution by region
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <RegionalSales data={analyticsData.regionalSales} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    Sales Summary
                  </CardTitle>
                  <CardDescription>
                    Key sales metrics for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-blue-800 mb-2">Total Revenue</h3>
                      <p className="text-3xl font-bold text-blue-900">{formatCurrency(analyticsData.summary.totalRevenue)}</p>
                      <p className="text-sm text-blue-700 mt-2">
                        {analyticsData.summary.totalOrders} orders
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-green-800 mb-2">Average Order Value</h3>
                      <p className="text-3xl font-bold text-green-900">{formatCurrency(analyticsData.summary.averageOrderValue)}</p>
                      <p className="text-sm text-green-700 mt-2">
                        Per transaction
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-purple-800 mb-2">Conversion Rate</h3>
                      <p className="text-3xl font-bold text-purple-900">{analyticsData.summary.conversionRate.toFixed(2)}%</p>
                      <p className="text-sm text-purple-700 mt-2">
                        Of site visitors
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Customers</p>
                        <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.totalCustomers}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">New Customers</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {Math.round(analyticsData.summary.totalCustomers * 0.15)}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Repeat Purchase Rate</p>
                        <p className="text-3xl font-bold text-gray-900">32%</p>
                      </div>
                      <RefreshCw className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Customer Engagement
                  </CardTitle>
                  <CardDescription>
                    Heatmap of customer activity by day and hour
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <CustomerEngagement />
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-600" />
                      Customer Segments
                    </CardTitle>
                    <CardDescription>
                      Distribution of customers by segment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <RegionalSales 
                        data={[
                          { region: 'New', revenue: 12500, orders: 25, customers: 25 },
                          { region: 'Returning', revenue: 28000, orders: 42, customers: 30 },
                          { region: 'Loyal', revenue: 45000, orders: 65, customers: 20 },
                          { region: 'VIP', revenue: 35000, orders: 28, customers: 10 }
                        ]}
                        valueKey="customers"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-green-600" />
                      Customer Acquisition
                    </CardTitle>
                    <CardDescription>
                      New customers over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <RevenueChart 
                        data={analyticsData.salesTrend.map(item => ({
                          ...item,
                          revenue: Math.round(item.revenue * 0.15 / item.orders) // Mock new customers
                        }))}
                        dataKey="revenue"
                        valueFormatter={(value) => `${value} customers`}
                        showOrders={false}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Healthy Stock</p>
                        <p className="text-3xl font-bold text-green-900">{analyticsData.stockLevels.high}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-green-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Medium Stock</p>
                        <p className="text-3xl font-bold text-yellow-900">{analyticsData.stockLevels.medium}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-yellow-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-800">Low Stock</p>
                        <p className="text-3xl font-bold text-red-900">{analyticsData.stockLevels.low}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-red-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Out of Stock</p>
                        <p className="text-3xl font-bold text-gray-900">{analyticsData.stockLevels.outOfStock}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-gray-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                    Inventory Status
                  </CardTitle>
                  <CardDescription>
                    Stock levels by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <CategoryPerformance 
                      data={analyticsData.categoryPerformance.map(cat => ({
                        ...cat,
                        revenue: Math.floor(Math.random() * 50) + 10 // Mock stock levels
                      }))}
                      dataKey="revenue"
                      valueFormatter={(value) => `${value} units`}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    Top Products by Stock Level
                  </CardTitle>
                  <CardDescription>
                    Products with critical inventory levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TopProducts 
                    products={analyticsData.topProducts.sort((a, b) => a.inStock - b.inStock)}
                    showStock={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

// Function to generate mock data for development/demo
function generateMockData(): AnalyticsData {
  // Generate dates for the last 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });
  
  // Generate sales trend data
  const salesTrend = dates.map(date => {
    const revenue = Math.floor(Math.random() * 10000) + 1000;
    const orders = Math.floor(Math.random() * 10) + 1;
    return { date, revenue, orders };
  });
  
  // Generate category performance data
  const categories = ['Ring', 'Necklace', 'Earring', 'Bracelet', 'Pendant'];
  const categoryPerformance = categories.map(category => {
    const revenue = Math.floor(Math.random() * 50000) + 10000;
    const orders = Math.floor(Math.random() * 50) + 10;
    return {
      category,
      revenue,
      orders,
      averagePrice: Math.round(revenue / orders)
    };
  });
  
  // Generate regional sales data
  const regions = ['North India', 'South India', 'East India', 'West India', 'International'];
  const regionalSales = regions.map(region => {
    const revenue = Math.floor(Math.random() * 40000) + 5000;
    const orders = Math.floor(Math.random() * 40) + 5;
    return {
      region,
      revenue,
      orders,
      customers: Math.floor(orders * 0.8)
    };
  });
  
  // Generate top products data
  const productNames = [
    'Diamond Solitaire Ring',
    'Pearl Necklace',
    'Gold Hoop Earrings',
    'Platinum Bracelet',
    'Ruby Pendant',
    'Sapphire Earrings',
    'Emerald Ring',
    'Gold Chain',
    'Silver Anklet',
    'Diamond Tennis Bracelet'
  ];
  
  const topProducts = productNames.map((name, index) => {
    const revenue = Math.floor(Math.random() * 20000) + 5000;
    const quantity = Math.floor(Math.random() * 20) + 5;
    return {
      id: `PROD-${1000 + index}`,
      name,
      revenue,
      quantity,
      category: categories[Math.floor(Math.random() * categories.length)],
      inStock: Math.floor(Math.random() * 50)
    };
  }).sort((a, b) => b.revenue - a.revenue);
  
  // Generate summary data
  const totalRevenue = salesTrend.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = salesTrend.reduce((sum, day) => sum + day.orders, 0);
  
  return {
    summary: {
      totalRevenue,
      totalOrders,
      totalCustomers: Math.floor(totalOrders * 0.8),
      averageOrderValue: Math.round(totalRevenue / totalOrders),
      conversionRate: Math.random() * 5 + 2 // 2-7%
    },
    salesTrend,
    categoryPerformance,
    regionalSales,
    topProducts,
    stockLevels: {
      low: Math.floor(Math.random() * 10) + 5,
      medium: Math.floor(Math.random() * 15) + 10,
      high: Math.floor(Math.random() * 20) + 15,
      outOfStock: Math.floor(Math.random() * 5)
    }
  };
}

export default AdminAnalyticsPage;