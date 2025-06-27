import { useState } from 'react';
import { motion } from 'framer-motion';
import NewsletterForm from '../newsletter/NewsletterForm';

const Newsletter = () => {
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
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <NewsletterForm source="homepage" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;