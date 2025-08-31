/**
 * Hook de estilos que usa el store de temas de Zustand
 * Patrón MVP oficial siguiendo GUIA_MVP_DESARROLLO.md
 */

import { useMemo } from 'react';
import useThemeStore from '../store/useThemeStore';

export const useThemeStyles = () => {
  // Usar selectores específicos para optimización
  const theme = useThemeStore((state) => state.theme);
  const isNeoBrutalism = useThemeStore((state) => state.isNeoBrutalism());
  const isMaterial = useThemeStore((state) => state.isMaterial());
  const isFluent = useThemeStore((state) => state.isFluent());
  const isDark = useThemeStore((state) => state.isDark());
  
  const themeConfig = useMemo(() => ({
    theme,
    isNeoBrutalism,
    isMaterial,
    isFluent,
    isDark,
    mode: isDark ? 'dark' : 'light',
  }), [theme, isNeoBrutalism, isMaterial, isFluent, isDark]);

  const styles = useMemo(() => ({
    // Estilos que dependen de la configuración del tema
    container: () => {
      if (themeConfig.isNeoBrutalism) return "bg-card text-card-foreground border brutal-border brutal-shadow-lg p-6 rounded-none";
      return "bg-background text-foreground rounded-lg shadow-sm";
    },
    card: (extra = '') => {
      if (themeConfig.isNeoBrutalism) return `bg-card text-card-foreground brutal-border brutal-shadow-md ${extra}`.trim();
      return `bg-card text-card-foreground rounded-lg shadow-sm border ${extra}`.trim();
    },
    button: (variant = 'primary') => {
        if (themeConfig.isNeoBrutalism) {
            if (variant === 'primary') return "brutalist-button bg-[var(--primary)] text-[var(--primary-foreground)]";
            if (variant === 'destructive') return "brutalist-button bg-[var(--destructive)] text-[var(--destructive-foreground)]";
            return "brutalist-button bg-background text-foreground";
        }
        if (variant === 'primary') return "bg-primary text-primary-foreground rounded-md shadow-sm hover:opacity-90";
        if (variant === 'destructive') return "bg-destructive text-destructive-foreground rounded-md shadow-sm hover:opacity-90";
        return "bg-secondary text-secondary-foreground border rounded-md hover:bg-muted/60";
    },
    header: (level = 'h1') => {
        const sizes = themeConfig.isNeoBrutalism 
            ? { h1: "text-3xl font-black uppercase tracking-wide", h2: "text-2xl font-black uppercase" }
            : { h1: "text-3xl font-bold", h2: "text-2xl font-bold" };
        return sizes[level] || sizes.h1;
    },
    label: () => themeConfig.isNeoBrutalism ? "text-sm font-black uppercase" : "text-sm font-medium",
    input: () => themeConfig.isNeoBrutalism ? "brutalist-input" : "border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring/50",
    tab: () => themeConfig.isNeoBrutalism ? "border brutal-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" : "rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
    metricCard: () => {
        if (themeConfig.isNeoBrutalism) return { border: '4px solid var(--border)', borderRadius: '0px', boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)' };
        if (themeConfig.isMaterial) return { borderRadius: '12px', boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.15)' };
        if (themeConfig.isFluent) return { border: '1px solid var(--border)', borderRadius: '4px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.14)' };
        return {};
    },
    chartColors: () => {
        if (themeConfig.isNeoBrutalism) return ['#A3E635', '#3B82F6', '#EC4899', '#F97316', '#8B5CF6'];
        if (themeConfig.isMaterial) return ['#6200EE', '#03DAC6', '#B00020', '#FF9800', '#9C27B0'];
        if (themeConfig.isFluent) return ['#0078D4', '#107C10', '#FFB900', '#D13438', '#8764B8'];
        return ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F'];
    }
  }), [themeConfig]);

  return {
    ...themeConfig,
    styles,
  };
};

export default useThemeStyles;
