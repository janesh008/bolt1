import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../products/ProductCard';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Product } from '../../types';

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_images!fk_product(*)
          `)
          .limit(4)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        // Fallback to mock data if Supabase isn't connected yet
        setProducts(mockProducts);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeaturedProducts();
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  
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
            Featured Collection
          </motion.h2>
          <motion.div 
            className="w-20 h-1 bg-gold-400 mx-auto mb-6"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 80 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.p 
            className="text-charcoal-500 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Discover our most sought-after pieces, meticulously crafted for those who appreciate elegance and timeless beauty.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            to="/products" 
            className="inline-flex items-center justify-center py-3 px-6 bg-transparent border border-gold-400 text-gold-500 hover:bg-gold-400 hover:text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

// Mock data for preview without Supabase connection
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Elegant Diamond Necklace',
    category: 'diamond',
    price: 2999,
    metal: 'Gold',
    description: 'A stunning diamond necklace with 18K gold setting.',
    availability: true,
    created_at: new Date().toISOString(),
    product_images: [
      {
        id: '1',
        product_id: '1',
        image_url: 'https://images.pexels.com/photos/10018318/pexels-photo-10018318.jpeg?auto=compress&cs=tinysrgb&w=1600',
        angle: 'front'
      }
    ]
  },
  {
    id: '2',
    name: 'Classic Gold Bracelet',
    category: 'gold',
    price: 1299,
    metal: 'Gold',
    description: 'Timeless 18K gold bracelet with intricate detailing.',
    availability: true,
    created_at: new Date().toISOString(),
    product_images: [
      {
        id: '2',
        product_id: '2',
        image_url: 'https://images.pexels.com/photos/9953682/pexels-photo-9953682.jpeg?auto=compress&cs=tinysrgb&w=1600',
        angle: 'front'
      }
    ]
  },
  {
    id: '3',
    name: 'Diamond Stud Earrings',
    category: 'diamond',
    price: 899,
    metal: 'White Gold',
    description: 'Brilliant diamond stud earrings set in white gold.',
    availability: true,
    created_at: new Date().toISOString(),
    product_images: [
      {
        id: '3',
        product_id: '3',
        image_url: 'https://images.pexels.com/photos/10922931/pexels-photo-10922931.jpeg?auto=compress&cs=tinysrgb&w=1600',
        angle: 'front'
      }
    ]
  },
  {
    id: '4',
    name: 'Vintage Silver Ring',
    category: 'silver',
    price: 499,
    metal: 'Silver',
    description: 'Elegant vintage-inspired silver ring with floral pattern.',
    availability: true,
    created_at: new Date().toISOString(),
    product_images: [
      {
        id: '4',
        product_id: '4',
        image_url: 'https://images.pexels.com/photos/11144577/pexels-photo-11144577.jpeg?auto=compress&cs=tinysrgb&w=1600',
        angle: 'front'
      }
    ]
  }
];

export default FeaturedProducts;