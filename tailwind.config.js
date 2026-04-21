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
      transitionDuration: {
        '1500': '1500ms',
        '2000': '2000ms',
        '2500': '2500ms',
      },
      colors: {
        primary: {
          DEFAULT: "#137fec", // Stitch Primary
          hover: "#0f67be",
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
        // Stitch design specific colors
        surface: "hsl(var(--surface))",
        text: {
          main: "hsl(var(--text-main))",
          secondary: "hsl(var(--text-secondary))",
        },
        border: {
          subtle: "hsl(var(--border-subtle))",
        },
        success: "#107c10",
        error: "#c50f1f",
        warning: "#d83b01",
        "background-light": "#f0f2f5",
        "background-dark": "#101922",
        "surface-light": "#ffffff",
        "surface-dark": "#1a2633",
        "text-primary-light": "#111418",
        "text-secondary-light": "#617589",
        "text-primary-dark": "#f0f2f4",
        "text-secondary-dark": "#9ba6b5",
        "semantic-success": "#107c10",
        "semantic-danger": "#c50f1f",
        "semantic-warning": "#d83b01",
        "fluent-success": "#107c10",
        "fluent-danger": "#d13438",
        "fluent-warning": "#ffaa44",
        "fluent-gray": "#f3f2f1",
      },
      fontFamily: {
        "sans": ["Inter", "Public Sans", "system-ui", "sans-serif"],
        "display": ["Inter", "system-ui", "sans-serif"],
        "montserrat": ["Montserrat", "sans-serif"],
        "public": ["Public Sans", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
        "ibm": ["IBM Plex Mono", "monospace"],
        "tabular": ["JetBrains Mono", "monospace"]
      },
      borderRadius: {
        xl: "8px",
        lg: "6px",
        md: "4px",
        sm: "2px",
      },
      boxShadow: {
        "fluent-2": "0 2px 4px rgba(0,0,0,0.04), 0 0 2px rgba(0,0,0,0.06)",
        "fluent-8": "0 4px 8px rgba(0,0,0,0.12), 0 0 2px rgba(0,0,0,0.06)",
        "fluent-16": "0 8px 16px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.06)",
        "fluent-shadow": "0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04)",
        "card": "0 2px 4px rgba(0,0,0,0.04), 0 0 2px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

