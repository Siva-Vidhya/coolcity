import clsx from "clsx";
import { useEffect, useState } from "react";

export function ScoreGauge({ label, score, className }: { label: string; score: number; className?: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const degrees = Math.round((animatedScore / 100) * 360);

  useEffect(() => {
    let frameId = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Number((score * eased).toFixed(1)));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [score]);

  return (
    <div className={clsx("glass-card group climate-hover relative overflow-hidden rounded-[30px] p-6", className)}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/14 via-transparent to-emerald-400/12" />
      <div className="pointer-events-none absolute right-[-3rem] top-[-3rem] h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Health meter</div>
        </div>
        <div className="rounded-full border border-cyan-100/80 bg-white/70 px-3 py-1 text-xs font-semibold text-primary dark:border-slate-700 dark:bg-slate-900/80">
          {animatedScore >= 75 ? "High resilience" : animatedScore >= 50 ? "Moderate" : "At risk"}
        </div>
      </div>
      <div className="relative mt-6 flex items-center justify-center">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full transition duration-500 group-hover:scale-[1.03]"
          style={{
            background: `conic-gradient(#0EA5A4 ${degrees}deg, #38BDF8 ${Math.min(360, degrees + 36)}deg, rgba(14, 165, 164, 0.12) ${degrees}deg)`
          }}
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/80 bg-white/90 text-center shadow-inner dark:border-slate-700 dark:bg-slate-900">
            <div>
              <div className="text-3xl font-semibold text-slate-950 dark:text-slate-100">{animatedScore}</div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">score</div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mt-5 climate-meter-bar" />
    </div>
  );
}
