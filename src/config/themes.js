/**
 * Configuración centralizada de temas enterprise-grade
 * Define todos los temas disponibles y sus características
 */

// Configuración de temas disponibles
export const THEME_CONFIG = {
  'neo-brutalism-light': {
    id: 'neo-brutalism-light',
    name: 'Neo-Brutalism Light',
    type: 'neo-brutalism',
    mode: 'light',
    category: 'modern',
    cssClasses: ['neo-brutalism-light'],
    dataAttributes: { theme: 'neo-brutalism-light', mode: 'light' }
  },
  'neo-brutalism-dark': {
    id: 'neo-brutalism-dark',
    name: 'Neo-Brutalism Dark',
    type: 'neo-brutalism',
    mode: 'dark',
    category: 'modern',
    cssClasses: ['neo-brutalism-dark'],
    dataAttributes: { theme: 'neo-brutalism-dark', mode: 'dark' }
  },
  'material-light': {
    id: 'material-light',
    name: 'Material Light',
    type: 'material',
    mode: 'light',
    category: 'google',
    cssClasses: ['material-light'],
    dataAttributes: { theme: 'material-light', mode: 'light' }
  },
  'material-dark': {
    id: 'material-dark',
    name: 'Material Dark',
    type: 'material',
    mode: 'dark',
    category: 'google',
    cssClasses: ['material-dark'],
    dataAttributes: { theme: 'material-dark', mode: 'dark' }
  },
  'fluent-light': {
    id: 'fluent-light',
    name: 'Fluent Light',
    type: 'fluent',
    mode: 'light',
    category: 'microsoft',
    cssClasses: ['fluent-light'],
    dataAttributes: { theme: 'fluent-light', mode: 'light' }
  },
  'fluent-dark': {
    id: 'fluent-dark',
    name: 'Fluent Dark',
    type: 'fluent',
    mode: 'dark',
    category: 'microsoft',
    cssClasses: ['fluent-dark'],
    dataAttributes: { theme: 'fluent-dark', mode: 'dark' }
  },
  'fluent-high-contrast': {
    id: 'fluent-high-contrast',
    name: 'Fluent High Contrast',
    type: 'fluent',
    mode: 'high-contrast',
    category: 'microsoft',
    cssClasses: ['fluent-high-contrast'],
    dataAttributes: { theme: 'fluent-high-contrast', mode: 'high-contrast' },
    accessibility: true,
    description: 'High contrast theme for improved accessibility'
  }
};

