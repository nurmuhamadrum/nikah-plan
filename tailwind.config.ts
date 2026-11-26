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
        // NikahPlan Brand Tokens
        sage: {
          DEFAULT: "#3D5245",
          50: "#F3F6F4",
          100: "#E3EBE6",
          200: "#C5D6CC",
          300: "#9EB9A9",
          400: "#729682",
          500: "#537662",
          600: "#3D5245",
          700: "#314237",
          800: "#26342B",
          900: "#1D2821",
        },
        terracotta: {
          DEFAULT: "#C87D55",
          50: "#FDF6F2",
          100: "#FAE9DF",
          200: "#F3CEBA",
          300: "#E8AE8F",
          400: "#D9946F",
          500: "#C87D55",
          600: "#B2663F",
          700: "#935131",
          800: "#784229",
          900: "#623723",
        },
        cream: {
          DEFAULT: "#F7F5F0",
          50: "#FCFBF9",
          100: "#F7F5F0",
          200: "#EFECE4",
          300: "#E5E0D5",
          400: "#D3CBC0",
        },
        amberwarm: {
          DEFAULT: "#D4A359",
          light: "#F5E9D3",
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
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        script: ["var(--font-pinyon)", "cursive"],
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(61, 82, 69, 0.08)",
        card: "0 2px 12px -2px rgba(61, 82, 69, 0.06), 0 0 0 1px rgba(61, 82, 69, 0.05)",
        glow: "0 10px 40px -10px rgba(200, 125, 85, 0.55)",
        lift: "0 24px 60px -24px rgba(38, 52, 43, 0.30)",
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
