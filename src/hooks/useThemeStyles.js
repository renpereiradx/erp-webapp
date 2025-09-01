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
  // Fallback for React 19 compatibility - using default Material theme
  let theme, themeConfig, isNeoBrutalism, isMaterial, isFluent, isDark, isLight, setTheme, resetTheme;
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    themeConfig = themeContext.themeConfig;
    isNeoBrutalism = themeContext.isNeoBrutalism;
    isMaterial = themeContext.isMaterial;
    isFluent = themeContext.isFluent;
    isDark = themeContext.isDark;
    isLight = themeContext.isLight;
    setTheme = themeContext.setTheme;
    resetTheme = themeContext.resetTheme;
  } catch (error) {
    // Fallback values for React 19 compatibility
    theme = 'material-light';
    themeConfig = { type: 'material', mode: 'light' };
    isNeoBrutalism = () => false;
    isMaterial = () => true;
    isFluent = () => false;
    isDark = () => false;
    isLight = () => true;
    setTheme = () => {};
    resetTheme = () => {};
  }
  
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

      // Contenedor de página plano (sin borde ni sombra) para evitar apariencia de card global
      page: (extra = '') => {
        const bg = 'bg-background';
        const fg = 'text-foreground';
        return `${bg} ${fg} w-full ${extra}`.trim();
      },

      // Tarjetas
      card: (variantOrExtra = '', maybeExtra = '') => {
        // API flexible: card(extra) o card(variant, extra/opciones)
        let variant = null;
        let extra = '';
        let options = {};
        if (typeof maybeExtra === 'string' || !maybeExtra) {
          // Llamada: card(variantOrExtra, extra)
          if (styleConfig.card?.variants?.[variantOrExtra]) {
            variant = variantOrExtra;
            extra = maybeExtra || '';
          } else {
            extra = variantOrExtra || '';
          }
        } else {
          // Llamada: card(variant, options)
            if (styleConfig.card?.variants?.[variantOrExtra]) {
              variant = variantOrExtra;
              options = maybeExtra || {};
              extra = options.extra || '';
            } else {
              // card(extra, options)
              extra = variantOrExtra || '';
              options = maybeExtra || {};
            }
        }

        const base = styleConfig.card?.base || 'bg-card text-card-foreground';
        const border = styleConfig.card?.border || 'border';
        const shadow = styleConfig.card?.shadow || 'shadow-sm';
        const radius = styleConfig.card?.radius || 'rounded-lg';
        const variantClasses = variant ? styleConfig.card?.variants?.[variant] : '';
        const density = options.density ? styleConfig.card?.densities?.[options.density] : '';
        const interactive = options.interactive ? 'md-card-interactive' : '';
        return `${variantClasses || base} ${border} ${shadow} ${radius} ${density} ${interactive} ${extra}`.replace(/\s+/g,' ').trim();
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
      input: (variantOrExtra = '', maybeOptions = '') => {
        let variant = null; let extra = ''; let options = {};
        if (typeof maybeOptions === 'string' || !maybeOptions) {
          if (styleConfig.input?.variants?.[variantOrExtra]) { variant = variantOrExtra; extra = maybeOptions || ''; } else { extra = variantOrExtra || ''; }
        } else {
          if (styleConfig.input?.variants?.[variantOrExtra]) { variant = variantOrExtra; options = maybeOptions; extra = options.extra || ''; } else { extra = variantOrExtra || ''; options = maybeOptions; }
        }
        const base = styleConfig.input?.base || 'border bg-background text-foreground p-2.5';
        const radius = styleConfig.input?.radius || 'rounded-md';
        const variantClasses = variant ? styleConfig.input?.variants?.[variant] : '';
        const density = options.density ? styleConfig.input?.densities?.[options.density] : '';
        return `${variantClasses || base} ${radius} ${density || ''} ${extra}`.replace(/\s+/g,' ').trim();
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
      },

      // Badges
      badge: (variant = 'primary') => {
        const base = 'px-2 py-1 text-xs font-medium rounded-md';
        const border = themeInfo.isNeoBrutalism ? 'border-2 border-black' : 'border';
        switch (variant) {
          case 'primary': return `${base} bg-primary/10 text-primary ${border}`;
          case 'secondary': return `${base} bg-muted text-muted-foreground ${border}`;
          case 'success': return `${base} bg-green-500/10 text-green-700 ${border}`;
          case 'warning': return `${base} bg-yellow-500/10 text-yellow-700 ${border}`;
          case 'error': return `${base} bg-destructive/10 text-destructive ${border}`;
          default: return `${base} bg-primary/10 text-primary ${border}`;
        }
      },

      // Card sections
      cardHeader: () => {
        const border = themeInfo.isNeoBrutalism ? 'border-b-2 border-black' : 'border-b border-border';
        return border;
      },

      cardFooter: () => {
        const border = themeInfo.isNeoBrutalism ? 'border-t-2 border-black' : 'border-t border-border';
        return border;
      },

      cardSeparator: () => {
        const border = themeInfo.isNeoBrutalism ? 'border-b-2 border-black' : 'border-b border-border/50';
        return border;
      },

      cardNote: () => {
        const bg = themeInfo.isNeoBrutalism ? 'bg-muted border-2 border-black' : 'bg-muted/30';
        return bg;
      }
    };
  }, [styleConfig, themeConfig.type]);

  // Helper explícito (fuera del objeto para evitar 'this')
  const cardVariant = (variant, options = {}) => styles.card(variant, options);

  return {
    ...themeInfo,
    styles,
  cardVariant,
    styleConfig, // Exponer configuración raw para casos avanzados
    // Acciones (expuestas para compatibilidad con pruebas y usos avanzados)
    setTheme,
    resetTheme,
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
  accentColor: () => '#000000',
  badge: (variant = 'primary') => {
    const base = 'px-2 py-1 text-xs font-medium rounded-md border';
    switch (variant) {
      case 'primary': return `${base} bg-primary/10 text-primary`;
      case 'secondary': return `${base} bg-muted text-muted-foreground`;
      default: return `${base} bg-primary/10 text-primary`;
    }
  },
  cardHeader: () => 'border-b border-border',
  cardFooter: () => 'border-t border-border',
  cardSeparator: () => 'border-b border-border/50',
  cardNote: () => 'bg-muted/30'
});

/**
 * Hook especializado solo para botones (alta performance)
 */
export const useButtonStyles = (variant = 'primary') => {
  try {
    const { styles } = useThemeStyles();
    return useMemo(() => styles.button(variant), [styles, variant]);
  } catch (error) {
    // Fallback button styles
    const buttonStyles = {
      primary: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 px-4 py-2 rounded hover:bg-gray-300',
      destructive: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
    };
    return buttonStyles[variant] || buttonStyles.primary;
  }
};

/**
 * Hook especializado solo para tipografía (alta performance)
 */
export const useTypographyStyles = () => {
  try {
    const { styles } = useThemeStyles();
    return useMemo(() => ({
      h1: styles.header('h1'),
      h2: styles.header('h2'),
      h3: styles.header('h3'),
      body: styles.body(),
      bodyMuted: styles.body('muted'),
      label: styles.label()
    }), [styles]);
  } catch (error) {
    // Fallback typography styles
    return {
      h1: 'text-3xl font-bold',
      h2: 'text-2xl font-bold',
      h3: 'text-xl font-bold',
      body: 'text-base',
      bodyMuted: 'text-base text-gray-600',
      label: 'text-sm font-medium'
    };
  }
};

export default useThemeStyles;