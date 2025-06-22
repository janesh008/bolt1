import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

interface ProductCarouselProps {
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addToCart } = useCart();
  
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === products.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? products.length - 1 : prevIndex - 1
    );
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
    toast.success(`Added ${product.name} to cart`);
  };
  
  if (!products.length) return null;
  
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
        <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {products.map((product) => (
            <div key={product.id} className="min-w-full">
              <div className="flex flex-col sm:flex-row gap-4 p-2">
                <div className="w-full sm:w-24 h-24 bg-cream-100 rounded-lg overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-charcoal-800">{product.name}</h4>
                  <p className="text-gold-500 font-medium">{formatCurrency(product.price)}</p>
                  {product.description && (
                    <p className="text-sm text-charcoal-500 line-clamp-2 mt-1">{product.description}</p>
                  )}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-2 flex items-center text-sm text-gold-500 hover:text-gold-600 transition-colors"
                  >
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {products.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-1 bg-white rounded-full shadow-md text-charcoal-600 hover:text-gold-500 transition-colors"
            aria-label="Previous product"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-white rounded-full shadow-md text-charcoal-600 hover:text-gold-500 transition-colors"
            aria-label="Next product"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-1">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gold-500' : 'bg-cream-200'
                }`}
                aria-label={`Go to product ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductCarousel;