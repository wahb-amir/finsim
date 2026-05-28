"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl border p-3 text-[12px]"
        style={{
          background: "#161616",
          borderColor: "#2A2A2A",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div className="font-bold text-[#F5F5F5] mb-2">Round {label}</div>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-[#A1A1A1]">{entry.name}:</span>
            <span className="text-[#F5F5F5] font-semibold">
              ${entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function NetWorthChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        barCategoryGap="30%"
        barGap={3}
      >
        <CartesianGrid vertical={false} stroke="#1A1A1A" strokeDasharray="0" />
        <XAxis
          dataKey="round"
          tick={{ fill: "#6B6B6B", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          label={{ value: "Round", position: "insideBottom", offset: -2, fill: "#4A4A4A", fontSize: 10 }}
        />
        <YAxis
          tick={{ fill: "#6B6B6B", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#A1A1A1", paddingTop: "12px" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="player"
          name="Your Path"
          fill="#F59E0B"
          radius={[3, 3, 0, 0]}
          fillOpacity={0.85}
        />
        <Bar
          dataKey="optimal"
          name="Optimal Path"
          fill="#10B981"
          radius={[3, 3, 0, 0]}
          fillOpacity={0.5}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
