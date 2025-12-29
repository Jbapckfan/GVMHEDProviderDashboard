"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from './Card';

/**
 * DataVisualization - Interactive charts for data analysis
 */

interface DataVisualizationProps {
  data: any[];
  type?: 'line' | 'bar' | 'auto';
  title: string;
  description?: string;
}

export default function DataVisualization({ data, type = 'auto', title, description }: DataVisualizationProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Auto-detect chart type based on data structure
  const hasDate = data.some(item => item.date !== undefined);
  const hasCategory = data.some(item => item.category !== undefined);
  const chartType = type === 'auto' ? (hasDate ? 'line' : 'bar') : type;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0c] border border-white/[0.10] rounded-lg p-3 shadow-lg">
          <p className="text-[#EDEDEF] text-sm font-medium mb-1">
            {payload[0].payload.date || payload[0].payload.category}
          </p>
          <p className="text-[#5E6AD2] text-sm">
            Value: <span className="font-semibold">{payload[0].value?.toFixed(2)}</span>
          </p>
          {payload[0].payload.count && (
            <p className="text-[#8A8F98] text-xs mt-1">
              Count: {payload[0].payload.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="glass" className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-[#EDEDEF] mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-[#8A8F98]">{description}</p>
        )}
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                stroke="#8A8F98"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#8A8F98' }}
              />
              <YAxis
                stroke="#8A8F98"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#8A8F98' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#5E6AD2"
                strokeWidth={2}
                dot={{ fill: '#5E6AD2', r: 4 }}
                activeDot={{ r: 6, fill: '#6872D9' }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="category"
                stroke="#8A8F98"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#8A8F98' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#8A8F98"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#8A8F98' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#5E6AD2" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
