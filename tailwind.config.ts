import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // NikahPlan Modern Clean Neutral & Charcoal Design Tokens
        sage: {
          DEFAULT: "#141618",
          50: "#F4F6F9",
          100: "#EBEEF3",
          200: "#DCE1E9",
          300: "#B8C1CE",
          400: "#8994A4",
          500: "#5F6978",
          600: "#262B33",
          700: "#1D2127",
          800: "#171A1F",
          900: "#111317",
        },
        terracotta: {
          DEFAULT: "#4F6BF6",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#4F6BF6",
          600: "#3B55E6",
          700: "#2E43C5",
          800: "#26379E",
          900: "#1E2C7A",
        },
        cream: {
          DEFAULT: "#F4F5F7",
          50: "#FFFFFF",
          100: "#F4F5F7",
          200: "#ECEEF2",
          300: "#E1E4EB",
          400: "#CDD2DC",
        },
        amberwarm: {
          DEFAULT: "#E09F3E",
          light: "#FEF5E7",
        },
      },
      // Tailwind 3 hanya menyediakan opacity kelipatan 5; nilai 8 & 12 dipakai di banyak komponen
      opacity: {
        8: "0.08",
        12: "0.12",
      },
      spacing: {
        4.5: "1.125rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
      boxShadow: {
        soft: "0 2px 14px -2px rgba(17, 19, 23, 0.05)",
        card: "0 2px 14px -2px rgba(17, 19, 23, 0.04), 0 0 0 1px rgba(17, 19, 23, 0.04)",
        glow: "0 12px 32px -10px rgba(79, 107, 246, 0.35)",
        lift: "0 20px 50px -20px rgba(17, 19, 23, 0.18)",
      },
      keyframes: {
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.08)" },
          "66%": { transform: "translate(-25px, 20px) scale(0.95)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--float-rotate, 0deg))" },
          "50%": { transform: "translateY(-12px) rotate(calc(var(--float-rotate, 0deg) + 4deg))" },
        },
        "float-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "60%, 100%": { transform: "translateX(100%)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "blob-drift": "blob-drift 18s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        "float-soft": "float-soft 6s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "gradient-pan": "gradient-pan 6s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
