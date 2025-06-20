import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface HelpLayoutProps {
  children: React.ReactNode;
}

const helpLinks = [
  { href: '/help', label: 'Help Center' },
  { href: '/help/contact-us', label: 'Contact Us' },
  { href: '/help/faqs', label: 'FAQs' },
  { href: '/help/shipping-returns', label: 'Shipping & Returns' },
  { href: '/help/jewelry-care', label: 'Jewelry Care' },
  { href: '/help/size-guide', label: 'Size Guide' },
];

const HelpLayout: React.FC<HelpLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24 bg-white rounded-lg shadow-soft p-6">
              <h2 className="font-serif text-xl text-charcoal-800 mb-4">Help & Support</h2>
              <nav className="space-y-1">
                {helpLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`block py-2 px-3 rounded-md transition-colors ${
                      location.pathname === link.href
                        ? 'bg-gold-100 text-gold-600'
                        : 'text-charcoal-600 hover:bg-cream-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              
              <div className="mt-8 p-4 bg-cream-100 rounded-lg">
                <h3 className="font-medium text-charcoal-800 mb-2">Need Immediate Help?</h3>
                <p className="text-sm text-charcoal-600 mb-3">
                  Our customer service team is available Monday-Friday, 9am-6pm EST.
                </p>
                <Link 
                  to="/help/contact-us" 
                  className="text-sm text-gold-500 hover:text-gold-600 flex items-center"
                >
                  Contact Us <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-soft p-6 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HelpLayout;