/**
 * Enterprise Theme System - Wave 4 UX & Accessibility
 * Sistema de temas dinámico con soporte WCAG 2.1 AA
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

// Definición de tokens de diseño base
export const designTokens = {
  // Espaciado siguiendo escala 8pt
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  
  // Tipografía responsive
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      md: '1rem',      // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem',   // 32px
      '4xl': '2.5rem'  // 40px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  
  // Breakpoints enterprise
  breakpoints: {
    mobile: '320px',
    mobileLg: '480px',
    tablet: '768px',
    desktop: '1024px',
    desktopLg: '1440px',
    ultrawide: '1920px'
  },
  
  // Shadows con niveles semánticos
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    focus: '0 0 0 3px rgba(59, 130, 246, 0.5)' // Focus ring accesible
  },
  
  // Border radius sistemático
  borderRadius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '9999px'
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070
  }
};

// Tema claro enterprise
export const lightTheme = {
  name: 'light',
  displayName: 'Claro',
  
  colors: {
    // Colores principales
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // Principal
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    
    // Colores secundarios
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',  // Secundario
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    
    // Estados semánticos
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    },
    info: {
      50: '#f0f9ff',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490'
    },
    
    // Superficie y texto
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9'
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      elevated: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
      disabled: '#94a3b8'
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#3b82f6'
    }
  },
  
  // Accesibilidad
  accessibility: {
    focusRing: '0 0 0 3px rgba(59, 130, 246, 0.5)',
    highContrast: false,
    minContrast: {
      normal: 4.5,  // WCAG AA
      large: 3.0    // WCAG AA large text
    }
  }
};

// Tema oscuro enterprise
export const darkTheme = {
  name: 'dark',
  displayName: 'Oscuro',
  
  colors: {
    // Colores principales (ajustados para fondo oscuro)
    primary: {
      50: '#1e3a8a',
      100: '#1e40af',
      200: '#1d4ed8',
      300: '#2563eb',
      400: '#3b82f6',
      500: '#60a5fa',  // Principal en oscuro
      600: '#93c5fd',
      700: '#bfdbfe',
      800: '#dbeafe',
      900: '#eff6ff'
    },
    
    secondary: {
      50: '#0f172a',
      100: '#1e293b',
      200: '#334155',
      300: '#475569',
      400: '#64748b',
      500: '#94a3b8',  // Secundario
      600: '#cbd5e1',
      700: '#e2e8f0',
      800: '#f1f5f9',
      900: '#f8fafc'
    },
    
    // Estados semánticos (optimizados para oscuro)
    success: {
      50: '#14532d',
      500: '#4ade80',
      600: '#22c55e',
      700: '#16a34a'
    },
    warning: {
      50: '#92400e',
      500: '#fbbf24',
      600: '#f59e0b',
      700: '#d97706'
    },
    error: {
      50: '#991b1b',
      500: '#f87171',
      600: '#ef4444',
      700: '#dc2626'
    },
    info: {
      50: '#164e63',
      500: '#22d3ee',
      600: '#06b6d4',
      700: '#0891b2'
    },
    
    // Superficie y texto
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155'
    },
    surface: {
      primary: '#1e293b',
      secondary: '#334155',
      elevated: '#475569'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#e2e8f0',
      tertiary: '#cbd5e1',
      inverse: '#0f172a',
      disabled: '#64748b'
    },
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#60a5fa'
    }
  },
  
  accessibility: {
    focusRing: '0 0 0 3px rgba(96, 165, 250, 0.5)',
    highContrast: false,
    minContrast: {
      normal: 4.5,
      large: 3.0
    }
  }
};

// Tema de alto contraste (WCAG AAA)
export const highContrastTheme = {
  name: 'high-contrast',
  displayName: 'Alto Contraste',
  
  colors: {
    primary: {
      500: '#000000'
    },
    secondary: {
      500: '#666666'
    },
    
    success: {
      500: '#008000'
    },
    warning: {
      500: '#ff8c00'
    },
    error: {
      500: '#ff0000'
    },
    info: {
      500: '#0000ff'
    },
    
    background: {
      primary: '#ffffff',
      secondary: '#f0f0f0',
      tertiary: '#e0e0e0'
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f0f0f0',
      elevated: '#ffffff'
    },
    text: {
      primary: '#000000',
      secondary: '#000000',
      tertiary: '#333333',
      inverse: '#ffffff',
      disabled: '#666666'
    },
    border: {
      primary: '#000000',
      secondary: '#333333',
      focus: '#ff0000'
    }
  },
  
  accessibility: {
    focusRing: '0 0 0 4px #ff0000',
    highContrast: true,
    minContrast: {
      normal: 7.0,  // WCAG AAA
      large: 4.5    // WCAG AAA large text
    }
  }
};

// Tema enterprise personalizable
export const enterpriseTheme = {
  name: 'enterprise',
  displayName: 'Corporativo',
  
  // Base similar al tema claro pero con colores personalizables
  colors: {
    primary: {
      500: 'var(--brand-primary, #3b82f6)'
    },
    secondary: {
      500: 'var(--brand-secondary, #64748b)'
    },
    // ... resto usando CSS custom properties para personalización
  }
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  'high-contrast': highContrastTheme,
  enterprise: enterpriseTheme
};

export default themes;
