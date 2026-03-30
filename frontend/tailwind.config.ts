import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#04131d",
        mist: "#eef6f7",
        primary: "#0f766e",
        secondary: "#22c55e",
        accent: "#10b981",
        heat: {
          high: "#ef4444",
          medium: "#f59e0b",
          low: "#16a34a"
        }
      },
      boxShadow: {
        panel: "0 24px 60px -30px rgba(7, 23, 36, 0.28)",
        glow: "0 20px 60px -28px rgba(16, 185, 129, 0.45)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at top, rgba(15, 118, 110, 0.18), transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.74), rgba(220, 252, 231, 0.58))",
        climate: "radial-gradient(circle at top left, rgba(16, 185, 129, 0.22), transparent 26%), radial-gradient(circle at right, rgba(34, 197, 94, 0.18), transparent 24%), linear-gradient(180deg, #f4fffb 0%, #e6f9f2 48%, #edfdf7 100%)",
        sidebar: "linear-gradient(180deg, rgba(15, 118, 110, 0.95) 0%, rgba(16, 185, 129, 0.92) 52%, rgba(34, 197, 94, 0.9) 100%)"
      }
    }
  },
  plugins: []
};

export default config;
