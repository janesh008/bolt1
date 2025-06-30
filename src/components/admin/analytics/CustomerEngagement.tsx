import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

// Days of the week
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Hours of the day (24-hour format)
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CustomerEngagement: React.FC = () => {
  const [data, setData] = useState<Array<{ x: number; y: number; z: number }>>([]);

  useEffect(() => {
    // Generate mock data for the heatmap
    const mockData = [];
    
    // For each day of the week
    for (let day = 0; day < 7; day++) {
      // For each hour of the day
      for (let hour = 0; hour < 24; hour++) {
        // Generate a random value for engagement (higher during business hours)
        let value = Math.random() * 10;
        
        // Increase values during business hours (9am-6pm)
        if (hour >= 9 && hour <= 18 && day >= 1 && day <= 5) {
          value += Math.random() * 40 + 10;
        }
        
        // Increase values during weekend evenings
        if ((day === 0 || day === 6) && (hour >= 10 && hour <= 22)) {
          value += Math.random() * 30 + 5;
        }
        
        // Add data point
        mockData.push({
          x: hour,
          y: day,
          z: Math.round(value)
        });
      }
    }
    
    setData(mockData);
  }, []);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium text-gray-900">
            {DAYS[data.y]}, {data.x}:00
          </p>
          <p className="text-gold-500 font-medium">
            {data.z} active users
          </p>
        </div>
      );
    }
    return null;
  };

  // Format the x-axis (hours)
  const formatHour = (hour: number) => {
    return `${hour}:00`;
  };

  // Format the y-axis (days)
  const formatDay = (day: number) => {
    return DAYS[day];
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="x" 
          name="Hour" 
          type="number" 
          domain={[0, 23]}
          tickFormatter={formatHour}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
          ticks={[0, 4, 8, 12, 16, 20, 23]}
        />
        <YAxis 
          dataKey="y" 
          name="Day" 
          type="number"
          domain={[0, 6]}
          tickFormatter={formatDay}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <ZAxis 
          dataKey="z" 
          range={[50, 500]} 
          name="Engagement" 
        />
        <Tooltip content={<CustomTooltip />} />
        <Scatter 
          name="Customer Engagement" 
          data={data} 
          fill="#C6A050"
          shape="circle"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default CustomerEngagement;