"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, ThermometerSun, Waves } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { FloatingQuickActions } from "@/components/floating-quick-actions";
import { GlobalAlertCenter } from "@/components/global-alert-center";
import { IndiaLocationPicker } from "@/components/india-location-picker";
import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";

export function DashboardShell({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { selectedLocation, weather, heatRiskScore } = useRealtimeCityData();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="glass-card rounded-[28px] px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <div className="splash-logo-glow splash-float flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary via-accent to-secondary text-white">
              <Waves size={20} />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">Loading CoolCity workspace...</div>
              <div className="mt-1 flex gap-1">
                <span className="loading-dot h-2 w-2 rounded-full bg-primary" />
                <span className="loading-dot h-2 w-2 rounded-full bg-accent [animation-delay:120ms]" />
                <span className="loading-dot h-2 w-2 rounded-full bg-secondary [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="hero-orb left-[-6rem] top-[8rem] h-48 w-48 bg-primary/25" />
      <div className="hero-orb right-[8%] top-[16rem] h-56 w-56 bg-accent/20 [animation-delay:1.5s]" />
      <div className="hero-orb bottom-[10%] left-[24%] h-64 w-64 bg-secondary/15 [animation-delay:3s]" />

      <div className="w-full lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-72 lg:p-4">
        <Sidebar />
      </div>

      <main className="relative ml-0 flex-1 w-full min-w-0 lg:ml-72">
        <div className="w-full px-4 py-4 md:px-6 md:py-6">
          <div className="dashboard-surface bg-grid page-shell-entrance min-h-[calc(100vh-2rem)] w-full min-w-0 p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="relative">
                <div className="text-sm uppercase tracking-[0.3em] text-primary">{eyebrow}</div>
                <h1 className="mt-3 bg-gradient-to-r from-slate-950 via-teal-700 to-emerald-500 bg-clip-text text-3xl font-semibold tracking-tight text-transparent dark:from-white dark:via-cyan-200 dark:to-emerald-300 md:text-[2.8rem]">
                  {title}
                </h1>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="glass-card inline-flex items-center gap-2 px-4 py-2 text-sm">
                    <MapPin size={15} className="text-primary" />
                    <span>{selectedLocation?.label ?? "Detecting location"}</span>
                  </div>
                  <div className="glass-card inline-flex items-center gap-2 px-4 py-2 text-sm">
                    <ThermometerSun size={15} className="text-orange-500 animate-pulse" />
                    <span>{weather ? `${weather.temperature} deg C · ${weather.condition}` : "Live weather syncing"}</span>
                  </div>
                  <div className="glass-card inline-flex items-center gap-2 px-4 py-2 text-sm">
                    <Waves size={15} className="text-accent" />
                    <span>Heat score {heatRiskScore}/100</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 xl:items-end">
                <IndiaLocationPicker />
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <GlobalAlertCenter />
                  <UserMenu />
                </div>
              </div>
            </div>
            <div className="flex-1 w-full min-w-0">{children}</div>
          </div>
        </div>
      </main>

      <FloatingQuickActions />
    </div>
  );
}
