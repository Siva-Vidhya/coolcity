"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Leaf, ThermometerSun } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIsLeaving(true), 2200);
    const routeTimer = window.setTimeout(() => router.push("/dashboard"), 2800);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(routeTimer);
    };
  }, [router]);

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 transition-opacity duration-700 ${
        isLeaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="splash-gradient absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(14)].map((_, index) => (
          <span
            key={index}
            className="splash-particle absolute rounded-full bg-white/30"
            style={{
              left: `${8 + index * 6.5}%`,
              top: `${12 + (index % 5) * 14}%`,
              width: `${8 + (index % 4) * 4}px`,
              height: `${8 + (index % 4) * 4}px`,
              animationDelay: `${index * 0.18}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <div className="splash-logo-glow splash-float splash-bounce relative flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/35 bg-white/15 backdrop-blur-xl md:h-32 md:w-32">
          <div className="absolute inset-3 rounded-[26px] bg-gradient-to-br from-teal-300/70 via-cyan-200/40 to-green-300/70 blur-xl" />
          <div className="relative flex items-center gap-1 text-white">
            <Building2 size={28} />
            <Leaf size={22} className="-ml-1 mt-5" />
            <ThermometerSun size={24} className="-ml-1 -mt-5" />
          </div>
        </div>

        <div className="splash-fade-up mt-8">
          <h1 className="bg-gradient-to-r from-teal-100 via-cyan-50 to-green-100 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-[0_12px_30px_rgba(15,23,42,0.18)] md:text-7xl">
            CoolCity
          </h1>
          <p className="mt-4 text-base font-medium tracking-[0.12em] text-white/90 md:text-lg">
            Smart Climate Intelligence for Cooler Cities
          </p>
          <p className="mt-2 text-sm text-white/75 md:text-base">
            Predict. Prevent. Cool.
          </p>
        </div>

        <div className="splash-fade-up-delay mt-12 flex items-center gap-3 rounded-full border border-white/30 bg-white/12 px-5 py-3 text-sm font-medium text-white/90 backdrop-blur-md">
          <span>Loading CoolCity</span>
          <span className="flex items-center gap-1">
            <span className="loading-dot h-2 w-2 rounded-full bg-white/90" />
            <span className="loading-dot h-2 w-2 rounded-full bg-white/75" style={{ animationDelay: "0.2s" }} />
            <span className="loading-dot h-2 w-2 rounded-full bg-white/60" style={{ animationDelay: "0.4s" }} />
          </span>
        </div>
      </div>
    </main>
  );
}
