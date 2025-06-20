import { Search } from 'lucide-react';
import { Input } from '../ui/input';

interface ProductSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative w-full md:w-96">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
      <Input
        type="text"
        placeholder="Search jewelry..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

export default ProductSearch;