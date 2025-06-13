import { Metadata } from 'next';
import Image from 'next/image';
import { TruckIcon, Package, RefreshCw, Clock, Globe, CreditCard, Download } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/help/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Shipping & Returns | AXELS Luxury Jewelry',
  description: 'Learn about our shipping policies, delivery timeframes, and hassle-free return process for AXELS luxury jewelry.',
};

export default function ShippingReturnsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Help Center', href: '/help' },
          { label: 'Shipping & Returns', href: '/help/shipping-returns', active: true },
        ]}
      />
      
      <PageHeader
        title="Shipping & Returns"
        description="Everything you need to know about our shipping and return policies"
      />
      
      <Tabs defaultValue="shipping" className="mt-8">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="shipping">Shipping Information</TabsTrigger>
          <TabsTrigger value="returns">Returns & Exchanges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shipping" className="space-y-8">
          {/* Shipping Methods */}
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <TruckIcon className="h-5 w-5 mr-2 text-gold-500" />
              Shipping Methods
            </h2>
            
            <div className="bg-cream-50 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gold-100">
                      <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Shipping Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Delivery Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-charcoal-800">Standard Shipping</td>
                      <td className="px-4 py-3 text-sm text-charcoal-600">3-5 business days</td>
                      <td className="px-4 py-3 text-sm text-charcoal-600">
                        Free on orders over $150<br />
                        $9.95 for orders under $150
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-charcoal-800">Express Shipping</td>
                      <td className="px-4 py-3 text-sm text-charcoal-600">1-2 business days</td>
                      <td className="px-4 py-3 text-sm text-charcoal-600">$19.95</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-charcoal-800">Next Day Delivery</td>
                      <td className="px-4 py-3 text-sm text-charcoal-600">Next business day</td>
                      <td className="px-4 py-3 text-sm text-charcoal-600">$29.95</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-charcoal-800">International Shipping</td>
                      <td className="px-4 py-3 text-sm text-charcoal-600">7-14 business days</td>
                      <td className="px-4 py-3 text-sm text-charcoal-600">
                        Calculated at checkout<br />
                        (based on destination and weight)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <p className="text-sm text-charcoal-500 mt-4">
              * Delivery times are estimates and not guaranteed. Delivery to remote areas may take longer.
            </p>
          </section>
          
          {/* International Shipping */}
          <section id="international">
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-gold-500" />
              International Shipping
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-4">
                We ship to most countries worldwide. International shipping times vary by destination, generally taking 7-14 business days. Please note that customers are responsible for any customs duties, taxes, or import fees that may apply in their country.
              </p>
              
              <h3 className="font-medium text-charcoal-800 mt-6 mb-3">Important Information for International Orders:</h3>
              <ul className="list-disc pl-5 space-y-2 text-charcoal-600">
                <li>Customs duties and taxes are not included in the purchase price or shipping cost</li>
                <li>Delivery times may be affected by customs processing in your country</li>
                <li>Some countries have restrictions on importing precious metals and gemstones</li>
                <li>International orders over $1,000 require signature confirmation upon delivery</li>
                <li>All international shipments are fully insured</li>
              </ul>
              
              <div className="mt-6 p-4 bg-gold-100 rounded-lg">
                <h4 className="font-medium text-charcoal-800 mb-2">Popular International Destinations:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-medium text-charcoal-700">Canada</p>
                    <p className="text-sm text-charcoal-600">3-7 business days</p>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal-700">United Kingdom</p>
                    <p className="text-sm text-charcoal-600">5-10 business days</p>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal-700">Australia</p>
                    <p className="text-sm text-charcoal-600">7-14 business days</p>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal-700">European Union</p>
                    <p className="text-sm text-charcoal-600">5-12 business days</p>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal-700">Japan</p>
                    <p className="text-sm text-charcoal-600">6-12 business days</p>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal-700">Singapore</p>
                    <p className="text-sm text-charcoal-600">5-10 business days</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Order Processing */}
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-gold-500" />
              Order Processing
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-4">
                Most orders are processed within 1-2 business days after payment confirmation. Custom pieces and engraved items may require additional processing time.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium">1</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Order Placed</h4>
                    <p className="text-sm text-charcoal-600">You'll receive an order confirmation email</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium">2</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Order Processing</h4>
                    <p className="text-sm text-charcoal-600">We verify and prepare your items for shipment</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium">3</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Order Shipped</h4>
                    <p className="text-sm text-charcoal-600">You'll receive a shipping confirmation email with tracking information</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium">4</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Order Delivered</h4>
                    <p className="text-sm text-charcoal-600">Your package arrives at your doorstep</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Shipping FAQ */}
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gold-500" />
              Shipping FAQs
            </h2>
            
            <div className="space-y-4">
              <div className="bg-cream-50 rounded-lg p-5">
                <h3 className="font-medium text-charcoal-800 mb-2">Do you offer gift wrapping?</h3>
                <p className="text-charcoal-600">
                  Yes, we offer complimentary gift wrapping for all orders. You can select this option during checkout and add a personalized message to be included with your gift.
                </p>
              </div>
              
              <div className="bg-cream-50 rounded-lg p-5">
                <h3 className="font-medium text-charcoal-800 mb-2">Can I change my shipping address after placing an order?</h3>
                <p className="text-charcoal-600">
                  Address changes can be accommodated if requested within 1 hour of placing your order. Please contact our customer service team immediately if you need to update your shipping address.
                </p>
              </div>
              
              <div className="bg-cream-50 rounded-lg p-5">
                <h3 className="font-medium text-charcoal-800 mb-2">Do you ship to P.O. boxes?</h3>
                <p className="text-charcoal-600">
                  Yes, we can ship to P.O. boxes for standard shipping only. Express and Next Day delivery require a physical address for delivery.
                </p>
              </div>
              
              <div className="bg-cream-50 rounded-lg p-5">
                <h3 className="font-medium text-charcoal-800 mb-2">Is signature required for delivery?</h3>
                <p className="text-charcoal-600">
                  Signature confirmation is required for all orders over $500 and for all international shipments to ensure secure delivery of your valuable items.
                </p>
              </div>
            </div>
          </section>
        </TabsContent>
        
        <TabsContent value="returns" className="space-y-8">
          {/* Return Policy */}
          <section id="return-policy">
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 text-gold-500" />
              Return Policy
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-4">
                We want you to be completely satisfied with your purchase. If for any reason you're not happy with your jewelry, we offer a hassle-free return policy.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium mt-1">✓</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">30-Day Return Window</h4>
                    <p className="text-sm text-charcoal-600">
                      You have 30 days from the delivery date to return your item(s). The item(s) must be in their original, unworn condition with all tags and packaging intact.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium mt-1">✓</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Easy Return Process</h4>
                    <p className="text-sm text-charcoal-600">
                      Initiate your return through your account or contact our customer service team. We'll provide a prepaid return shipping label and instructions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium mt-1">✓</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Full Refunds</h4>
                    <p className="text-sm text-charcoal-600">
                      Once we receive and inspect your return, we'll process your refund to the original payment method within 5-7 business days.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-white rounded-lg border border-cream-200">
                <h4 className="font-medium text-charcoal-800 mb-2">Non-Returnable Items:</h4>
                <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                  <li>Custom or personalized pieces (including engraved items)</li>
                  <li>Items marked as "Final Sale"</li>
                  <li>Items that show signs of wear or have been damaged after delivery</li>
                  <li>Gift cards</li>
                </ul>
              </div>
            </div>
          </section>
          
          {/* Return Process */}
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-gold-500" />
              Return Process
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium">1</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Initiate Your Return</h4>
                    <p className="text-charcoal-600 mt-1">
                      Log into your account, go to "Orders", select the order containing the item you wish to return, and click "Return Item". Alternatively, contact our customer service team.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium">2</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Package Your Return</h4>
                    <p className="text-charcoal-600 mt-1">
                      Place the item(s) in their original packaging, including the gift box, pouch, and any documentation. Include the return form or packing slip in the package.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium">3</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Ship Your Return</h4>
                    <p className="text-charcoal-600 mt-1">
                      Attach the prepaid return shipping label to your package and drop it off at any authorized shipping location. We recommend keeping the tracking number for your records.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium">4</div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Refund Processing</h4>
                    <p className="text-charcoal-600 mt-1">
                      Once we receive and inspect your return, we'll process your refund to the original payment method. This typically takes 5-7 business days. You'll receive an email notification when your refund is processed.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-center">
                <a 
                  href="/return-label.pdf" 
                  className="inline-flex items-center justify-center py-3 px-6 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Return Form
                </a>
              </div>
            </div>
          </section>
          
          {/* Exchanges */}
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 text-gold-500" />
              Exchanges
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-4">
                We're happy to exchange your item for a different size, color, or style within 30 days of purchase. Exchanges follow a similar process to returns.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="bg-white rounded-lg p-4 border border-cream-200">
                  <h4 className="font-medium text-charcoal-800 mb-2">Size Exchanges</h4>
                  <p className="text-sm text-charcoal-600">
                    If you need a different size, we offer one free resize for rings purchased within 60 days. For other items, standard exchange policies apply.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-cream-200">
                  <h4 className="font-medium text-charcoal-800 mb-2">Style Exchanges</h4>
                  <p className="text-sm text-charcoal-600">
                    If you prefer a different style, you can exchange your item for another of equal or greater value (paying the difference if applicable). If the new item costs less, we'll refund the difference.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-cream-200">
                  <h4 className="font-medium text-charcoal-800 mb-2">Exchange Process</h4>
                  <p className="text-sm text-charcoal-600">
                    Initiate an exchange through your account or contact customer service. Ship your original item back to us, and once received, we'll process your exchange and ship the new item to you.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Refunds */}
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-gold-500" />
              Refunds
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-4">
                Refunds are processed within 5-7 business days after we receive and inspect your return. The refund will be issued to the original payment method used for the purchase.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <CreditCard className="h-5 w-5 text-gold-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Credit Card Refunds</h4>
                    <p className="text-sm text-charcoal-600 mt-1">
                      Refunds to credit cards typically appear on your statement within 5-7 business days after processing, depending on your credit card company.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <svg className="h-5 w-5 text-gold-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">PayPal Refunds</h4>
                    <p className="text-sm text-charcoal-600 mt-1">
                      PayPal refunds are typically processed within 24-48 hours after we issue the refund.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <svg className="h-5 w-5 text-gold-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-charcoal-800">Store Credit</h4>
                    <p className="text-sm text-charcoal-600 mt-1">
                      If you prefer, we can issue a store credit for the full amount of your purchase, which can be used for future purchases. Store credits never expire.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-white rounded-lg border border-cream-200">
                <h4 className="font-medium text-charcoal-800 mb-2">Refund Deductions:</h4>
                <p className="text-sm text-charcoal-600">
                  Please note that the following may be deducted from your refund:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm mt-2">
                  <li>Return shipping costs (unless the return is due to our error)</li>
                  <li>Original shipping charges (if applicable)</li>
                  <li>Restocking fee of 10% for items returned without their original packaging</li>
                </ul>
              </div>
            </div>
          </section>
          
          {/* Contact for Returns */}
          <section>
            <div className="bg-gold-100 rounded-lg p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="md:w-1/3 flex justify-center">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gold-500" />
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="font-serif text-xl text-charcoal-800 mb-3">Need Help with a Return?</h3>
                  <p className="text-charcoal-600 mb-4">
                    Our customer service team is available to assist you with any questions or concerns about returns or exchanges.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="/help/contact-us"
                      className="inline-flex items-center justify-center py-3 px-6 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors"
                    >
                      Contact Us
                    </a>
                    <a
                      href="tel:+18001234567"
                      className="inline-flex items-center justify-center py-3 px-6 bg-white border border-gold-400 text-gold-500 hover:bg-gold-50 rounded-md transition-colors"
                    >
                      Call Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}