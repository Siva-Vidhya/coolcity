import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Flame, Trees } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[36px] bg-grid p-6 shadow-panel md:p-10">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.32em] text-emerald-700">CoolCity</div>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
              Simulate cooling strategies before cities spend a single rupee or dollar.
            </h1>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800">
            Open Dashboard
            <ArrowRight size={18} />
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-white/70 bg-slate-950 p-8 text-white shadow-panel">
            <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm text-emerald-200">AI-powered intervention simulator</div>
            <p className="mt-5 max-w-2xl text-lg text-slate-200">
              Detect heat zones, test intervention scenarios, optimize budgets, and export stakeholder-ready outputs from one modern dashboard.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <FeatureCard title="Heat Detection" icon={<Flame size={18} />} text="Color-coded map overlays reveal current urban heat stress." />
              <FeatureCard title="Simulation" icon={<Trees size={18} />} text="Model trees, cool roofs, green walls, and water bodies." />
              <FeatureCard title="Optimization" icon={<BarChart3 size={18} />} text="Recommend the best intervention mix for a target budget." />
            </div>
          </div>
          <div className="rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-panel">
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">Demo flow</div>
            <ol className="mt-5 space-y-4 text-slate-700">
              <li>1. Review the dashboard and current heat conditions.</li>
              <li>2. Explore the heat map to identify high-risk zones.</li>
              <li>3. Run a simulation with cooling interventions.</li>
              <li>4. Open results to compare impact and optimize budget.</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  return (
    <div className="rounded-[24px] bg-white/10 p-4">
      <div className="mb-3 inline-flex rounded-full bg-white/10 p-2">{icon}</div>
      <div className="font-medium">{title}</div>
      <div className="mt-2 text-sm text-slate-300">{text}</div>
    </div>
  );
}