// Configuraciones de estilo por tipo de tema
export const STYLE_CONFIG = {
  'neo-brutalism': {
    card: {
      base: 'bg-card text-card-foreground',
      border: 'border-4 border-black',
      shadow: 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
      radius: 'rounded-none'
    },
    button: {
      primary: 'bg-lime-400 text-black font-black uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all',
      secondary: 'bg-background text-foreground font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      destructive: 'bg-red-500 text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
    },
    typography: {
      h1: 'text-3xl font-black uppercase tracking-wide',
      h2: 'text-2xl font-black uppercase tracking-wide',
      h3: 'text-xl font-black uppercase',
      body: 'font-bold',
      label: 'text-sm font-black uppercase tracking-wide'
    },
    input: {
      base: 'border-4 border-black bg-background text-foreground p-3 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      radius: 'rounded-none'
    },
    colors: {
      chart: ['#A3E635', '#3B82F6', '#EC4899', '#F97316', '#8B5CF6'],
      accent: '#A3E635'
    }
  },
  'material': {
    card: {
      base: 'bg-card text-card-foreground md-card',
      border: 'border border-border',
      shadow: 'shadow-md hover:shadow-lg transition-shadow var(--md-motion-duration-short4) var(--md-motion-easing-standard)',
      radius: 'rounded-xl',
      variants: {
        elevated: 'md-card md-card-elevated',
        tonal: 'md-card md-card-tonal',
  outlined: 'md-card md-card-outlined',
  'outlined-soft': 'md-card md-card-outlined-soft',
  'outlined-strong': 'md-card md-card-outlined-strong',
  success: 'md-card md-card-success',
  warning: 'md-card md-card-warning',
  error: 'md-card md-card-error',
  'accent-left': 'md-card md-card-accent-left'
      },
      densities: {
        compact: 'md-card-density-compact',
        comfy: 'md-card-density-comfy',
        spacious: 'md-card-density-spacious'
      }
    },
    button: {
  /* Material 3 canonical variants */
  filled: 'bg-primary text-primary-foreground md-button rounded-[20px] px-6 py-2.5 font-medium shadow-md hover:shadow-lg md-hover-filled transition-all var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden',
  tonal: 'bg-primary-container text-on-primary-container md-button rounded-[20px] px-6 py-2.5 font-medium shadow-sm hover:shadow-md md-hover-tonal transition-all var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden',
  outlined: 'bg-transparent text-primary border border-outline md-button rounded-[20px] px-6 py-2.5 font-medium md-hover-outline transition-all var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden',
  text: 'bg-transparent text-primary md-button rounded-[20px] px-4 py-2 font-medium md-hover-text transition-colors var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden',
  elevated: 'bg-elevation-level1 text-primary md-button rounded-[20px] px-6 py-2.5 font-medium shadow-md hover:shadow-lg md-hover-elevated transition-all var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden',
  destructive: 'bg-destructive text-destructive-foreground md-button rounded-[20px] px-6 py-2.5 font-medium shadow-md hover:shadow-lg transition-all var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden',
  /* Legacy aliases (mantener compatibilidad actual) */
  primary: 'bg-primary text-primary-foreground md-button rounded-[20px] px-6 py-2.5 font-medium shadow-md hover:shadow-lg md-hover-filled transition-all var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden',
  secondary: 'bg-transparent text-primary border border-outline md-button rounded-[20px] px-6 py-2.5 font-medium md-hover-outline transition-all var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden',
  ghost: 'bg-transparent text-primary md-button rounded-[20px] px-4 py-2 font-medium md-hover-text transition-colors var(--md-motion-duration-short4) var(--md-motion-easing-standard) min-h-[40px] relative overflow-hidden'
    },
    typography: {
      h1: 'text-[var(--md-typescale-headline-large-size)] font-[var(--md-typescale-headline-large-weight)] leading-[var(--md-typescale-headline-large-line-height)] text-foreground',
      h2: 'text-[var(--md-typescale-title-large-size)] font-[var(--md-typescale-title-large-weight)] leading-[var(--md-typescale-title-large-line-height)] text-foreground',
      h3: 'text-xl font-medium text-foreground',
      body: 'text-[var(--md-typescale-body-large-size)] font-[var(--md-typescale-body-large-weight)] leading-[var(--md-typescale-body-large-line-height)] text-foreground',
      label: 'text-[var(--md-typescale-label-large-size)] font-[var(--md-typescale-label-large-weight)] leading-[var(--md-typescale-label-large-line-height)] text-foreground'
    },
    input: {
      base: 'md-input md-input-filled',
      radius: 'rounded-lg',
      variants: {
        filled: 'md-input md-input-filled',
        outlined: 'md-input md-input-outlined',
        tonal: 'md-input md-input-tonal',
        error: 'md-input md-input-error',
        success: 'md-input md-input-success',
        warning: 'md-input md-input-warning'
      },
      densities: {
        compact: 'md-input-density-compact',
        comfy: 'md-input-density-comfy',
        spacious: 'md-input-density-spacious'
      }
    },
    colors: {
      chart: ['#6200EE', '#03DAC6', '#B00020', '#FF9800', '#9C27B0'],
      accent: '#6200EE'
    }
  },
  'fluent': {
    card: {
      base: 'fluent-card',
      border: 'border-fluent-card-border',
      shadow: 'shadow-fluent-card hover:shadow-fluent-card-hover transition-all var(--fluent-duration-fast)',
      radius: 'rounded-fluent-corner-large',
      variants: {
        elevated: 'fluent-card-elevated',
        subdued: 'fluent-card-subdued',
        'outline-soft': 'fluent-card-outline-soft',
        'outline-strong': 'fluent-card-outline-strong',
        success: 'fluent-card-success',
        warning: 'fluent-card-warning',
        error: 'fluent-card-error',
        info: 'fluent-card-info',
        'accent-left': 'fluent-card-accent-left'
      },
      densities: {
        compact: 'fluent-card-density-compact',
        comfy: 'fluent-card-density-comfy',
        spacious: 'fluent-card-density-spacious'
      }
    },
    button: {
      primary: 'fluent-button fluent-button-primary',
      secondary: 'fluent-button fluent-button-secondary', 
  destructive: 'fluent-button fluent-button-destructive',
  outline: 'fluent-button fluent-button-outline',
      ghost: 'fluent-button fluent-button-ghost'
    },
    typography: {
      h1: 'fluent-large-title',
      h2: 'fluent-title',
      h3: 'fluent-subtitle',
      body: 'fluent-body',
      bodyLarge: 'fluent-body-large',
      bodyStrong: 'fluent-body-strong',
      label: 'fluent-body-strong',
      caption: 'fluent-caption',
      captionStrong: 'fluent-caption-strong'
    },
    input: {
      base: 'fluent-input',
      radius: 'rounded-fluent-corner-medium',
      variants: {
        subtle: 'fluent-input fluent-input-subtle',
        strong: 'fluent-input fluent-input-strong',
        filled: 'fluent-input fluent-input-filled',
        error: 'fluent-input fluent-input-error',
        success: 'fluent-input fluent-input-success',
        warning: 'fluent-input fluent-input-warning',
        info: 'fluent-input fluent-input-info'
      },
      densities: {
        compact: 'fluent-input-density-compact',
        comfy: 'fluent-input-density-comfy',
        spacious: 'fluent-input-density-spacious'
      }
    },
    menu: {
      base: 'fluent-menu',
      item: 'fluent-menu-item',
      separator: 'fluent-menu-separator'
    },
    colors: {
      chart: ['#0078D4', '#107C10', '#FFB900', '#D13438', '#8764B8', '#2899F5', '#54B054'],
      accent: '#0078D4',
      brand: '#0078D4',
      semantic: {
        success: '#107C10',
        warning: '#FFB900', 
        danger: '#D13438',
        info: '#0078D4'
      }
    },
    motion: {
      duration: {
        fast: 'var(--fluent-duration-fast)',
        normal: 'var(--fluent-duration-normal)',
        slow: 'var(--fluent-duration-slow)'
      },
      easing: {
        ease: 'var(--fluent-curve-easy-ease)',
        decelerate: 'var(--fluent-curve-decelerate-mid)',
        accelerate: 'var(--fluent-curve-accelerate-mid)'
      }
    },
    spacing: {
      none: 'var(--fluent-size-none)',
      xs: 'var(--fluent-size-40)',
      sm: 'var(--fluent-size-80)',
      md: 'var(--fluent-size-120)',
      lg: 'var(--fluent-size-160)',
      xl: 'var(--fluent-size-240)',
      '2xl': 'var(--fluent-size-320)'
    }
  }
};

