import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "CoolCity",
  description: "AI-powered urban heat intervention simulator"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-[family-name:var(--font-manrope)]">
        {children}
      </body>
    </html>
  );
}
