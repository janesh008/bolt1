import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'gold',
    name: 'Gold Collection',
    description: 'Timeless elegance crafted in 18K and 24K gold',
    image: 'https://images.pexels.com/photos/10187727/pexels-photo-10187727.jpeg?auto=compress&cs=tinysrgb&w=1600',
    link: '/products/gold'
  },
  {
    id: 'diamond',
    name: 'Diamond Jewelry',
    description: 'Brilliance that captures every moment',
    image: 'https://images.pexels.com/photos/12808501/pexels-photo-12808501.jpeg?auto=compress&cs=tinysrgb&w=1600',
    link: '/products/diamond'
  },
  {
    id: 'silver',
    name: 'Silver Statement',
    description: 'Contemporary designs in sterling silver',
    image: 'https://images.pexels.com/photos/9428842/pexels-photo-9428842.jpeg?auto=compress&cs=tinysrgb&w=1600',
    link: '/products/silver'
  }
];

const CategoryBanner = () => {
  return (
    <section className="py-16 bg-cream-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2 
            className="font-serif text-3xl md:text-4xl text-charcoal-800 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Explore Our Collections
          </motion.h2>
          <motion.div 
            className="w-20 h-1 bg-gold-400 mx-auto mb-6"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 80 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              className="relative h-96 rounded-lg overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="font-serif text-2xl mb-2">{category.name}</h3>
                <p className="text-cream-100 mb-4">{category.description}</p>
                <Link 
                  to={category.link}
                  className="inline-block text-gold-300 border-b border-gold-300 pb-1 hover:text-gold-400 hover:border-gold-400 transition-colors"
                >
                  Explore Collection
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryBanner;