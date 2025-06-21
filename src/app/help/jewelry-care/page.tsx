import { Metadata } from 'next';
import { Heart, Droplet, Sun, Sparkles, AlertTriangle, Info } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/help/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Jewelry Care Guide | AXELS Luxury Jewelry',
  description: 'Learn how to properly care for and maintain your fine jewelry to ensure its beauty and longevity for generations to come.',
};

export default function JewelryCarePage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Help Center', href: '/help' },
          { label: 'Jewelry Care', href: '/help/jewelry-care', active: true },
        ]}
      />
      
      <PageHeader
        title="Jewelry Care Guide"
        description="Proper care ensures your precious jewelry remains beautiful for generations"
      />
      
      <Tabs defaultValue="general" className="mt-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="general">General Care</TabsTrigger>
          <TabsTrigger value="gold">Gold Jewelry</TabsTrigger>
          <TabsTrigger value="silver">Silver Jewelry</TabsTrigger>
          <TabsTrigger value="gemstones">Gemstones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-8">
          {/* Daily Care */}
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-gold-500" />
              Daily Jewelry Care
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-6">
                Proper daily care is essential for maintaining the beauty and integrity of your fine jewelry. Follow these guidelines to keep your pieces looking their best:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">When to Remove Your Jewelry</h3>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Before showering or bathing</li>
                      <li>Before swimming in pools, hot tubs, or ocean</li>
                      <li>Before applying lotions, perfumes, or cosmetics</li>
                      <li>Before household cleaning or gardening</li>
                      <li>Before exercising or playing sports</li>
                      <li>Before sleeping (especially necklaces and earrings)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Proper Storage</h3>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Store pieces individually in soft pouches or lined jewelry boxes</li>
                      <li>Keep chains fastened to prevent tangling</li>
                      <li>Store rings in ring slots or separate compartments</li>
                      <li>Keep jewelry away from direct sunlight and heat</li>
                      <li>Store in a cool, dry place to prevent tarnishing</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Regular Maintenance</h3>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Gently wipe pieces after wearing with a soft, lint-free cloth</li>
                      <li>Inspect settings regularly for loose stones</li>
                      <li>Check clasps and closures for wear or damage</li>
                      <li>Have professional cleaning done 1-2 times per year</li>
                      <li>Have prongs and settings checked annually</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Handling Tips</h3>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Always handle jewelry by the band or edges, not by gemstones</li>
                      <li>Put on jewelry after applying makeup and hairspray</li>
                      <li>Remove jewelry before applying hand sanitizer</li>
                      <li>Take off rings when washing hands to prevent soap buildup</li>
                      <li>Put on and remove jewelry over soft surfaces</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gold-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-gold-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-charcoal-800">Important Note:</h4>
                    <p className="text-sm text-charcoal-600 mt-1">
                      Different types of jewelry require specific care. Always follow the care instructions provided with your purchase, and when in doubt, consult with our jewelry experts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Cleaning at Home */}
          <section id="cleaning">
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-gold-500" />
              Cleaning Your Jewelry at Home
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-6">
                Regular cleaning helps maintain the brilliance and beauty of your jewelry. Here are safe methods for cleaning different types of jewelry at home:
              </p>
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-3">Basic Cleaning Solution</h3>
                  <p className="text-charcoal-600 mb-3">
                    For most gold and diamond jewelry without delicate gemstones:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-charcoal-600">
                    <li>Mix a few drops of mild dish soap in warm (not hot) water</li>
                    <li>Soak the piece for 20-30 minutes</li>
                    <li>Gently brush with a soft toothbrush, focusing on settings and crevices</li>
                    <li>Rinse thoroughly under running water (use a strainer in the sink to prevent loss)</li>
                    <li>Pat dry with a soft, lint-free cloth</li>
                    <li>Allow to air dry completely before storing</li>
                  </ol>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-3">Ultrasonic Cleaners</h3>
                  <p className="text-charcoal-600 mb-3">
                    Home ultrasonic cleaners can be effective but should be used with caution:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600">
                    <li>Suitable for diamond, sapphire, and ruby jewelry without cracks</li>
                    <li>NOT recommended for emeralds, opals, pearls, or any treated gemstones</li>
                    <li>NOT recommended for jewelry with loose stones or damaged settings</li>
                    <li>Follow the manufacturer's instructions carefully</li>
                    <li>Use only jewelry-specific cleaning solutions</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-3">Polishing Cloths</h3>
                  <p className="text-charcoal-600 mb-3">
                    Specialized jewelry polishing cloths are excellent for:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600">
                    <li>Quick cleaning and shine restoration</li>
                    <li>Removing light tarnish from silver</li>
                    <li>Maintaining gold's luster between deep cleanings</li>
                    <li>Safe for most gemstones (avoid using on pearls or very soft stones)</li>
                  </ul>
                  <p className="text-sm text-charcoal-500 mt-3">
                    Note: Many polishing cloths contain mild cleaning agents, so wash hands after use.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-charcoal-800">Never Use:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm mt-2">
                      <li>Bleach, chlorine, or other harsh chemicals</li>
                      <li>Abrasive cleaners or toothpaste</li>
                      <li>Paper towels (they can scratch metal surfaces)</li>
                      <li>Boiling water or extreme heat</li>
                      <li>Commercial silver dips on pieces with gemstones</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Professional Care */}
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-gold-500" />
              Professional Jewelry Care
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-6">
                While regular at-home care is important, professional servicing ensures the longevity and safety of your fine jewelry.
              </p>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-2">When to Seek Professional Care</h3>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600">
                    <li>When stones appear loose or settings are damaged</li>
                    <li>When clasps or closures aren't functioning properly</li>
                    <li>For deep cleaning (recommended 1-2 times per year)</li>
                    <li>For replating white gold pieces that have yellowed</li>
                    <li>For resizing rings or adjusting bracelet lengths</li>
                    <li>For restringing pearl necklaces (every 2-3 years if worn regularly)</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-2">Our Professional Services</h3>
                  <p className="text-charcoal-600 mb-3">
                    AXELS offers comprehensive care services for all jewelry, whether purchased from us or elsewhere:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600">
                    <li>Professional ultrasonic and steam cleaning</li>
                    <li>Prong re-tipping and stone tightening</li>
                    <li>Chain soldering and clasp replacement</li>
                    <li>White gold rhodium replating</li>
                    <li>Ring resizing and bracelet adjustment</li>
                    <li>Pearl restringing and knotting</li>
                    <li>Comprehensive jewelry inspection and appraisal</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-2">Maintenance Schedule</h3>
                  <p className="text-charcoal-600 mb-3">
                    Recommended professional maintenance schedule for fine jewelry:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600">
                    <li><strong>Every 6 months:</strong> Professional cleaning and inspection for frequently worn pieces</li>
                    <li><strong>Annually:</strong> Thorough inspection of prongs and settings</li>
                    <li><strong>Every 1-2 years:</strong> Rhodium replating for white gold (depending on wear)</li>
                    <li><strong>Every 2-3 years:</strong> Pearl restringing (if worn regularly)</li>
                    <li><strong>Every 5 years:</strong> Updated insurance appraisal for valuable pieces</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <a
                  href="/help/contact-us"
                  className="inline-flex items-center justify-center py-3 px-6 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors"
                >
                  Schedule a Professional Cleaning
                </a>
              </div>
            </div>
          </section>
        </TabsContent>
        
        <TabsContent value="gold" className="space-y-8">
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-gold-500" />
              Gold Jewelry Care
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-6">
                Gold jewelry is durable but requires proper care to maintain its luster and prevent damage. Different gold purities (10K, 14K, 18K) and colors (yellow, white, rose) may require slightly different care approaches.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Daily Care for Gold</h3>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Remove gold jewelry before showering, swimming, or exercising</li>
                      <li>Keep away from chlorine, which can damage gold alloys</li>
                      <li>Remove before applying lotions, perfumes, or cosmetics</li>
                      <li>Wipe with a soft cloth after wearing to remove oils and perspiration</li>
                      <li>Store in a fabric-lined jewelry box or pouch</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Cleaning Gold Jewelry</h3>
                    <ol className="list-decimal pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Mix a few drops of mild dish soap in warm water</li>
                      <li>Soak the gold piece for 15-20 minutes</li>
                      <li>Gently brush with a soft toothbrush, focusing on crevices</li>
                      <li>Rinse thoroughly in warm water</li>
                      <li>Pat dry with a soft, lint-free cloth</li>
                      <li>Allow to air dry completely before storing</li>
                    </ol>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">White Gold Care</h3>
                    <p className="text-charcoal-600 text-sm mb-3">
                      White gold is typically plated with rhodium to enhance its white appearance. Over time, this plating may wear off, revealing the slightly yellowish gold underneath.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Follow the same cleaning procedures as yellow gold</li>
                      <li>Be extra careful with lotions and chemicals, which can accelerate rhodium wear</li>
                      <li>Have white gold pieces replated with rhodium every 1-2 years (depending on wear)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Rose Gold Care</h3>
                    <p className="text-charcoal-600 text-sm mb-3">
                      Rose gold contains a higher percentage of copper, giving it its distinctive pink hue. It's generally more durable than yellow or white gold but can still benefit from proper care.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Follow the same cleaning procedures as yellow gold</li>
                      <li>Rose gold may develop a slightly darker patina over time, which many consider desirable</li>
                      <li>If you prefer the original color, professional polishing can restore it</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gold-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-gold-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-charcoal-800">Gold Purity Facts:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm mt-2">
                      <li><strong>24K Gold (99.9% pure):</strong> Too soft for everyday jewelry, rarely used except in some cultural contexts</li>
                      <li><strong>18K Gold (75% pure):</strong> Luxurious with rich color, softer than lower karats, ideal for special occasion pieces</li>
                      <li><strong>14K Gold (58.3% pure):</strong> Excellent balance of purity and durability, ideal for everyday wear</li>
                      <li><strong>10K Gold (41.7% pure):</strong> Most durable, but less vibrant in color, good for active lifestyles</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
        
        <TabsContent value="silver" className="space-y-8">
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-gold-500" />
              Silver Jewelry Care
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-6">
                Sterling silver (92.5% silver, 7.5% other metals) is beautiful but prone to tarnishing when exposed to air and sulfur compounds. Proper care can minimize tarnish and keep your silver jewelry looking its best.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Preventing Tarnish</h3>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Wear your silver jewelry regularly - natural oils help prevent tarnish</li>
                      <li>Remove before swimming, bathing, or using household chemicals</li>
                      <li>Keep away from rubber, latex, and wool, which contain sulfur</li>
                      <li>Store in anti-tarnish bags or cloth when not wearing</li>
                      <li>Place silica gel packets near stored silver to absorb moisture</li>
                      <li>Avoid storing in bathrooms where humidity is high</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Cleaning Tarnished Silver</h3>
                    <p className="text-charcoal-600 text-sm mb-3">
                      For lightly tarnished pieces:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Use a silver polishing cloth (specially treated to remove tarnish)</li>
                      <li>Gently rub the surface until tarnish is removed</li>
                      <li>Avoid using paper towels or tissues, which can scratch</li>
                    </ol>
                    
                    <p className="text-charcoal-600 text-sm mt-4 mb-3">
                      For moderately tarnished pieces:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Mix mild dish soap with warm water</li>
                      <li>Soak for 5-10 minutes</li>
                      <li>Gently brush with a soft toothbrush</li>
                      <li>Rinse thoroughly and dry completely</li>
                    </ol>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Homemade Silver Cleaning Solution</h3>
                    <p className="text-charcoal-600 text-sm mb-3">
                      For heavily tarnished pieces without gemstones:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Line a bowl with aluminum foil, shiny side up</li>
                      <li>Place silver pieces on the foil, ensuring they touch the foil</li>
                      <li>Add 1 tablespoon of baking soda and 1 tablespoon of salt</li>
                      <li>Pour in enough hot water to cover the items</li>
                      <li>The tarnish will transfer to the foil through a chemical reaction</li>
                      <li>After 5-10 minutes, remove, rinse thoroughly, and dry</li>
                    </ol>
                    <p className="text-sm text-red-600 mt-3">
                      <strong>Important:</strong> Do NOT use this method on silver with gemstones, pearls, or oxidized/antiqued finishes.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-cream-200">
                    <h3 className="font-medium text-charcoal-800 mb-2">Professional Silver Care</h3>
                    <p className="text-charcoal-600 text-sm mb-3">
                      Consider professional cleaning for:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                      <li>Valuable or antique silver pieces</li>
                      <li>Silver with gemstones or pearls</li>
                      <li>Heavily tarnished items</li>
                      <li>Silver with intricate details or filigree work</li>
                      <li>Items with oxidized or antiqued finishes</li>
                    </ul>
                    <p className="text-charcoal-600 text-sm mt-3">
                      AXELS offers professional silver cleaning and polishing services to restore your pieces to their original beauty.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gold-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-gold-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-charcoal-800">About Silver Tarnish:</h4>
                    <p className="text-sm text-charcoal-600 mt-1">
                      Tarnish is a natural reaction between silver and sulfur-containing substances in the air. It appears as a darkening or discoloration on the surface. While tarnish can be removed, excessive cleaning can wear down the silver over time. Some artisanal silver pieces intentionally feature oxidized (darkened) areas to highlight design details - these should not be polished away.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
        
        <TabsContent value="gemstones" className="space-y-8">
          <section>
            <h2 className="font-serif text-xl text-charcoal-800 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-gold-500" />
              Gemstone Care
            </h2>
            
            <div className="bg-cream-50 rounded-lg p-6">
              <p className="text-charcoal-600 mb-6">
                Different gemstones have varying levels of hardness and durability, requiring specific care approaches. The Mohs scale of mineral hardness (1-10) helps determine how delicate a gemstone is - diamonds (10) are the hardest, while pearls (2.5-4.5) are among the softest.
              </p>
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-3">Diamonds</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Hardness: 10</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Durability: Excellent</span>
                  </div>
                  <p className="text-charcoal-600 text-sm mb-3">
                    While diamonds are extremely hard, they can still chip if struck at the right angle and can attract grease and oil.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                    <li>Clean with mild dish soap, warm water, and a soft toothbrush</li>
                    <li>Safe to use ultrasonic and steam cleaners (unless the diamond has been treated or has inclusions)</li>
                    <li>Avoid contact with chlorine bleach, which can damage the setting</li>
                    <li>Store separately to prevent scratching other jewelry</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-3">Sapphires & Rubies</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Hardness: 9</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Durability: Excellent</span>
                  </div>
                  <p className="text-charcoal-600 text-sm mb-3">
                    Sapphires and rubies are both varieties of corundum and are very durable for everyday wear.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                    <li>Clean with mild dish soap, warm water, and a soft toothbrush</li>
                    <li>Generally safe for ultrasonic cleaners (except for treated stones)</li>
                    <li>Avoid high heat and sudden temperature changes</li>
                    <li>Avoid exposure to harsh chemicals</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-3">Emeralds</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Hardness: 7.5-8</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Durability: Good but Brittle</span>
                  </div>
                  <p className="text-charcoal-600 text-sm mb-3">
                    Emeralds are relatively hard but often contain inclusions and fissures that can make them brittle. Most emeralds are treated with oils or resins to improve appearance.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                    <li>Clean only with a soft, damp cloth</li>
                    <li>Avoid soaking in water, which can remove treatment oils</li>
                    <li>Never use ultrasonic or steam cleaners</li>
                    <li>Avoid exposure to heat, harsh chemicals, and oils</li>
                    <li>Professional cleaning recommended every 1-2 years</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-3">Pearls</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Hardness: 2.5-4.5</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Durability: Delicate</span>
                  </div>
                  <p className="text-charcoal-600 text-sm mb-3">
                    Pearls are organic gems that require special care to maintain their luster and prevent damage.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-sm">
                    <li>Wipe with a soft, slightly damp cloth after each wear</li>
                    <li>Never soak pearls or use ultrasonic cleaners</li>
                    <li>Apply perfume, hairspray, and cosmetics before putting on pearls</li>
                    <li>Store flat to prevent stretching the string</li>
                    <li>Restring pearl necklaces every 2-3 years if worn regularly</li>
                    <li>Avoid heat and direct sunlight, which can cause pearls to dry out and crack</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-5 border border-cream-200">
                  <h3 className="font-medium text-charcoal-800 mb-3">Other Popular Gemstones</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-charcoal-700 mb-1">Amethyst, Citrine, Topaz (Hardness: 7-8)</h4>
                      <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-xs">
                        <li>Clean with mild soap and water</li>
                        <li>Avoid prolonged sunlight (can fade color)</li>
                        <li>Avoid high heat and sudden temperature changes</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-charcoal-700 mb-1">Opal (Hardness: 5.5-6.5)</h4>
                      <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-xs">
                        <li>Clean with a soft, damp cloth only</li>
                        <li>Never use ultrasonic cleaners or soak in water</li>
                        <li>Avoid heat and dry conditions (can cause cracking)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-charcoal-700 mb-1">Turquoise (Hardness: 5-6)</h4>
                      <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-xs">
                        <li>Wipe with a soft, dry cloth only</li>
                        <li>Avoid water and all cleaning solutions</li>
                        <li>Avoid oils, perfumes, and cosmetics</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-charcoal-700 mb-1">Tanzanite (Hardness: 6.5-7)</h4>
                      <ul className="list-disc pl-5 space-y-1 text-charcoal-600 text-xs">
                        <li>Clean with mild soap and lukewarm water</li>
                        <li>Avoid ultrasonic cleaners</li>
                        <li>Protect from impacts and scratches</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gold-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-gold-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-charcoal-800">When in Doubt:</h4>
                    <p className="text-sm text-charcoal-600 mt-1">
                      If you're unsure about how to clean a particular gemstone, the safest approach is to use a soft, slightly damp cloth and gentle patting motions. For valuable or delicate pieces, professional cleaning is always the safest option. AXELS offers complimentary cleaning services for all jewelry purchased from us.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
      
      {/* Recommended Products */}
      <section className="mt-12">
        <h2 className="font-serif text-xl text-charcoal-800 mb-6">Recommended Jewelry Care Products</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg overflow-hidden shadow-soft">
            <div className="aspect-square bg-cream-100 flex items-center justify-center">
              <Droplet className="h-12 w-12 text-gold-300" />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-charcoal-800">AXELS Jewelry Cleaning Solution</h3>
              <p className="text-sm text-charcoal-500 mt-1">Gentle formula safe for most fine jewelry</p>
              <p className="font-medium text-gold-500 mt-2">$18.00</p>
              <button className="w-full mt-3 py-2 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden shadow-soft">
            <div className="aspect-square bg-cream-100 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-gold-300" />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-charcoal-800">Dual-Sided Polishing Cloth</h3>
              <p className="text-sm text-charcoal-500 mt-1">For gold, silver, and platinum jewelry</p>
              <p className="font-medium text-gold-500 mt-2">$12.00</p>
              <button className="w-full mt-3 py-2 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden shadow-soft">
            <div className="aspect-square bg-cream-100 flex items-center justify-center">
              <svg className="h-12 w-12 text-gold-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-charcoal-800">Anti-Tarnish Storage Pouches</h3>
              <p className="text-sm text-charcoal-500 mt-1">Set of 5 pouches in various sizes</p>
              <p className="font-medium text-gold-500 mt-2">$24.00</p>
              <button className="w-full mt-3 py-2 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden shadow-soft">
            <div className="aspect-square bg-cream-100 flex items-center justify-center">
              <svg className="h-12 w-12 text-gold-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-charcoal-800">Jewelry Care Kit</h3>
              <p className="text-sm text-charcoal-500 mt-1">Complete set with cleaner, cloth, brush, and tray</p>
              <p className="font-medium text-gold-500 mt-2">$45.00</p>
              <button className="w-full mt-3 py-2 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Care Services */}
      <section className="mt-12">
        <div className="bg-gradient-to-r from-gold-100 to-cream-100 rounded-lg p-6 md:p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-2xl text-charcoal-800 mb-4">Professional Jewelry Care Services</h2>
            <p className="text-charcoal-600 mb-6">
              AXELS offers comprehensive professional cleaning and maintenance services to keep your jewelry looking its best.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/help/contact-us"
                className="inline-flex items-center justify-center py-3 px-6 bg-gold-400 hover:bg-gold-500 text-white rounded-md transition-colors"
              >
                Schedule a Service
              </a>
              <a
                href="/help/faqs#jewelry-care"
                className="inline-flex items-center justify-center py-3 px-6 bg-white border border-gold-400 text-gold-500 hover:bg-gold-50 rounded-md transition-colors"
              >
                Care FAQs
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}