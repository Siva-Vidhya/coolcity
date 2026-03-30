export function ScoreGauge({ label, score }: { label: string; score: number }) {
  const degrees = Math.round((score / 100) * 360);

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-panel">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-6 flex items-center justify-center">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#0f766e ${degrees}deg, rgba(15, 118, 110, 0.12) ${degrees}deg)`
          }}
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-center shadow-inner">
            <div>
              <div className="text-3xl font-semibold text-slate-950">{score}</div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
