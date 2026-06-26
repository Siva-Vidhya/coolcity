import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { HeatAlertProvider } from "@/components/heat-alert-provider";
import { RealtimeCityProvider } from "@/components/realtime-city-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "CoolCity",
  description: "AI-powered urban heat intervention simulator"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-[family-name:var(--font-manrope)] text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('coolcity-theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var resolved = stored === 'light' || stored === 'dark'
                    ? stored
                    : (systemDark ? 'dark' : 'light');
                  document.documentElement.classList.toggle('dark', resolved === 'dark');
                  document.documentElement.dataset.theme = stored || 'system';
                  document.documentElement.style.colorScheme = resolved;
                } catch (e) {}
              })();
            `
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <RealtimeCityProvider>
              <HeatAlertProvider>
                {children}
              </HeatAlertProvider>
            </RealtimeCityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
