/**
 * Custom hook para manejo de estilos multitema
 * Centraliza toda la lógica de estilos adaptativos
 * Evita duplicación de código entre componentes
 */

import { useTheme } from 'next-themes';
import { useMemo } from 'react';

export const useThemeStyles = () => {
  const { theme } = useTheme();
  
  const themeConfig = useMemo(() => ({
    isNeoBrutalism: theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark',
    isMaterial: theme === 'material-light' || theme === 'material-dark',
    isFluent: theme === 'fluent-light' || theme === 'fluent-dark',
    mode: theme?.endsWith('dark') ? 'dark' : 'light',
  }), [theme]);

  const styles = useMemo(() => ({
    // Contenedores principales
    container: () => {
      if (themeConfig.isNeoBrutalism) {
        return "bg-card text-card-foreground border brutal-border brutal-shadow-lg p-6 rounded-none";
      } else if (themeConfig.isMaterial) {
        // Material 3: superficies con tokens, radios medios, elevación sutil
        return "bg-background text-foreground rounded-md shadow-sm";
      } else if (themeConfig.isFluent) {
        // Fluent 2: superficies con tokens, radios pequeños, elevación sutil
        return "bg-background text-foreground rounded-lg fluent-elevation-2";
      }
      return "bg-background text-foreground border shadow rounded";
    },

    // Tarjetas y paneles
    card: (extra = '') => {
      if (themeConfig.isNeoBrutalism) {
        return `bg-card text-card-foreground brutal-border brutal-shadow-md ${extra}`.trim();
      } else if (themeConfig.isMaterial) {
        // Superficie card + tipografía del sistema
        return `bg-card text-card-foreground rounded-md shadow-sm border ${extra}`.trim();
      } else if (themeConfig.isFluent) {
        return `bg-card text-card-foreground rounded-lg fluent-elevation-2 border ${extra}`.trim();
      }
      return `bg-card text-card-foreground border shadow ${extra}`.trim();
    },

    // Botones con variantes
    button: (variant = 'primary') => {
      if (themeConfig.isNeoBrutalism) {
        if (variant === 'primary') {
          return "brutalist-button bg-[var(--primary)] text-[var(--primary-foreground)]";
        }
        if (variant === 'destructive') {
          return "brutalist-button bg-[var(--destructive)] text-[var(--destructive-foreground)]";
        }
        if (variant === 'secondary') {
          return "brutalist-button bg-[var(--secondary)] text-[var(--secondary-foreground)]";
        }
        return "brutalist-button bg-background text-foreground";
      } else {
        // Material 3 y Fluent 2 usan tokens del sistema
        if (variant === 'primary') {
          return "bg-primary text-primary-foreground rounded-md shadow-sm hover:opacity-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
        }
        if (variant === 'destructive') {
          return "bg-destructive text-destructive-foreground rounded-md shadow-sm hover:opacity-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
        }
        // Secondary (tonal/neutral)
        return "bg-secondary text-secondary-foreground border rounded-md hover:bg-muted/60 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
      }
    },

    // Headers y títulos
    header: (level = 'h1') => {
      if (themeConfig.isNeoBrutalism) {
        const sizes = {
          h1: "text-3xl font-black uppercase tracking-wide",
          h2: "text-2xl font-black uppercase tracking-wide",
          h3: "text-xl font-black uppercase tracking-wide",
          h4: "text-lg font-black uppercase tracking-wide",
        };
        return sizes[level] || sizes.h1;
      } else {
        const sizes = {
          h1: "text-3xl font-bold",
          h2: "text-2xl font-bold",
          h3: "text-xl font-semibold",
          h4: "text-lg font-semibold",
        };
        return sizes[level] || sizes.h1;
      }
    },

    // Labels y texto
    label: () => {
      if (themeConfig.isNeoBrutalism) return "text-sm font-black uppercase tracking-wide";
      return "text-sm font-medium";
    },

    // Texto del cuerpo
    body: () => {
      if (themeConfig.isNeoBrutalism) return "font-bold";
      return "text-muted-foreground";
    },

    // Pestañas de navegación
    tab: () => {
      if (themeConfig.isNeoBrutalism) {
        return "border brutal-border bg-background data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)] font-black uppercase transition-all duration-150";
      } else {
        return "rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200";
      }
    },

    // Input fields
    input: () => {
      if (themeConfig.isNeoBrutalism) {
        return "brutalist-input focus:shadow-[var(--input-shadow-focus)]";
      } else if (themeConfig.isMaterial) {
        return "border rounded-md bg-background text-foreground focus:border-ring focus:ring-2 focus:ring-ring/50 transition-all duration-200";
      } else if (themeConfig.isFluent) {
        return "border rounded-lg bg-background text-foreground focus:border-ring focus:ring-2 focus:ring-ring/50 transition-all duration-200";
      }
      return "border rounded bg-background text-foreground focus:border-ring focus:ring-2 focus:ring-ring/50 transition-all duration-200";
    },

    // Card headers
    cardHeader: () => {
      if (themeConfig.isNeoBrutalism) {
        return "border-b brutal-border";
      }
      return "border-b";
    }
  }), [themeConfig]);

  return {
    ...themeConfig,
    // Exposición en nivel superior para retrocompatibilidad
    ...styles,
    // Objeto agrupado
    styles
  };
};

export default useThemeStyles;
