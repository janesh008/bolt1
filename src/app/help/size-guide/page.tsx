import { Metadata } from 'next';
import Image from 'next/image';
import { Ruler, Download, Printer, Phone, Info } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/help/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Jewelry Size Guide | AXELS Luxury Jewelry',
  description: 'Find your perfect fit with our comprehensive jewelry sizing guide for rings, bracelets, necklaces, and more.',
};

export default function SizeGuidePage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Help Center', href: '/help' },
          { label: 'Size Guide', href: '/help/size-guide', active: true },
        ]}
      />
      
      <PageHeader
        title="Jewelry Size Guide"
        description="Find your perfect fit with our comprehensive sizing guide"
      />
      
      <div className="mt-8">
        <Tabs defaultValue="rings" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="rings">Rings</TabsTrigger>
            <TabsTrigger value="bracelets">Bracelets</TabsTrigger>
            <TabsTrigger value="necklaces">Necklaces</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rings" className="space-y-8">
            {/* Ring Size Introduction */}
            <section id="ring-sizing">
              <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
                <Ruler className="h-5 w-5 mr-2 text-gold-500" />
                How to Find Your Ring Size
              </h2>
              
              <div className="bg-cream-50 rounded-lg p-6">
                <p className="text-charcoal-600 mb-6">
                  Finding your correct ring size is essential for comfort and security. We offer several methods to determine your ring size accurately:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">Method 1: Measure a Ring You Already Own</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">1</div>
                        <div>
                          <p className="text-charcoal-600">Find a ring that fits the intended finger comfortably</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">2</div>
                        <div>
                          <p className="text-charcoal-600">Place the ring on a ruler and measure the inside diameter in millimeters</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">3</div>
                        <div>
                          <p className="text-charcoal-600">Use our ring size chart below to find your size</p>
                        </div>
                      </li>
                    </ol>
                    
                    <div className="mt-6 p-4 bg-white rounded-lg border border-cream-200">
                      <h4 className="font-medium text-charcoal-800 mb-2 text-sm">Pro Tip:</h4>
                      <p className="text-xs text-charcoal-600">
                        Measure multiple times on different days. Finger size can vary due to temperature, time of day, and other factors.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">Method 2: Use the Printable Ring Sizer</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">1</div>
                        <div>
                          <p className="text-charcoal-600">Download and print our ring sizer PDF (ensure it's printed at 100% scale)</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">2</div>
                        <div>
                          <p className="text-charcoal-600">Cut out the sizer and create a slit where indicated</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">3</div>
                        <div>
                          <p className="text-charcoal-600">Slip the pointed end through the slit to form a loop</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">4</div>
                        <div>
                          <p className="text-charcoal-600">Place the loop over your finger and pull tight</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">5</div>
                        <div>
                          <p className="text-charcoal-600">The number that lines up with the slit is your ring size</p>
                        </div>
                      </li>
                    </ol>
                    
                    <div className="mt-6 flex justify-center">
                      <a
                        href="/ring-sizer.pdf"
                        download
                        className="inline-flex items-center justify-center py-3 px-6 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Ring Sizer
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Ring Size Chart */}
            <section>
              <h2 className="font-serif text-xl text-charcoal-800 mb-4">Ring Size Conversion Chart</h2>
              
              <div className="bg-cream-50 rounded-lg p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-cream-200">
                    <thead>
                      <tr className="bg-gold-100">
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">US Size</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">UK Size</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">EU Size</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Diameter (mm)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Circumference (mm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">3</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">F</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">44</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">14.1</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">44.2</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">4</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">H</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">47</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">14.8</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">46.8</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">5</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">J 1/2</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">49</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">15.7</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">49.3</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">6</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">L 1/2</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">51/52</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">16.5</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">51.9</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">7</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">N 1/2</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">54/55</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">17.3</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">54.4</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">8</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">P 1/2</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">57/58</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">18.1</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">57.0</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">9</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">R 1/2</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">60</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">18.9</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">59.5</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">10</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">T 1/2</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">62</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">19.8</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">62.1</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">11</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">V 1/2</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">65</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">20.6</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">64.6</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">12</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">X 1/2</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">67</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">21.4</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">67.2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <a
                    href="/ring-size-chart.pdf"
                    download
                    className="inline-flex items-center justify-center py-3 px-6 bg-white border border-gold-400 text-gold-500 hover:bg-gold-50 rounded-md transition-colors"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Full Size Chart
                  </a>
                </div>
              </div>
            </section>
            
            {/* Ring Sizing Tips */}
            <section>
              <h2 className="font-serif text-xl text-charcoal-800 mb-4">Ring Sizing Tips</h2>
              
              <div className="bg-cream-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-charcoal-800">Consider the Width</h4>
                        <p className="text-sm text-charcoal-600 mt-1">
                          Wider bands tend to fit more snugly than narrow bands. If you're choosing a wide band (>6mm), consider going up a half size.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-charcoal-800">Temperature Matters</h4>
                        <p className="text-sm text-charcoal-600 mt-1">
                          Fingers tend to be smaller in cold weather and larger in hot weather or after physical activity. Measure when your body temperature is normal.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-charcoal-800">Dominant Hand</h4>
                        <p className="text-sm text-charcoal-600 mt-1">
                          The fingers on your dominant hand are typically slightly larger. Consider this when measuring for rings to be worn on your dominant hand.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-charcoal-800">Knuckle Size</h4>
                        <p className="text-sm text-charcoal-600 mt-1">
                          If your knuckle is significantly larger than the base of your finger, measure both and choose a size in between. The ring should slide over your knuckle with some resistance but fit comfortably at the base.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-charcoal-800">Stacked Rings</h4>
                        <p className="text-sm text-charcoal-600 mt-1">
                          If you plan to wear multiple rings on the same finger, you might need to go up a half size to accommodate them comfortably.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-charcoal-800">When in Doubt</h4>
                        <p className="text-sm text-charcoal-600 mt-1">
                          If you're between sizes, it's generally better to choose the larger size, especially for wider bands and rings with stones.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-gold-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-gold-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-charcoal-800">Resizing Services:</h4>
                      <p className="text-sm text-charcoal-600 mt-1">
                        AXELS offers one complimentary ring resizing within 60 days of purchase. After this period, resizing services are available for a fee. Note that some ring styles, particularly eternity bands or rings with stones all around, cannot be resized.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="bracelets" className="space-y-8">
            <section>
              <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
                <Ruler className="h-5 w-5 mr-2 text-gold-500" />
                How to Measure Your Wrist
              </h2>
              
              <div className="bg-cream-50 rounded-lg p-6">
                <p className="text-charcoal-600 mb-6">
                  Finding the right bracelet size ensures comfort and prevents loss. Follow these steps to measure your wrist accurately:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">Measuring Your Wrist</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">1</div>
                        <div>
                          <p className="text-charcoal-600">Use a flexible measuring tape or a strip of paper/string</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">2</div>
                        <div>
                          <p className="text-charcoal-600">Wrap it around your wrist just below the wrist bone</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">3</div>
                        <div>
                          <p className="text-charcoal-600">If using paper/string, mark where it overlaps and measure against a ruler</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">4</div>
                        <div>
                          <p className="text-charcoal-600">Add 1/2" to 1" (1.3-2.5cm) to your wrist measurement for comfort</p>
                          <p className="text-sm text-charcoal-500 mt-1">
                            • Add 1/2" (1.3cm) for a snug fit<br />
                            • Add 3/4" (2cm) for a comfortable fit<br />
                            • Add 1" (2.5cm) for a loose fit
                          </p>
                        </div>
                      </li>
                    </ol>
                    
                    <div className="mt-6 p-4 bg-white rounded-lg border border-cream-200">
                      <h4 className="font-medium text-charcoal-800 mb-2 text-sm">Example:</h4>
                      <p className="text-xs text-charcoal-600">
                        If your wrist measures 6.5 inches (16.5cm), a comfortable bracelet size would be 7.25-7.5 inches (18.5-19cm).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg border border-cream-200 max-w-xs">
                      <div className="aspect-square bg-cream-100 rounded-lg mb-4 flex items-center justify-center">
                        <svg className="h-24 w-24 text-gold-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <path d="M12 8v8M8 12h8" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-charcoal-800 text-center mb-2">Printable Bracelet Sizer</h4>
                      <p className="text-xs text-charcoal-600 text-center mb-4">
                        Download our printable bracelet sizer for an accurate measurement at home.
                      </p>
                      <a
                        href="/bracelet-sizer.pdf"
                        download
                        className="flex items-center justify-center py-2 px-4 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors text-sm w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Bracelet Size Chart */}
            <section>
              <h2 className="font-serif text-xl text-charcoal-800 mb-4">Bracelet Size Chart</h2>
              
              <div className="bg-cream-50 rounded-lg p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-cream-200">
                    <thead>
                      <tr className="bg-gold-100">
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Wrist Size</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Snug Fit</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Comfortable Fit</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-charcoal-800">Loose Fit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">5.5" (14cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">6" (15.2cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">6.25" (15.9cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">6.5" (16.5cm)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">6" (15.2cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">6.5" (16.5cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">6.75" (17.1cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">7" (17.8cm)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">6.5" (16.5cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">7" (17.8cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">7.25" (18.4cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">7.5" (19.1cm)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">7" (17.8cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">7.5" (19.1cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">7.75" (19.7cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">8" (20.3cm)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">7.5" (19.1cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">8" (20.3cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">8.25" (21cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">8.5" (21.6cm)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-charcoal-800">8" (20.3cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">8.5" (21.6cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">8.75" (22.2cm)</td>
                        <td className="px-4 py-3 text-sm text-charcoal-600">9" (22.9cm)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 p-4 bg-gold-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-gold-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-charcoal-800">Bracelet Style Considerations:</h4>
                      <p className="text-sm text-charcoal-600 mt-1">
                        Different bracelet styles may require different fits:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm mt-2">
                        <li>Bangles typically need to fit over the widest part of your hand</li>
                        <li>Tennis bracelets should be slightly loose but not rotate around the wrist</li>
                        <li>Cuff bracelets are sized smaller than their actual measurement since they have an opening</li>
                        <li>Chain bracelets often include an extension chain for adjustable length</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Bangle Sizing */}
            <section>
              <h2 className="font-serif text-xl text-charcoal-800 mb-4">Bangle Sizing</h2>
              
              <div className="bg-cream-50 rounded-lg p-6">
                <p className="text-charcoal-600 mb-6">
                  Bangles need to fit over the widest part of your hand while still being comfortable on your wrist. Here's how to find your bangle size:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">Measuring for Bangles</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">1</div>
                        <div>
                          <p className="text-charcoal-600">Make a "stop sign" with your hand (fingers together, thumb against palm)</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">2</div>
                        <div>
                          <p className="text-charcoal-600">Measure the circumference of your hand at its widest point (typically across the knuckles)</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">3</div>
                        <div>
                          <p className="text-charcoal-600">Use the chart to determine your bangle size</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">Bangle Size Chart</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-cream-200">
                        <thead>
                          <tr className="bg-gold-100">
                            <th className="px-4 py-2 text-left text-xs font-medium text-charcoal-800">Size</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-charcoal-800">Hand Circumference</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-charcoal-800">Bangle Diameter</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                          <tr>
                            <td className="px-4 py-2 text-xs text-charcoal-800">Small</td>
                            <td className="px-4 py-2 text-xs text-charcoal-600">6-7" (15-18cm)</td>
                            <td className="px-4 py-2 text-xs text-charcoal-600">2.5" (6.4cm)</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-xs text-charcoal-800">Medium</td>
                            <td className="px-4 py-2 text-xs text-charcoal-600">7-7.5" (18-19cm)</td>
                            <td className="px-4 py-2 text-xs text-charcoal-600">2.6" (6.7cm)</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-xs text-charcoal-800">Large</td>
                            <td className="px-4 py-2 text-xs text-charcoal-600">7.5-8" (19-20.5cm)</td>
                            <td className="px-4 py-2 text-xs text-charcoal-600">2.75" (7cm)</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-xs text-charcoal-800">Extra Large</td>
                            <td className="px-4 py-2 text-xs text-charcoal-600">8-8.5" (20.5-22cm)</td>
                            <td className="px-4 py-2 text-xs text-charcoal-600">3" (7.6cm)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="necklaces" className="space-y-8">
            <section>
              <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
                <Ruler className="h-5 w-5 mr-2 text-gold-500" />
                Necklace Length Guide
              </h2>
              
              <div className="bg-cream-50 rounded-lg p-6">
                <p className="text-charcoal-600 mb-6">
                  Necklace length is a key factor in how a piece looks and feels. The right length depends on your neck size, face shape, and the intended style.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">How to Measure</h3>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">1</div>
                        <div>
                          <p className="text-charcoal-600">Use a soft measuring tape or string</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">2</div>
                        <div>
                          <p className="text-charcoal-600">Measure around the base of your neck where a collar would sit</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">3</div>
                        <div>
                          <p className="text-charcoal-600">Add 2-4 inches (5-10cm) to this measurement for a comfortable fit</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-500 font-medium flex-shrink-0">4</div>
                        <div>
                          <p className="text-charcoal-600">For a specific style (choker, princess, etc.), refer to the chart</p>
                        </div>
                      </li>
                    </ol>
                    
                    <div className="mt-6 p-4 bg-white rounded-lg border border-cream-200">
                      <h4 className="font-medium text-charcoal-800 mb-2 text-sm">Pro Tip:</h4>
                      <p className="text-xs text-charcoal-600">
                        If you're between sizes or unsure, choose an adjustable necklace or one with an extension chain for versatility.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">Standard Necklace Lengths</h3>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Choker: 14-16" (35-40cm)</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Sits tightly around the neck. Best for slender or long necks.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Princess: 17-19" (43-48cm)</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          The most common length, sits at or just below the collarbone. Flattering for most neck types.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Matinee: 20-24" (50-61cm)</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Falls between the collarbone and the bust. Good for both casual and formal wear.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Opera: 28-36" (71-91cm)</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Reaches the breastbone or below. Can be worn as a single strand or doubled.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Rope: 36"+ (91cm+)</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Falls below the waist. Versatile for multiple wrapping or knotting.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Necklace Style Guide */}
            <section>
              <h2 className="font-serif text-xl text-charcoal-800 mb-4">Necklace Style Guide</h2>
              
              <div className="bg-cream-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">Choosing by Face Shape</h3>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Oval Face</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Most necklace lengths work well. Chokers and princess lengths highlight a graceful neck.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Round Face</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          V-shaped or Y necklaces create a slimming, elongating effect. Princess or matinee lengths work well.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Square Face</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Rounded or curved necklaces soften angular features. Chokers and shorter necklaces complement a strong jawline.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Heart-Shaped Face</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Chokers and princess lengths balance a narrower chin. Avoid very short necklaces that emphasize a wider forehead.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Long Face</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Chokers and collar-length necklaces create width. Avoid long pendants that further elongate the face.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-charcoal-800 mb-4">Choosing by Neckline</h3>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Crew Neck</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Choose princess or matinee lengths that fall below the neckline, or very short chokers that sit above it.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">V-Neck</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          V-shaped pendants or Y-necklaces that echo the neckline. Princess length works well.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Turtleneck</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Long pendants (matinee or opera length) or no necklace at all. Avoid chokers.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Boat Neck</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Long necklaces that break the horizontal line. Opera or rope lengths work well.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-cream-200">
                        <h4 className="font-medium text-charcoal-800 text-sm">Strapless/Off-Shoulder</h4>
                        <p className="text-xs text-charcoal-600 mt-1">
                          Chokers or collar necklaces that highlight the neck and shoulders. Avoid princess lengths that compete with the neckline.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-center">
                  <a
                    href="/necklace-guide.pdf"
                    download
                    className="inline-flex items-center justify-center py-3 px-6 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Complete Necklace Guide
                  </a>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Need Help */}
      <section className="mt-12">
        <div className="bg-gradient-to-r from-gold-100 to-cream-100 rounded-lg p-6 md:p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-2xl text-charcoal-800 mb-4">Need Personalized Sizing Help?</h2>
            <p className="text-charcoal-600 mb-6">
              Our jewelry experts are available to help you find the perfect fit for any piece in our collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/help/contact-us"
                className="inline-flex items-center justify-center py-3 px-6 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors"
              >
                Contact Us
              </a>
              <a
                href="https://wa.me/18001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center py-3 px-6 bg-white border border-gold-400 text-gold-500 hover:bg-gold-50 rounded-md transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}