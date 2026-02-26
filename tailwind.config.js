/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        "primary": "#106ebe", // Fluent Blue corporativo
        "primary-hover": "#005a9e",
        "background-light": "#f3f4f6",
        "background-dark": "#101922",
        "surface": "#ffffff",
        "border-subtle": "#e5e7eb",
        "text-main": "#242424",
        "text-secondary": "#616161",
        "success": "#107c10",
        "error": "#a4262c",
        "warning": "#ffb900",
        "info": "#0078d4",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "fluent-2": "0 2px 4px rgba(0,0,0,0.04), 0 0 2px rgba(0,0,0,0.06)",
        "fluent-8": "0 4px 8px rgba(0,0,0,0.12), 0 0 2px rgba(0,0,0,0.06)",
        "fluent-16": "0 8px 16px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.06)",
        "fluent-shadow": "0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04)"
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

