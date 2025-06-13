import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  subject: z.string().min(2, 'Subject must be at least 2 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });
  
  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would be an API call
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Your message has been sent! We\'ll get back to you soon.');
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-charcoal-800 mb-1">
          Full Name *
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={`w-full px-4 py-2 rounded-md border ${
            errors.name ? 'border-red-300 focus:ring-red-500' : 'border-cream-200 focus:ring-gold-400'
          } focus:outline-none focus:ring-2`}
          placeholder="Your name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-charcoal-800 mb-1">
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={`w-full px-4 py-2 rounded-md border ${
            errors.email ? 'border-red-300 focus:ring-red-500' : 'border-cream-200 focus:ring-gold-400'
          } focus:outline-none focus:ring-2`}
          placeholder="your.email@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-charcoal-800 mb-1">
          Phone Number (Optional)
        </label>
        <input
          id="phone"
          type="tel"
          {...register('phone')}
          className="w-full px-4 py-2 rounded-md border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
          placeholder="Your phone number"
        />
      </div>
      
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-charcoal-800 mb-1">
          Subject *
        </label>
        <input
          id="subject"
          type="text"
          {...register('subject')}
          className={`w-full px-4 py-2 rounded-md border ${
            errors.subject ? 'border-red-300 focus:ring-red-500' : 'border-cream-200 focus:ring-gold-400'
          } focus:outline-none focus:ring-2`}
          placeholder="What is your inquiry about?"
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-charcoal-800 mb-1">
          Message *
        </label>
        <textarea
          id="message"
          {...register('message')}
          rows={5}
          className={`w-full px-4 py-2 rounded-md border ${
            errors.message ? 'border-red-300 focus:ring-red-500' : 'border-cream-200 focus:ring-gold-400'
          } focus:outline-none focus:ring-2`}
          placeholder="Please provide details about your inquiry..."
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
        )}
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
      
      <p className="text-xs text-charcoal-500 text-center">
        By submitting this form, you agree to our{' '}
        <a href="/privacy-policy" className="text-gold-500 hover:text-gold-600 underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
};

export default ContactForm;