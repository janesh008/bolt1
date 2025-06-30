import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { formatCurrency } from '../../../lib/utils';

interface CategoryPerformanceProps {
  data: Array<{
    category: string;
    revenue: number;
    orders?: number;
    averagePrice?: number;
  }>;
  dataKey?: string;
  valueFormatter?: (value: number) => string;
}

const CategoryPerformance: React.FC<CategoryPerformanceProps> = ({ 
  data,
  dataKey = 'revenue',
  valueFormatter = (value) => formatCurrency(value)
}) => {
  // Colors for the bars
  const colors = ['#C6A050', '#D9B978', '#E9D5A9', '#F5E7CE', '#F9F5EC'];

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-gold-500 font-medium">
            {valueFormatter(payload[0].value)}
          </p>
          {payload[0].payload.orders && (
            <p className="text-blue-500">
              {payload[0].payload.orders} orders
            </p>
          )}
          {payload[0].payload.averagePrice && (
            <p className="text-green-500">
              Avg: {formatCurrency(payload[0].payload.averagePrice)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="category"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tickFormatter={(value) => valueFormatter(value).replace('₹', '')}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey={dataKey} 
          name={dataKey === 'revenue' ? 'Revenue' : 'Value'}
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CategoryPerformance;