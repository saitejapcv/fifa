import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: "#FAF9F5",
          surface: "#F5F0E8",
          card: "#FFFFFF",
          border: "#E8E4DB",
          "border-strong": "#D4CFC4",
          ink: "#1A1A18",
          "ink-secondary": "#5C5C56",
          "ink-muted": "#8A8A82",
          accent: "#D97757",
          "accent-hover": "#C4613F",
          "accent-soft": "#F5E6DF",
          success: "#3D7A5A",
          "success-soft": "#E5F0EA",
          warning: "#B8860B",
          "warning-soft": "#F7F0DC",
          danger: "#C44B4B",
          "danger-soft": "#F8E8E8",
          info: "#4A6FA5",
          "info-soft": "#E8EEF5",
        },
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26, 26, 24, 0.04), 0 4px 16px rgba(26, 26, 24, 0.04)",
        lift: "0 2px 4px rgba(26, 26, 24, 0.04), 0 12px 32px rgba(26, 26, 24, 0.08)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
