import { motion } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    quote: "I purchased an engagement ring from AXELS, and it exceeded all my expectations. The craftsmanship is exceptional, and my fiancée absolutely loves it!",
    author: "Michael Thompson",
    title: "Verified Customer"
  },
  {
    id: 2,
    quote: "The diamond necklace I received is simply stunning. The attention to detail and the quality of the stones are remarkable. AXELS delivers luxury at its finest.",
    author: "Sarah Johnson",
    title: "Verified Customer"
  },
  {
    id: 3,
    quote: "I've been collecting fine jewelry for years, and AXELS pieces stand out in my collection. Their designs are both timeless and contemporary.",
    author: "Emily Davis",
    title: "Jewelry Enthusiast"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-cream-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2 
            className="font-serif text-3xl md:text-4xl text-charcoal-800 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Customer Love
          </motion.h2>
          <motion.div 
            className="w-20 h-1 bg-gold-400 mx-auto mb-6"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 80 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              className="bg-white p-8 rounded-lg shadow-soft border border-cream-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="mb-4 text-gold-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">★</span>
                ))}
              </div>
              
              <p className="text-charcoal-700 italic mb-6">"{testimonial.quote}"</p>
              
              <div>
                <p className="font-medium text-charcoal-800">{testimonial.author}</p>
                <p className="text-sm text-charcoal-500">{testimonial.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;