"use client";

import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Label
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function DashboardCharts({ type, data }: { type: 'pie' | 'bar', data: Array<{ name: string; value: number; [key: string]: unknown }> }) {
  if (type === 'pie') {
    const total = data.reduce((acc, entry) => acc + entry.value, 0);
    return (
      <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              innerRadius={65}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <Label
                value={total.toString()}
                position="centerBottom"
                className="pie-label-value"
                style={{ fontSize: '1.75rem', fontWeight: 700, fill: '#1e293b' }}
                dy={-5}
              />
              <Label
                value="Total"
                position="centerTop"
                className="pie-label-text"
                style={{ fontSize: '0.75rem', fill: '#64748b' }}
                dy={15}
              />
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height: 300, width: '100%' }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            itemStyle={{ color: '#1e293b', fontWeight: 600 }}
          />
          <Bar dataKey="value" fill="url(#colorBlue)" radius={[4, 4, 0, 0]} maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
