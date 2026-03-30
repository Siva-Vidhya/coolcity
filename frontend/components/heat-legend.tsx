const legend = [
  { label: "High Heat", dot: "bg-heat-high", badge: "border-red-200 bg-red-50/80 text-red-700" },
  { label: "Medium Heat", dot: "bg-heat-medium", badge: "border-amber-200 bg-amber-50/85 text-amber-700" },
  { label: "Low Heat", dot: "bg-heat-low", badge: "border-emerald-200 bg-emerald-50/85 text-emerald-700" }
];

export function HeatLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {legend.map((item) => (
        <div key={item.label} className={`heat-badge ${item.badge}`}>
          <span className={`h-3 w-3 rounded-full shadow-sm ${item.dot}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
