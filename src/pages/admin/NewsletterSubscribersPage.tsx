import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  RefreshCw, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import toast from 'react-hot-toast';

interface Subscriber {
  id: string;
  email: string;
  subscription_date: string;
  status: 'active' | 'inactive';
  source: string;
  opt_in_confirmed: boolean;
  opt_in_date: string | null;
  last_updated: string;
  gdpr_consent: boolean;
}

const NewsletterSubscribersPage = () => {
  const { hasRole } = useAdminAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const subscribersPerPage = 10;

  useEffect(() => {
    fetchSubscribers();
  }, [currentPage, searchTerm, statusFilter, sourceFilter]);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' })
        .order('subscription_date', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.ilike('email', `%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * subscribersPerPage;
      const to = from + subscribersPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setSubscribers(data || []);
      setTotalPages(Math.ceil((count || 0) / subscribersPerPage));
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to fetch subscribers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (subscriberId: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: newStatus, last_updated: new Date().toISOString() })
        .eq('id', subscriberId);

      if (error) throw error;

      setSubscribers(subscribers.map(subscriber => 
        subscriber.id === subscriberId ? { ...subscriber, status: newStatus } : subscriber
      ));

      toast.success(`Subscriber ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating subscriber status:', error);
      toast.error('Failed to update subscriber status');
    }
  };

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (!hasRole('Admin')) {
      toast.error('Insufficient permissions to delete subscribers');
      return;
    }

    if (!confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', subscriberId);

      if (error) throw error;

      setSubscribers(subscribers.filter(subscriber => subscriber.id !== subscriberId));
      toast.success('Subscriber deleted successfully');
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Failed to delete subscriber');
    }
  };

  const exportSubscribers = async () => {
    try {
      // Get all active subscribers
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('email, subscription_date, source')
        .eq('status', 'active')
        .eq('opt_in_confirmed', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No subscribers to export');
        return;
      }

      // Convert to CSV
      const headers = ['Email', 'Subscription Date', 'Source'];
      const csvContent = [
        headers.join(','),
        ...data.map(subscriber => [
          subscriber.email,
          new Date(subscriber.subscription_date).toISOString().split('T')[0],
          subscriber.source
        ].join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${data.length} subscribers`);
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      toast.error('Failed to export subscribers');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter Subscribers</h1>
          <p className="text-gray-600">Manage your newsletter subscribers and export lists</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSubscribers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportSubscribers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
                  placeholder="Search subscribers..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="landing_page">Landing Page</SelectItem>
                <SelectItem value="checkout">Checkout</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscribers ({subscribers.length})</CardTitle>
          <CardDescription>
            A list of all newsletter subscribers including their email, status, and subscription date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Subscribed On</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{subscriber.email}</div>
                      </TableCell>
                      <TableCell>
                        {subscriber.status === 'active' ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="error">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subscriber.source}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(subscriber.subscription_date)}
                      </TableCell>
                      <TableCell>
                        {subscriber.opt_in_confirmed ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Yes</span>
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            <span>No</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(subscriber.last_updated)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {subscriber.status === 'active' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(subscriber.id, 'inactive')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(subscriber.id, 'active')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {hasRole('Admin') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubscriber(subscriber.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * subscribersPerPage) + 1} to {Math.min(currentPage * subscribersPerPage, subscribers.length)} of {subscribers.length} subscribers
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                <p className="text-3xl font-bold text-gray-900">{subscribers.length}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {subscribers.filter(s => s.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed Opt-ins</p>
                <p className="text-3xl font-bold text-gray-900">
                  {subscribers.filter(s => s.opt_in_confirmed).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewsletterSubscribersPage;