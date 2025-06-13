import { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/help/PageHeader';
import ContactForm from '@/components/help/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us | AXELS Luxury Jewelry',
  description: 'Get in touch with our customer service team for any questions, concerns, or feedback about your AXELS jewelry purchase.',
};

export default function ContactUsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Help Center', href: '/help' },
          { label: 'Contact Us', href: '/help/contact-us', active: true },
        ]}
      />
      
      <PageHeader
        title="Contact Us"
        description="We're here to help with any questions or concerns"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Contact Information */}
        <div className="space-y-6">
          <div className="bg-cream-50 rounded-lg p-6">
            <h3 className="font-serif text-xl text-charcoal-800 mb-4">Contact Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Phone className="h-5 w-5 text-gold-500" />
                </div>
                <div>
                  <h4 className="font-medium text-charcoal-800">Phone Support</h4>
                  <p className="text-charcoal-600 mt-1">+1 (800) 123-4567</p>
                  <p className="text-sm text-charcoal-500 mt-1">For immediate assistance with orders or products</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Mail className="h-5 w-5 text-gold-500" />
                </div>
                <div>
                  <h4 className="font-medium text-charcoal-800">Email Support</h4>
                  <p className="text-charcoal-600 mt-1">support@axelsjewelry.com</p>
                  <p className="text-sm text-charcoal-500 mt-1">We'll respond within 24 hours</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <MapPin className="h-5 w-5 text-gold-500" />
                </div>
                <div>
                  <h4 className="font-medium text-charcoal-800">Store Location</h4>
                  <p className="text-charcoal-600 mt-1">123 Luxury Lane, Suite 100<br />New York, NY 10001</p>
                  <p className="text-sm text-charcoal-500 mt-1">Visit our flagship store</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Clock className="h-5 w-5 text-gold-500" />
                </div>
                <div>
                  <h4 className="font-medium text-charcoal-800">Business Hours</h4>
                  <p className="text-charcoal-600 mt-1">Monday - Friday: 9am - 6pm EST<br />Saturday: 10am - 4pm EST<br />Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Map or Store Image */}
          <div className="rounded-lg overflow-hidden h-64 bg-cream-100">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215175515263!2d-73.9888803!3d40.7410503!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a3f71c1f67%3A0xbce6f8c5c296ed50!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1623252353520!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="AXELS Jewelry Store Location"
            ></iframe>
          </div>
          
          {/* Social Media */}
          <div className="bg-cream-50 rounded-lg p-6">
            <h3 className="font-serif text-xl text-charcoal-800 mb-4">Connect With Us</h3>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-full shadow-sm hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-full shadow-sm hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-full shadow-sm hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-full shadow-sm hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500">
                  <path d="M8 12h8"></path>
                  <path d="M12 8v8"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Contact Form */}
        <div className="bg-cream-50 rounded-lg p-6">
          <h3 className="font-serif text-xl text-charcoal-800 mb-4">Send Us a Message</h3>
          <p className="text-charcoal-600 mb-6">
            Fill out the form below and our team will get back to you as soon as possible.
          </p>
          
          <ContactForm />
        </div>
      </div>
      
      {/* FAQ Teaser */}
      <div className="mt-12 bg-white border border-cream-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-cream-100 p-3 rounded-full">
            <Send className="h-5 w-5 text-gold-500" />
          </div>
          <div>
            <h3 className="font-medium text-charcoal-800">Looking for quick answers?</h3>
            <p className="text-charcoal-600 mt-1">
              Check our <a href="/help/faqs" className="text-gold-500 hover:text-gold-600 underline">Frequently Asked Questions</a> for immediate answers to common inquiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}