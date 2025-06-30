import React from 'react';
import { Headphones, MessageSquare, Phone, Mail, FileText } from 'lucide-react';
import Button from '../ui/Button';

const SupportTab: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-xl font-medium text-charcoal-800 mb-6 flex items-center">
        <Headphones className="h-5 w-5 mr-2 text-gold-500" />
        Customer Support
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* AI Support Agent */}
        <div className="bg-gradient-to-r from-gold-100 to-cream-100 rounded-lg p-6 border border-gold-200">
          <div className="flex items-start gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <MessageSquare className="h-6 w-6 text-gold-500" />
            </div>
            <div>
              <h3 className="font-medium text-charcoal-800 mb-2">AI Support Agent</h3>
              <p className="text-charcoal-600 text-sm mb-4">
                Get instant answers about your orders, returns, and more. Our AI agent is available 24/7.
              </p>
              <Button
                onClick={() => {
                  // This will be handled by the floating button
                  const supportButton = document.querySelector('[aria-label="Open Support Agent"]') as HTMLButtonElement;
                  if (supportButton) supportButton.click();
                }}
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with Support Agent
              </Button>
            </div>
          </div>
        </div>
        
        {/* Phone Support */}
        <div className="bg-white rounded-lg p-6 border border-cream-200">
          <div className="flex items-start gap-4">
            <div className="bg-cream-100 p-3 rounded-full">
              <Phone className="h-6 w-6 text-gold-500" />
            </div>
            <div>
              <h3 className="font-medium text-charcoal-800 mb-2">Phone Support</h3>
              <p className="text-charcoal-600 text-sm mb-4">
                Speak with our customer service team directly for complex issues.
              </p>
              <p className="font-medium text-charcoal-800">+91 992590-2377</p>
              <p className="text-xs text-charcoal-500">Monday-Friday, 9am-6pm IST</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Support */}
        <div className="bg-white rounded-lg p-6 border border-cream-200">
          <div className="flex items-start gap-4">
            <div className="bg-cream-100 p-3 rounded-full">
              <Mail className="h-6 w-6 text-gold-500" />
            </div>
            <div>
              <h3 className="font-medium text-charcoal-800 mb-2">Email Support</h3>
              <p className="text-charcoal-600 text-sm mb-4">
                Send us an email and we'll get back to you within 24 hours.
              </p>
              <a 
                href="mailto:support@axelsjewelry.com" 
                className="text-gold-500 hover:text-gold-600 font-medium"
              >
                support@axelsjewelry.com
              </a>
            </div>
          </div>
        </div>
        
        {/* Help Center */}
        <div className="bg-white rounded-lg p-6 border border-cream-200">
          <div className="flex items-start gap-4">
            <div className="bg-cream-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-gold-500" />
            </div>
            <div>
              <h3 className="font-medium text-charcoal-800 mb-2">Help Center</h3>
              <p className="text-charcoal-600 text-sm mb-4">
                Browse our help articles for answers to common questions.
              </p>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/help'}
              >
                Visit Help Center
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTab;