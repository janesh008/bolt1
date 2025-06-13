import { Metadata } from 'next';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/help/PageHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | AXELS Luxury Jewelry',
  description: 'Find answers to common questions about AXELS jewelry, orders, shipping, returns, and more.',
};

// FAQ data organized by category
const faqData = {
  orders: [
    {
      id: 'order-tracking',
      question: 'How can I track my order?',
      answer: 'You can track your order by logging into your account and visiting the "Orders" section. Alternatively, you can use the tracking number provided in your shipping confirmation email. If you need further assistance, please contact our customer service team.'
    },
    {
      question: 'Can I modify or cancel my order?',
      answer: 'Orders can be modified or canceled within 1 hour of placement. After this window, we begin processing orders for shipment. Please contact our customer service team immediately if you need to make changes to your order.'
    },
    {
      question: 'What happens if my order is delayed?',
      answer: 'In the rare event of a delay, we will notify you via email with updated delivery information. If your order is significantly delayed, we may offer compensation such as a discount on your next purchase or expedited shipping at no additional cost.'
    },
    {
      question: 'How do I check my order status?',
      answer: 'You can check your order status by logging into your account and visiting the "Orders" section. Each order will display its current status, from processing to delivery.'
    }
  ],
  shipping: [
    {
      id: 'shipping-time',
      question: 'How long does shipping take?',
      answer: 'Standard shipping within the United States typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery. International shipping times vary by destination, generally taking 7-14 business days. Custom pieces may require additional processing time before shipping.'
    },
    {
      id: 'international',
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most countries worldwide. International shipping times vary by destination, generally taking 7-14 business days. Please note that customers are responsible for any customs duties, taxes, or import fees that may apply in their country.'
    },
    {
      question: 'Is shipping free?',
      answer: 'We offer free standard shipping on all domestic orders over $150. Orders under $150 incur a flat shipping fee of $9.95. International shipping rates vary by destination and order value.'
    },
    {
      question: 'How are items packaged for shipping?',
      answer: 'All jewelry pieces are carefully packaged in our signature AXELS gift box, placed inside a protective pouch, and shipped in discreet, secure packaging to ensure safe delivery. Gift wrapping options are available during checkout.'
    }
  ],
  payments: [
    {
      id: 'payment-methods',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Razorpay. For orders over $1,000, we also offer wire transfer options. All transactions are securely processed and encrypted.'
    },
    {
      question: 'Is my payment information secure?',
      answer: 'Yes, all payment information is encrypted using industry-standard SSL technology. We do not store your full credit card details on our servers. Our payment processing complies with PCI DSS standards to ensure maximum security.'
    },
    {
      question: 'Do you offer financing options?',
      answer: 'Yes, we offer financing options through Affirm for qualified customers in the United States. This allows you to split your purchase into monthly payments. You can select this option during checkout to see if you qualify.'
    },
    {
      question: 'When will my credit card be charged?',
      answer: 'Your credit card will be authorized when you place your order but will only be charged when your order ships. For custom or pre-order items, a deposit may be required at the time of order.'
    }
  ],
  jewelry: [
    {
      question: 'Are your diamonds ethically sourced?',
      answer: 'Yes, all our diamonds are ethically sourced and comply with the Kimberley Process. We work exclusively with suppliers who adhere to responsible mining practices and can provide certification of origin upon request.'
    },
    {
      question: 'Do you offer jewelry appraisals?',
      answer: 'Yes, all fine jewelry pieces priced over $1,000 come with a complimentary appraisal certificate. For other pieces, appraisals can be requested for an additional fee of $50. Appraisals are conducted by certified gemologists.'
    },
    {
      question: 'Can I customize a piece of jewelry?',
      answer: 'Yes, we offer customization services for many of our pieces. Options include metal type, gemstone selection, engraving, and sizing. Please contact our customer service team to discuss your customization needs and associated costs.'
    },
    {
      question: 'What is the difference between 14K and 18K gold?',
      answer: '14K gold contains 58.3% pure gold, while 18K gold contains 75% pure gold. 18K gold has a richer color but is softer, while 14K gold is more durable and resistant to scratching, making it ideal for everyday wear.'
    }
  ],
  account: [
    {
      question: 'How do I create an account?',
      answer: 'You can create an account by clicking on the "Account" icon in the top navigation bar and selecting "Sign Up". You\'ll need to provide your email address and create a password. You can also create an account during the checkout process.'
    },
    {
      question: 'I forgot my password. How do I reset it?',
      answer: 'To reset your password, click on the "Account" icon, select "Sign In", and then click on "Forgot Password". Enter your email address, and we\'ll send you instructions to reset your password.'
    },
    {
      question: 'How do I update my account information?',
      answer: 'You can update your account information by logging in, navigating to "My Account", and selecting "Profile". Here you can edit your personal information, change your password, and manage your saved addresses and payment methods.'
    },
    {
      question: 'Can I save multiple shipping addresses?',
      answer: 'Yes, you can save multiple shipping addresses in your account. This is particularly useful if you frequently ship to different locations or want to send gifts directly to recipients.'
    }
  ],
  returns: [
    {
      id: 'return-policy',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items in their original, unworn condition with all tags and packaging intact. Custom pieces, engraved items, and final sale items cannot be returned. Returns are processed within 5-7 business days of receipt, with refunds issued to the original payment method.'
    },
    {
      question: 'How do I initiate a return?',
      answer: 'To initiate a return, log into your account, go to "Orders", select the order containing the item you wish to return, and click "Return Item". Follow the instructions to generate a return shipping label and packing slip. Alternatively, you can contact our customer service team for assistance.'
    },
    {
      question: 'Do you offer exchanges?',
      answer: 'Yes, we offer exchanges for different sizes or styles within 30 days of purchase. The exchange process is similar to returns – initiate the exchange through your account or contact customer service. If the exchanged item has a different price, you will be charged or refunded the difference.'
    },
    {
      question: 'Who pays for return shipping?',
      answer: 'For standard returns, customers are responsible for return shipping costs, which will be deducted from your refund. For exchanges and items received damaged or incorrect, we cover return shipping costs. We provide a prepaid return label for all returns, regardless of reason.'
    }
  ]
};

export default function FAQsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Help Center', href: '/help' },
          { label: 'FAQs', href: '/help/faqs', active: true },
        ]}
      />
      
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about our products and services"
      />
      
      {/* FAQ Tabs */}
      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-8">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="jewelry">Jewelry</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>
        
        {Object.entries(faqData).map(([category, questions]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {questions.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} id={faq.id}>
                  <AccordionTrigger className="text-left font-medium text-charcoal-800">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-charcoal-600">
                    <p>{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Still Have Questions */}
      <div className="mt-12 bg-cream-50 rounded-lg p-6 text-center">
        <h3 className="font-serif text-xl text-charcoal-800 mb-3">Still Have Questions?</h3>
        <p className="text-charcoal-600 mb-6 max-w-2xl mx-auto">
          If you couldn't find the answer you were looking for, our customer service team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            <Phone className="h-4 w-4 mr-2" />
            Call Us
          </a>
        </div>
      </div>
    </div>
  );
}