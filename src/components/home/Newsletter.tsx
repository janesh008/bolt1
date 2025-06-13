import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubscribed(true);
      setEmail('');
    }, 1000);
  };
  
  return (
    <section className="py-16 bg-charcoal-800 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 
            className="font-serif text-3xl md:text-4xl mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Join Our Newsletter
          </motion.h2>
          
          <motion.p 
            className="text-cream-100 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Stay updated with our latest collections, exclusive offers, and jewelry care tips.
          </motion.p>
          
          {isSubscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gold-400/20 text-gold-300 p-4 rounded-md"
            >
              Thank you for subscribing! You'll receive our next newsletter soon.
            </motion.div>
          ) : (
            <motion.form 
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-md bg-charcoal-700 border border-charcoal-600 focus:outline-none focus:ring-2 focus:ring-gold-400 placeholder-charcoal-400 text-white"
                required
              />
              <Button 
                type="submit" 
                isLoading={isSubmitting}
                className="px-6 py-3 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-charcoal-800"
              >
                Subscribe
              </Button>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;