// Configuraciones adicionales
// Nuevo tema por defecto orientado a diseño Material
export const DEFAULT_THEME = 'material-light';
export const STORAGE_KEY = 'erp-theme';

// Helper functions
export const getAvailableThemes = () => Object.values(THEME_CONFIG);

export const getThemeById = (themeId) => THEME_CONFIG[themeId];

export const getThemesByType = (type) => 
  Object.values(THEME_CONFIG).filter(theme => theme.type === type);

export const getThemesByMode = (mode) => 
  Object.values(THEME_CONFIG).filter(theme => theme.mode === mode);

export const isValidTheme = (themeId) => Boolean(THEME_CONFIG[themeId]);

export const getAllThemeClasses = () => 
  Object.values(THEME_CONFIG).flatMap(theme => theme.cssClasses);

export const getStyleForThemeType = (themeType) => STYLE_CONFIG[themeType];

// Validation helpers
export const validateThemeConfig = (config) => {
  const required = ['id', 'name', 'type', 'mode', 'cssClasses', 'dataAttributes'];
  return required.every(key => key in config);
};

// Theme detection helpers  
export const detectThemeType = (themeId) => {
  const theme = getThemeById(themeId);
  return theme?.type || null;
};

export const detectThemeMode = (themeId) => {
  const theme = getThemeById(themeId);
  return theme?.mode || null;
};

export const isNeoBrutalism = (themeId) => detectThemeType(themeId) === 'neo-brutalism';
export const isMaterial = (themeId) => detectThemeType(themeId) === 'material';
export const isFluent = (themeId) => detectThemeType(themeId) === 'fluent';
export const isDark = (themeId) => detectThemeMode(themeId) === 'dark';
export const isLight = (themeId) => detectThemeMode(themeId) === 'light';
export const isHighContrast = (themeId) => detectThemeMode(themeId) === 'high-contrast';

// Enhanced theme detection
export const getThemeAccessibility = (themeId) => {
  const theme = getThemeById(themeId);
  return theme?.accessibility || false;
};

export const getThemesByAccessibility = (accessible = true) => 
  Object.values(THEME_CONFIG).filter(theme => !!theme.accessibility === accessible);

export const getFluentVariants = () =>
  Object.values(THEME_CONFIG).filter(theme => theme.type === 'fluent');

// Platform detection utilities
export const getPlatformFontFamily = () => {
  if (typeof window === 'undefined') return "'Segoe UI', sans-serif";
  
  const userAgent = window.navigator.userAgent;
  
  if (/Windows/.test(userAgent)) {
    return "'Segoe UI Variable', 'Segoe UI', sans-serif";
  } else if (/Mac/.test(userAgent)) {
    return "'SF Pro Display', 'San Francisco Pro', -apple-system, BlinkMacSystemFont, sans-serif";
  } else if (/Android/.test(userAgent)) {
    return "'Roboto', sans-serif";
  } else if (/iOS/.test(userAgent)) {
    return "'SF Pro Display', 'San Francisco Pro', -apple-system, BlinkMacSystemFont, sans-serif";
  }
  
  return "'Segoe UI', sans-serif";
};

export const applyPlatformTypography = (element) => {
  if (element) {
    element.style.fontFamily = getPlatformFontFamily();
  }
};