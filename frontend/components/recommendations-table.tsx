import { Recommendation } from "@/lib/types";

export function RecommendationsTable({ rows, currency }: { rows: Recommendation[]; currency: string }) {
  return (
    <div className="glass-card-strong overflow-hidden rounded-[28px]">
      <table className="min-w-full text-left">
        <thead className="bg-gradient-to-r from-primary via-accent to-secondary text-sm text-white">
          <tr>
            <th className="px-4 py-3 font-medium">Strategy</th>
            <th className="px-4 py-3 font-medium">Units</th>
            <th className="px-4 py-3 font-medium">Spend</th>
            <th className="px-4 py-3 font-medium">Reduction</th>
            <th className="px-4 py-3 font-medium">Impact</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.strategy}-${row.units}`} className="border-t border-slate-100 text-sm text-slate-700">
              <td className="px-4 py-3">{row.strategy}</td>
              <td className="px-4 py-3">{row.units}</td>
              <td className="px-4 py-3">
                {currency} {row.spend.toLocaleString()}
              </td>
              <td className="px-4 py-3">{row.estimated_reduction} deg C</td>
              <td className="px-4 py-3">{row.impact_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
