import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

interface TopProductsProps {
  products: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
    category: string;
    inStock: number;
  }>;
  showStock?: boolean;
}

const TopProducts: React.FC<TopProductsProps> = ({ products, showStock = false }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {showStock ? 'Stock Level' : 'Revenue'}
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {showStock ? 'Status' : 'Quantity'}
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trend
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {product.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {showStock ? (
                  <span>{product.inStock} units</span>
                ) : (
                  <span className="text-gold-600">{formatCurrency(product.revenue)}</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {showStock ? (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.inStock === 0 
                      ? 'bg-red-100 text-red-800' 
                      : product.inStock < 10 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {product.inStock === 0 
                      ? 'Out of Stock' 
                      : product.inStock < 10 
                        ? 'Low Stock' 
                        : 'In Stock'}
                  </span>
                ) : (
                  <span>{product.quantity} sold</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {Math.random() > 0.5 ? (
                  <span className="text-green-600 flex items-center justify-end">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    {Math.floor(Math.random() * 20) + 1}%
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center justify-end">
                    <ArrowDown className="h-4 w-4 mr-1" />
                    {Math.floor(Math.random() * 20) + 1}%
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopProducts;