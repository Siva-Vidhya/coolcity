import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        mist: "#F8FAFC",
        primary: "#0EA5A4",
        secondary: "#22c55e",
        accent: "#38BDF8",
        heat: {
          high: "#ef4444",
          medium: "#f59e0b",
          low: "#16a34a"
        }
      },
      boxShadow: {
        panel: "0 22px 55px -30px rgba(15, 23, 42, 0.18)",
        glow: "0 20px 48px -24px rgba(14, 165, 164, 0.32)",
        float: "0 18px 44px -20px rgba(14, 165, 164, 0.18)",
        neon: "0 0 0 1px rgba(56, 189, 248, 0.18), 0 20px 55px -28px rgba(56, 189, 248, 0.4)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.92), rgba(236, 254, 255, 0.78))",
        climate: "radial-gradient(circle at top left, rgba(14, 165, 164, 0.12), transparent 28%), radial-gradient(circle at top right, rgba(56, 189, 248, 0.1), transparent 24%), linear-gradient(to bottom right, #F8FAFC, #ECFEFF)",
        sidebar: "linear-gradient(180deg, rgba(8, 145, 178, 0.96) 0%, rgba(13, 148, 136, 0.92) 38%, rgba(34, 197, 94, 0.9) 100%)",
        "sidebar-dark": "linear-gradient(180deg, rgba(2, 6, 23, 0.96) 0%, rgba(8, 47, 73, 0.88) 42%, rgba(15, 118, 110, 0.84) 100%)"
      }
    }
  },
  plugins: []
};

export default config;
