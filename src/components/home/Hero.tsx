import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const Hero = () => {
  return (
    <section className="relative h-screen bg-charcoal-800 overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/3266700/pexels-photo-3266700.jpeg?auto=compress&cs=tinysrgb&w=1600')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/80 to-charcoal-900/20 z-10" />
      
      <div className="container mx-auto px-4 h-full flex items-center relative z-20">
        <div className="max-w-3xl">
          <motion.h1 
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            DISCOVER SPARKLE<br />WITH STYLE
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-lg text-cream-100 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Exquisite jewelry crafted with the finest materials, designed to make every moment unforgettable.
          </motion.p>
          
          <motion.div 
            className="mt-8 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/products">
              <Button size="lg">
                Shop Collection
              </Button>
            </Link>
            <Link to="/products/diamond">
              <Button variant="outline" size="lg" className="border-cream-100 text-cream-100 hover:bg-cream-100/10">
                Explore Diamonds
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;