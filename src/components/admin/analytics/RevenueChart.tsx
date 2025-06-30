import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../../lib/utils';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders?: number;
  }>;
  dataKey?: string;
  valueFormatter?: (value: number) => string;
  showOrders?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  dataKey = 'revenue',
  valueFormatter = (value) => formatCurrency(value),
  showOrders = false
}) => {
  // Format the date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch (error) {
      return dateStr;
    }
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium text-gray-900">{formatDate(label)}</p>
          <p className="text-gold-500 font-medium">
            {valueFormatter(payload[0].value)}
          </p>
          {showOrders && payload[1] && (
            <p className="text-blue-500">
              {payload[1].value} orders
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {showOrders ? (
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={(value) => valueFormatter(value).replace('₹', '')}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${value}`}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey={dataKey}
            name="Revenue"
            stroke="#C6A050"
            strokeWidth={2}
            dot={{ r: 4, fill: '#C6A050', stroke: '#C6A050' }}
            activeDot={{ r: 6, fill: '#C6A050', stroke: '#fff' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            name="Orders"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3B82F6', stroke: '#3B82F6' }}
            activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff' }}
          />
        </LineChart>
      ) : (
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
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
          <Line
            type="monotone"
            dataKey={dataKey}
            name={dataKey === 'revenue' ? 'Revenue' : 'Value'}
            stroke="#C6A050"
            strokeWidth={2}
            dot={{ r: 4, fill: '#C6A050', stroke: '#C6A050' }}
            activeDot={{ r: 6, fill: '#C6A050', stroke: '#fff' }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};

export default RevenueChart;