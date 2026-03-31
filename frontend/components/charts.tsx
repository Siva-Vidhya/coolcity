"use client";

import { useTheme } from "@/components/theme-provider";

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

const palette = ["#0EA5A4", "#22C55E", "#38BDF8", "#F59E0B", "#EF4444"];

export function ReductionBarChart({ data }: { data: { name: string; reduction: number }[] }) {
  const { resolvedTheme } = useTheme();
  const gridColor = resolvedTheme === "dark" ? "#334155" : "#dbe4ea";
  const tickColor = resolvedTheme === "dark" ? "#cbd5e1" : "#475569";
  const tooltipStyle = resolvedTheme === "dark" ? { backgroundColor: "#0f172a", borderColor: "#334155", color: "#e2e8f0" } : undefined;

  return (
    <div className="glass-card climate-hover rounded-[28px] bg-gradient-to-br from-white/92 via-white/80 to-cyan-50/70 p-5 dark:from-slate-900/90 dark:via-slate-900/82 dark:to-slate-800/75">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">Temperature Reduction</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="reduction" fill="#0EA5A4" radius={[8, 8, 0, 0]} animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BudgetPieChart({ data }: { data: { name: string; value: number }[] }) {
  const { resolvedTheme } = useTheme();
  const tooltipStyle = resolvedTheme === "dark" ? { backgroundColor: "#0f172a", borderColor: "#334155", color: "#e2e8f0" } : undefined;
  const legendStyle = { color: resolvedTheme === "dark" ? "#cbd5e1" : "#475569" };

  return (
    <div className="glass-card climate-hover rounded-[28px] bg-gradient-to-br from-white/92 via-white/80 to-cyan-50/70 p-5 dark:from-slate-900/90 dark:via-slate-900/82 dark:to-slate-800/75">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">Budget Allocation</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} innerRadius={55} paddingAngle={3} animationDuration={900}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ImpactComparisonChart({ data }: { data: { name: string; score: number }[] }) {
  const { resolvedTheme } = useTheme();
  const gridColor = resolvedTheme === "dark" ? "#334155" : "#dbe4ea";
  const tickColor = resolvedTheme === "dark" ? "#cbd5e1" : "#475569";
  const tooltipStyle = resolvedTheme === "dark" ? { backgroundColor: "#0f172a", borderColor: "#334155", color: "#e2e8f0" } : undefined;

  return (
    <div className="glass-card climate-hover rounded-[28px] bg-gradient-to-br from-white/92 via-white/80 to-cyan-50/70 p-5 dark:from-slate-900/90 dark:via-slate-900/82 dark:to-slate-800/75">
      <h3 className="mb-4 text-lg font-semibold text-slate-950">Impact Comparison</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: tickColor }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]} animationDuration={900}>
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
