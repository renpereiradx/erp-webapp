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
      base: 'bg-card text-card-foreground',
      border: 'border border-border/20',
      shadow: 'shadow-md',
      radius: 'rounded-xl'
    },
    button: {
      primary: 'bg-primary text-primary-foreground rounded-lg shadow-sm hover:shadow-md transition-shadow',
      secondary: 'bg-secondary text-secondary-foreground border rounded-lg hover:bg-secondary/80',
      destructive: 'bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700'
    },
    typography: {
      h1: 'text-3xl font-medium',
      h2: 'text-2xl font-medium',
      h3: 'text-xl font-medium',
      body: 'font-normal',
      label: 'text-sm font-medium'
    },
    input: {
      base: 'border border-border bg-background text-foreground p-3 focus:ring-2 focus:ring-primary/50 focus:border-primary',
      radius: 'rounded-lg'
    },
    colors: {
      chart: ['#6200EE', '#03DAC6', '#B00020', '#FF9800', '#9C27B0'],
      accent: '#6200EE'
    }
  },
  'fluent': {
    card: {
      base: 'bg-card text-card-foreground',
      border: 'border border-border',
      shadow: 'shadow-sm',
      radius: 'rounded-md'
    },
    button: {
      primary: 'bg-blue-600 text-white rounded-sm shadow-sm hover:bg-blue-700 transition-colors',
      secondary: 'bg-gray-100 text-gray-900 border border-gray-300 rounded-sm hover:bg-gray-200',
      destructive: 'bg-red-600 text-white rounded-sm shadow-sm hover:bg-red-700'
    },
    typography: {
      h1: 'text-3xl font-semibold',
      h2: 'text-2xl font-semibold',
      h3: 'text-xl font-semibold',
      body: 'font-normal',
      label: 'text-sm font-medium'
    },
    input: {
      base: 'border border-gray-300 bg-background text-foreground p-2.5 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
      radius: 'rounded-sm'
    },
    colors: {
      chart: ['#0078D4', '#107C10', '#FFB900', '#D13438', '#8764B8'],
      accent: '#0078D4'
    }
  }
};

// Configuraciones adicionales
export const DEFAULT_THEME = 'neo-brutalism-light';
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