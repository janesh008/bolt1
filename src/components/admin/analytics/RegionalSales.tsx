import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency } from '../../../lib/utils';

interface RegionalSalesProps {
  data: Array<{
    region: string;
    revenue: number;
    orders?: number;
    customers?: number;
  }>;
  valueKey?: 'revenue' | 'orders' | 'customers';
}

const RegionalSales: React.FC<RegionalSalesProps> = ({ 
  data,
  valueKey = 'revenue'
}) => {
  // Colors for the pie slices
  const COLORS = ['#C6A050', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium text-gray-900">{item.region}</p>
          <p className="text-gold-500 font-medium">
            {formatCurrency(item.revenue)}
          </p>
          {item.orders && (
            <p className="text-blue-500">
              {item.orders} orders
            </p>
          )}
          {item.customers && (
            <p className="text-green-500">
              {item.customers} customers
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Format the data for the pie chart
  const pieData = data.map(item => ({
    ...item,
    value: item[valueKey]
  }));

  // Custom legend formatter
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          nameKey="region"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default RegionalSales;