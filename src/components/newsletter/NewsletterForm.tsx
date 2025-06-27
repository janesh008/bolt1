import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Form validation schema
const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  gdprConsent: z.boolean().refine(val => val === true, {
    message: 'You must consent to the data privacy policy'
  }),
  source: z.string().optional()
});

type NewsletterFormValues = z.infer<typeof newsletterSchema>;

interface NewsletterFormProps {
  source?: string;
  className?: string;
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({ 
  source = 'website',
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: '',
      gdprConsent: false,
      source
    }
  });
  
  const onSubmit = async (data: NewsletterFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter_subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          email: data.email,
          gdprConsent: data.gdprConsent,
          source: data.source || source
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Improved error message extraction
        const errorMessage = result.error || result.message || result.details || `HTTP ${response.status}: ${response.statusText}` || 'Failed to subscribe';
        throw new Error(errorMessage);
      }
      
      if (result.success) {
        setIsSubscribed(true);
        reset();
        
        if (result.alreadySubscribed) {
          toast.success("You're already subscribed to our newsletter!");
        } else {
          toast.success("Thank you for subscribing to our newsletter!");
        }
      } else {
        // Improved error message extraction for non-success responses
        const errorMessage = result.error || result.message || result.details || 'Failed to subscribe';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={className}>
      {isSubscribed ? (
        <div className="bg-green-100 text-green-800 p-4 rounded-md flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium">Subscription Successful!</h4>
            <p className="text-sm mt-1">
              Thank you for subscribing to our newsletter. You'll receive our next newsletter soon.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400" />
              <input
                type="email"
                placeholder="Your email address"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-3 rounded-md ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-charcoal-600 bg-charcoal-700 focus:ring-gold-400 focus:border-gold-400'
                } text-white placeholder-charcoal-400 focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="gdprConsent"
              {...register('gdprConsent')}
              className="mt-1 h-4 w-4 text-gold-400 bg-charcoal-700 border-charcoal-600 rounded focus:ring-gold-400 focus:ring-2"
            />
            <label htmlFor="gdprConsent" className="text-sm text-cream-200">
              I agree to receive newsletters and accept the{' '}
              <a href="/privacy-policy" className="text-gold-400 hover:text-gold-300 underline">
                privacy policy
              </a>
            </label>
          </div>
          {errors.gdprConsent && (
            <p className="text-red-400 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.gdprConsent.message}
            </p>
          )}
          
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full bg-gold-400 hover:bg-gold-500 text-white py-3 rounded-md transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              'Subscribe'
            )}
          </Button>
          
          <p className="text-xs text-cream-200 text-center">
            You can unsubscribe at any time by clicking the link in the footer of our emails.
          </p>
        </form>
      )}
    </div>
  );
};

export default NewsletterForm;