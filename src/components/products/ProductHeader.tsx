interface ProductHeaderProps {
  category?: string;
  searchTerm: string;
  productCount: number;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ category, searchTerm, productCount }) => {
  const getTitle = () => {
    if (category) {
      return `${category.charAt(0).toUpperCase() + category.slice(1)} Jewelry`;
    }
    if (searchTerm) {
      return `Search Results for "${searchTerm}"`;
    }
    return 'All Jewelry';
  };

  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl text-charcoal-800">
        {getTitle()}
      </h1>
      <p className="mt-2 text-charcoal-500">
        {productCount} {productCount === 1 ? 'product' : 'products'} found
      </p>
    </div>
  );
};

export default ProductHeader;