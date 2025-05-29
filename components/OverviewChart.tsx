// components/OverviewChart.tsx
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

type Point = { date: string; users: number; reclamations: number };

export function OverviewChart({ data }: { data: Point[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => value} />
          <Legend verticalAlign="top" height={36} />
          <Line 
            type="monotone" 
            dataKey="users" 
            name="Utilisateurs" 
            stroke="#8884d8" 
          />
          <Line 
            type="monotone" 
            dataKey="reclamations" 
            name="Réclamations" 
            stroke="#82ca9d" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export default OverviewChart;
