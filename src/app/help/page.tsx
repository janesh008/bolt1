import { Link } from 'react-router-dom';
import { Search, Phone, Mail, TruckIcon, HelpCircle, Heart, Ruler } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/help/PageHeader';

const helpCategories = [
  {
    title: 'Contact Us',
    description: 'Get in touch with our customer service team',
    icon: <Mail className="h-6 w-6 text-gold-500" />,
    href: '/help/contact-us',
  },
  {
    title: 'FAQs',
    description: 'Find answers to common questions',
    icon: <HelpCircle className="h-6 w-6 text-gold-500" />,
    href: '/help/faqs',
  },
  {
    title: 'Shipping & Returns',
    description: 'Learn about our shipping and return policies',
    icon: <TruckIcon className="h-6 w-6 text-gold-500" />,
    href: '/help/shipping-returns',
  },
  {
    title: 'Jewelry Care',
    description: 'Tips for maintaining your jewelry',
    icon: <Heart className="h-6 w-6 text-gold-500" />,
    href: '/help/jewelry-care',
  },
  {
    title: 'Size Guide',
    description: 'Find your perfect fit',
    icon: <Ruler className="h-6 w-6 text-gold-500" />,
    href: '/help/size-guide',
  },
  {
    title: 'Customer Support',
    description: 'Call us at +91 992590-2377',
    icon: <Phone className="h-6 w-6 text-gold-500" />,
    href: '/help/contact-us',
  },
];

export default function HelpPage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-charcoal-800 h-64 mb-8 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-60"
          style={{
            backgroundImage: "url('https://images.pexels.com/photos/3266700/pexels-photo-3266700.jpeg?auto=compress&cs=tinysrgb&w=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/80 to-charcoal-900/20 z-10" />
        <div className="container mx-auto px-4 h-full flex items-center relative z-20">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight">
              Help Center
            </h1>
            <p className="mt-4 text-lg text-cream-100 max-w-xl">
              Find answers to your questions and get the support you need.
            </p>
          </div>
        </div>
      </div>
      
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Help Center', href: '/help', active: true },
        ]}
      />
      
      <PageHeader
        title="How can we help you today?"
        description="Browse our help topics or search for specific information"
      />
      
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search for help topics..."
            className="w-full py-3 pl-12 pr-4 rounded-full border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          />
        </div>
        <p className="text-sm text-charcoal-500 mt-2 text-center">
          Popular searches: returns, sizing, cleaning jewelry
        </p>
      </div>
      
      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {helpCategories.map((category, index) => (
          <Link
            key={index}
            to={category.href}
            className="bg-cream-50 hover:bg-cream-100 rounded-lg p-6 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm group-hover:shadow transition-shadow">
                {category.icon}
              </div>
              <div>
                <h3 className="font-medium text-charcoal-800 group-hover:text-gold-500 transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-charcoal-500 mt-1">
                  {category.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Popular Help Topics */}
      <div className="mt-12">
        <h2 className="font-serif text-xl text-charcoal-800 mb-6">Popular Help Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-cream-200 rounded-lg p-4 hover:border-gold-300 transition-colors">
            <Link to="/help/faqs#order-tracking" className="text-charcoal-800 hover:text-gold-500 font-medium">
              How can I track my order?
            </Link>
          </div>
          <div className="bg-white border border-cream-200 rounded-lg p-4 hover:border-gold-300 transition-colors">
            <Link to="/help/shipping-returns#return-policy" className="text-charcoal-800 hover:text-gold-500 font-medium">
              What is your return policy?
            </Link>
          </div>
          <div className="bg-white border border-cream-200 rounded-lg p-4 hover:border-gold-300 transition-colors">
            <Link to="/help/jewelry-care#cleaning" className="text-charcoal-800 hover:text-gold-500 font-medium">
              How do I clean my jewelry?
            </Link>
          </div>
          <div className="bg-white border border-cream-200 rounded-lg p-4 hover:border-gold-300 transition-colors">
            <Link to="/help/size-guide#ring-sizing" className="text-charcoal-800 hover:text-gold-500 font-medium">
              How do I find my ring size?
            </Link>
          </div>
          <div className="bg-white border border-cream-200 rounded-lg p-4 hover:border-gold-300 transition-colors">
            <Link to="/help/faqs#payment-methods" className="text-charcoal-800 hover:text-gold-500 font-medium">
              What payment methods do you accept?
            </Link>
          </div>
          <div className="bg-white border border-cream-200 rounded-lg p-4 hover:border-gold-300 transition-colors">
            <Link to="/help/shipping-returns#international" className="text-charcoal-800 hover:text-gold-500 font-medium">
              Do you ship internationally?
            </Link>
          </div>
        </div>
      </div>
      
      {/* Still Need Help */}
      <div className="mt-12 bg-gradient-to-r from-gold-100 to-cream-100 rounded-lg p-6 md:p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-2xl text-charcoal-800 mb-4">Still Need Help?</h2>
          <p className="text-charcoal-600 mb-6">
            Our customer service team is available to assist you with any questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/help/contact-us"
              className="inline-flex items-center justify-center py-3 px-6 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors"
            >
              Contact Us
            </Link>
            <a
              href="tel:+91 9925902377"
              className="inline-flex items-center justify-center py-3 px-6 bg-white border border-gold-400 text-gold-500 hover:bg-gold-50 rounded-md transition-colors"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}