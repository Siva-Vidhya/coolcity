import { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";

export function DashboardShell({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-climate px-4 py-4 text-slate-900 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[288px_minmax(0,1fr)]">
        <Sidebar />
        <main className="glass-card-strong rounded-[32px] bg-grid p-6 md:p-8">
          <div className="mb-8">
            <div className="text-sm uppercase tracking-[0.3em] text-primary">{eyebrow}</div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-4xl">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
