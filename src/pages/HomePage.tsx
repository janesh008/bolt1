import { useEffect } from 'react';
import Hero from '../components/home/Hero';
import FeaturedProducts from '../components/home/FeaturedProducts';
import CategoryBanner from '../components/home/CategoryBanner';
import PopularProducts from '../components/home/PopularProducts';
import Testimonials from '../components/home/Testimonials';
import Newsletter from '../components/home/Newsletter';

const HomePage = () => {
  useEffect(() => {
    document.title = 'AXELS | Luxury Jewelry';
  }, []);
  
  return (
    <div>
      <Hero />
      <FeaturedProducts />
      <CategoryBanner />
      <PopularProducts />
      <Testimonials />
      <Newsletter />
    </div>
  );
};

export default HomePage;