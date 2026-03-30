"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const palette = ["#0f766e", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

export function ReductionBarChart({ data }: { data: { name: string; reduction: number }[] }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-panel">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">Temperature Reduction</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ea" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="reduction" fill="#0f766e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BudgetPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-panel">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">Budget Allocation</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} innerRadius={55} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ImpactComparisonChart({ data }: { data: { name: string; score: number }[] }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-panel">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">Impact Comparison</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ea" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={palette[index % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
