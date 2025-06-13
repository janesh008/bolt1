import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Logo from '../ui/Logo';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-charcoal-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Logo className="text-white" />
            <p className="mt-4 text-sm text-gray-300">
              Discover the finest collection of luxurious jewelry crafted with precision and elegance.
            </p>
            <div className="mt-6 flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-gold-300 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-gold-300 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-gold-300 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-gold-300 font-serif text-lg mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products/gold" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Gold Collection
                </Link>
              </li>
              <li>
                <Link to="/products/diamond" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Diamond Jewelry
                </Link>
              </li>
              <li>
                <Link to="/products/silver" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Silver Jewelry
                </Link>
              </li>
              <li>
                <Link to="/products/platinum" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Platinum Collection
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 hover:text-white text-sm transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-gold-300 font-serif text-lg mb-4">Help</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/help/contact-us" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/help/faqs" className="text-gray-300 hover:text-white text-sm transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/help/shipping-returns" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/help/jewelry-care" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Jewelry Care
                </Link>
              </li>
              <li>
                <Link to="/help/size-guide" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-gold-300 font-serif text-lg mb-4">Subscribe</h3>
            <p className="text-sm text-gray-300 mb-4">
              Stay updated with our latest collections and exclusive offers.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-2 bg-charcoal-700 border border-charcoal-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gold-300 text-white text-sm"
              />
              <button
                type="submit"
                className="w-full bg-gold-400 hover:bg-gold-500 text-white py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gold-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-charcoal-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {year} AXELS. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link to="/help/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/help/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/help/shipping-returns" className="text-sm text-gray-400 hover:text-white transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;