
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import Button from '../ui/Button';

interface Category {
  id: string;
  name: string;
}

interface MetalColor {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
  metalColors: MetalColor[];
  selectedMetalTypes: string[];
  setSelectedMetalTypes: (types: string[]) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedMetalColors: string[];
  setSelectedMetalColors: (colors: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  diamondWeightRange: [number, number];
  setDiamondWeightRange: (range: [number, number]) => void;
  clearFilters: () => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  metalColors,
  selectedMetalTypes,
  setSelectedMetalTypes,
  selectedCategories,
  setSelectedCategories,
  selectedMetalColors,
  setSelectedMetalColors,
  priceRange,
  setPriceRange,
  diamondWeightRange,
  setDiamondWeightRange,
  clearFilters,
  showFilters,
  setShowFilters
}) => {
  return (
    <aside className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
      <div className="bg-white rounded-lg shadow-soft p-6 sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-charcoal-800">Filters</h2>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>

        <div className="space-y-6">
          {/* Metal Type Filter */}
          <div>
            <h3 className="font-medium text-charcoal-800 mb-3">Metal Type</h3>
            <div className="space-y-2">
              {['Gold', 'Silver', 'Platinum'].map((metal) => (
                <label key={metal} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedMetalTypes.includes(metal)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMetalTypes([...selectedMetalTypes, metal]);
                      } else {
                        setSelectedMetalTypes(selectedMetalTypes.filter(m => m !== metal));
                      }
                    }}
                  />
                  <span className="text-sm text-charcoal-600">{metal}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="font-medium text-charcoal-800 mb-3">Category</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedCategories.includes(cat.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([...selectedCategories, cat.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                      }
                    }}
                  />
                  <span className="text-sm text-charcoal-600">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Metal Color Filter */}
          <div>
            <h3 className="font-medium text-charcoal-800 mb-3">Metal Color</h3>
            <div className="space-y-2">
              {metalColors.map((color) => (
                <label key={color.id} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedMetalColors.includes(color.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMetalColors([...selectedMetalColors, color.id]);
                      } else {
                        setSelectedMetalColors(selectedMetalColors.filter(c => c !== color.id));
                      }
                    }}
                  />
                  <span className="text-sm text-charcoal-600">{color.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-medium text-charcoal-800 mb-3">Price Range</h3>
            <div className="space-y-4">
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={10000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>₹{priceRange[0].toLocaleString()}</span>
                <span>₹{priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Diamond Weight Range */}
          <div>
            <h3 className="font-medium text-charcoal-800 mb-3">Diamond Weight (ct)</h3>
            <div className="space-y-4">
              <Slider
                value={diamondWeightRange}
                onValueChange={setDiamondWeightRange}
                max={5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>{diamondWeightRange[0]}ct</span>
                <span>{diamondWeightRange[1]}ct</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ProductFilters;