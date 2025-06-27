import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  
  useEffect(() => {
    if (token) {
      handleUnsubscribe(token);
    }
  }, [token]);
  
  const handleUnsubscribe = async (unsubscribeToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter_unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ token: unsubscribeToken })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to unsubscribe');
      }
      
      if (result.success) {
        setIsUnsubscribed(true);
        setEmail(result.email || null);
        toast.success('You have been successfully unsubscribed');
      } else {
        throw new Error(result.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      console.error('Newsletter unsubscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      toast.error('Failed to unsubscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-soft p-8">
        {!token ? (
          <div className="text-center">
            <Mail className="h-12 w-12 text-gold-400 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-charcoal-800 mb-4">
              Invalid Unsubscribe Link
            </h1>
            <p className="text-charcoal-600 mb-6">
              The unsubscribe link appears to be invalid or missing a token. Please check your email and try again.
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-cream-200 border-t-gold-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-charcoal-600">Processing your request...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-charcoal-800 mb-4">
              Unsubscribe Failed
            </h1>
            <p className="text-charcoal-600 mb-6">
              {error}
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>
        ) : isUnsubscribed ? (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-charcoal-800 mb-4">
              Successfully Unsubscribed
            </h1>
            <p className="text-charcoal-600 mb-6">
              {email ? `${email} has been` : 'You have been'} successfully unsubscribed from our newsletter. We're sorry to see you go!
            </p>
            <p className="text-charcoal-500 mb-6">
              If you'd like to share why you're unsubscribing, we'd appreciate your feedback.
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <Mail className="h-12 w-12 text-gold-400 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-charcoal-800 mb-4">
              Unsubscribe from Newsletter
            </h1>
            <p className="text-charcoal-600 mb-6">
              Are you sure you want to unsubscribe from our newsletter? You'll no longer receive updates on our latest collections and offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUnsubscribe(token)}
                className="bg-red-500 hover:bg-red-600"
              >
                Confirm Unsubscribe
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnsubscribePage;