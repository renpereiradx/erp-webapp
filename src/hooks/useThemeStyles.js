/**
 * High-performance theme styles hook with centralized configuration
 * Optimized for minimal re-renders and maximum extensibility
 */

import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getStyleForThemeType } from '../config/themes';

/**
 * Hook principal para estilos de tema optimizado
 * @returns {Object} - Configuración de estilos y helpers
 */
export const useThemeStyles = () => {
  const { theme, themeConfig, isNeoBrutalism, isMaterial, isFluent, isDark, isLight } = useTheme();
  
  // Obtener configuración de estilos para el tipo de tema actual
  const styleConfig = useMemo(() => {
    return getStyleForThemeType(themeConfig.type);
  }, [themeConfig.type]);

  // Información del tema memoizada para evitar recálculos
  const themeInfo = useMemo(() => ({
    theme,
    type: themeConfig.type,
    mode: themeConfig.mode,
    isNeoBrutalism: isNeoBrutalism(),
    isMaterial: isMaterial(),
    isFluent: isFluent(),
    isDark: isDark(),
    isLight: isLight(),
  }), [theme, themeConfig, isNeoBrutalism, isMaterial, isFluent, isDark, isLight]);

  // Funciones de estilo optimizadas
  const styles = useMemo(() => {
    if (!styleConfig) {
      console.warn(`No style config found for theme type: ${themeConfig.type}`);
      return createFallbackStyles();
    }

    return {
      // Contenedor principal
      container: (extra = '') => {
        const base = styleConfig.card?.base || 'bg-background text-foreground';
        const border = styleConfig.card?.border || 'border';
        const shadow = styleConfig.card?.shadow || 'shadow-sm';
        const radius = styleConfig.card?.radius || 'rounded-lg';
        return `${base} ${border} ${shadow} ${radius} p-6 ${extra}`.trim();
      },

      // Tarjetas
      card: (extra = '') => {
        const base = styleConfig.card?.base || 'bg-card text-card-foreground';
        const border = styleConfig.card?.border || 'border';
        const shadow = styleConfig.card?.shadow || 'shadow-sm';
        const radius = styleConfig.card?.radius || 'rounded-lg';
        return `${base} ${border} ${shadow} ${radius} ${extra}`.trim();
      },

      // Botones
      button: (variant = 'primary') => {
        return styleConfig.button?.[variant] || styleConfig.button?.primary || 'bg-primary text-primary-foreground';
      },

      // Tipografía
      header: (level = 'h1') => {
        return styleConfig.typography?.[level] || styleConfig.typography?.h1 || 'text-3xl font-bold';
      },

      body: (variant = 'default') => {
        const base = styleConfig.typography?.body || 'font-normal';
        return variant === 'muted' ? `${base} text-muted-foreground` : base;
      },

      label: () => {
        return styleConfig.typography?.label || 'text-sm font-medium';
      },

      // Inputs
      input: (extra = '') => {
        const base = styleConfig.input?.base || 'border bg-background text-foreground p-2.5';
        const radius = styleConfig.input?.radius || 'rounded-md';
        return `${base} ${radius} ${extra}`.trim();
      },

      // Tabs
      tab: (extra = '') => {
        const base = styleConfig.card?.border || 'border';
        const radius = styleConfig.card?.radius || 'rounded-md';
        return `${base} ${radius} data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${extra}`.trim();
      },

      // Métricas (para compatibilidad)
      metricCard: () => {
        const border = styleConfig.card?.border?.includes('border-4') ? '4px solid var(--border)' : '1px solid var(--border)';
        const borderRadius = styleConfig.card?.radius === 'rounded-none' ? '0px' : 
                           styleConfig.card?.radius === 'rounded-xl' ? '12px' : '4px';
        const boxShadow = styleConfig.card?.shadow?.includes('shadow-[') ? '6px 6px 0px 0px rgba(0,0,0,1)' : 
                         styleConfig.card?.shadow === 'shadow-md' ? '0px 3px 6px rgba(0, 0, 0, 0.15)' : 
                         '0px 4px 8px rgba(0, 0, 0, 0.14)';
        
        return { border, borderRadius, boxShadow };
      },

      // Colores de gráficos
      chartColors: () => {
        return styleConfig.colors?.chart || ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F'];
      },

      // Color de acento
      accentColor: () => {
        return styleConfig.colors?.accent || '#000000';
      }
    };
  }, [styleConfig, themeConfig.type]);

  return {
    ...themeInfo,
    styles,
    styleConfig, // Exponer configuración raw para casos avanzados
  };
};

/**
 * Estilos de fallback cuando no hay configuración disponible
 */
const createFallbackStyles = () => ({
  container: (extra = '') => `bg-background text-foreground border rounded-lg shadow-sm p-6 ${extra}`.trim(),
  card: (extra = '') => `bg-card text-card-foreground border rounded-lg shadow-sm ${extra}`.trim(),
  button: (variant = 'primary') => {
    const variants = {
      primary: 'bg-primary text-primary-foreground rounded-md shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground border rounded-md',
      destructive: 'bg-destructive text-destructive-foreground rounded-md shadow-sm'
    };
    return variants[variant] || variants.primary;
  },
  header: (level = 'h1') => {
    const levels = {
      h1: 'text-3xl font-bold',
      h2: 'text-2xl font-bold',
      h3: 'text-xl font-bold'
    };
    return levels[level] || levels.h1;
  },
  body: () => 'font-normal',
  label: () => 'text-sm font-medium',
  input: (extra = '') => `border rounded-md bg-background text-foreground p-2.5 ${extra}`.trim(),
  tab: (extra = '') => `border rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${extra}`.trim(),
  metricCard: () => ({ border: '1px solid var(--border)', borderRadius: '4px', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }),
  chartColors: () => ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F'],
  accentColor: () => '#000000'
});

/**
 * Hook especializado solo para botones (alta performance)
 */
export const useButtonStyles = (variant = 'primary') => {
  const { styles } = useThemeStyles();
  return useMemo(() => styles.button(variant), [styles, variant]);
};

/**
 * Hook especializado solo para tipografía (alta performance)
 */
export const useTypographyStyles = () => {
  const { styles } = useThemeStyles();
  return useMemo(() => ({
    h1: styles.header('h1'),
    h2: styles.header('h2'),
    h3: styles.header('h3'),
    body: styles.body(),
    bodyMuted: styles.body('muted'),
    label: styles.label()
  }), [styles]);
};

export default useThemeStyles;