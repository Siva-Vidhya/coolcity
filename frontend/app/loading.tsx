import { Waves } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      <div className="glass-card rounded-[28px] px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-3">
          <div className="splash-logo-glow splash-float flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 via-cyan-400 to-emerald-400 text-white">
            <Waves size={20} />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">Loading workspace...</div>
            <div className="mt-1 flex gap-1">
              <span className="loading-dot h-2 w-2 rounded-full bg-teal-500" />
              <span className="loading-dot h-2 w-2 rounded-full bg-cyan-400 [animation-delay:120ms]" />
              <span className="loading-dot h-2 w-2 rounded-full bg-emerald-400 [animation-delay:240ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
