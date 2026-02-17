import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fafafa",
        "background-alt": "#f5f5f5",
        "text-primary": "#111111",
        "text-secondary": "#6b6b6b",
        border: "#e5e5e5",
        "hover-bg": "#efefef",
        "link": "#5a6b7a",
        // Priority colors
        "priority-p0": "#dc2626",
        "priority-p0-bg": "#fef2f2",
        "priority-p1": "#d97706",
        "priority-p1-bg": "#fffbeb",
        "priority-p2": "#2563eb",
        "priority-p2-bg": "#eff6ff",
        // Status colors
        "status-todo": "#6366f1",
        "status-doing": "#f59e0b",
        "status-done": "#10b981",
        // Accent
        "accent": "#6366f1",
        "accent-light": "#eef2ff",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
