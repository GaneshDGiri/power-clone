import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#0078d4', '#00bcf2', '#004e8c', '#5c2d91', '#e81123', '#ffb900'];

const DynamicChart = ({ type, data }) => {
  if (!data || data.length === 0) return <p className="text-gray-500 text-center py-10">No Data</p>;

  // 1. KPI Card (Single Big Number)
  if (type === 'kpi') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-5xl font-bold text-[#0078d4]">{data[0].value.toLocaleString()}</h1>
        <p className="text-gray-500 mt-2 font-medium">Total Value</p>
      </div>
    );
  }

  // Common Configuration for Charts
  const ChartContainer = ({ children }) => (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  );

  // 2. Pie / Donut Chart (Circle Percentage)
  if (type === 'pie') {
    return (
      <ChartContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60} // Makes it a Donut
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Legend />
        </PieChart>
      </ChartContainer>
    );
  }

  // 3. Bar Chart
  if (type === 'bar') {
    return (
      <ChartContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: '#f3f2f1' }} formatter={(value) => value.toLocaleString()} />
          <Bar dataKey="value" fill="#0078d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    );
  }

  // 4. Line Chart
  if (type === 'line') {
    return (
      <ChartContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Line type="monotone" dataKey="value" stroke="#0078d4" strokeWidth={3} dot={{r:4, fill:'#0078d4'}} />
        </LineChart>
      </ChartContainer>
    );
  }

  return null;
};

export default DynamicChart;