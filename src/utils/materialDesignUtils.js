/* 
 * Material Design Utility Functions and Helpers
 * Based on Material Design 3.0 specifications
 */

/**
 * Material Design Color Palette
 * Complete color system for Material Design themes
 */
export const materialColors = {
  light: {
    primary: {
      main: '#6200EE',
      light: '#BB86FC',
      dark: '#3700B3',
      on: '#FFFFFF'
    },
    secondary: {
      main: '#03DAC6',
      light: '#66FCF1',
      dark: '#018786',
      on: '#000000'
    },
    surface: {
      main: '#FFFFFF',
      variant: '#F5F5F5',
      on: '#000000',
      onVariant: '#757575'
    },
    background: {
      main: '#FFFFFF',
      on: '#000000'
    },
    error: {
      main: '#B00020',
      on: '#FFFFFF'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.54)',
      disabled: 'rgba(0, 0, 0, 0.38)'
    },
    surfaceContainer: {
      lowest: '#FFFFFF',
      low: '#F7F7F7',
      main: '#F2F2F2',
      high: '#ECECEC',
      highest: '#E6E6E6'
    },
    outline: 'rgba(0, 0, 0, 0.12)',
    outlineVariant: 'rgba(0, 0, 0, 0.06)'
  },
  dark: {
    primary: {
      main: '#BB86FC',
      light: '#BB86FC',
      dark: '#3700B3',
      on: '#000000'
    },
    secondary: {
      main: '#03DAC6',
      light: '#66FCF1',
      dark: '#018786',
      on: '#000000'
    },
    surface: {
      main: '#121212',
      variant: '#2C2C2C',
      on: '#FFFFFF',
      onVariant: '#A8A8A8'
    },
    background: {
      main: '#121212',
      on: '#FFFFFF'
    },
    error: {
      main: '#CF6679',
      on: '#000000'
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.54)',
      disabled: 'rgba(255, 255, 255, 0.38)'
    },
    surfaceContainer: {
      lowest: '#0F0F0F',
      low: '#1A1A1A',
      main: '#1F1F1F',
      high: '#262626',
      highest: '#2D2D2D'
    },
    outline: 'rgba(255, 255, 255, 0.12)',
    outlineVariant: 'rgba(255, 255, 255, 0.06)'
  }
};

/**
 * Material Design Typography Scale
 */
export const materialTypography = {
  displayLarge: {
    fontFamily: 'Roboto',
    fontWeight: 300,
    fontSize: '6rem',
    lineHeight: '6rem',
    letterSpacing: '-0.015625em'
  },
  displayMedium: {
    fontFamily: 'Roboto',
    fontWeight: 300,
    fontSize: '3.75rem',
    lineHeight: '3.75rem',
    letterSpacing: '-0.008333em'
  },
  displaySmall: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: '3rem',
    lineHeight: '3.125rem',
    letterSpacing: '0em'
  },
  headlineLarge: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: '2.125rem',
    lineHeight: '2.5rem',
    letterSpacing: '0.00735em'
  },
  headlineMedium: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: '1.5rem',
    lineHeight: '2rem',
    letterSpacing: '0em'
  },
  headlineSmall: {
    fontFamily: 'Roboto',
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: '2rem',
    letterSpacing: '0.0075em'
  },
  titleLarge: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: '1.75rem',
    letterSpacing: '0.009375em'
  },
  titleMedium: {
    fontFamily: 'Roboto',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.375rem',
    letterSpacing: '0.00714em'
  },
  bodyLarge: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: '1.5rem',
    letterSpacing: '0.009375em'
  },
  bodyMedium: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    letterSpacing: '0.017857em'
  },
  labelLarge: {
    fontFamily: 'Roboto',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '2.25rem',
    letterSpacing: '0.0892857em'
  },
  labelMedium: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.033333em'
  },
  labelSmall: {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontSize: '0.625rem',
    lineHeight: '1.25rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase'
  }
};

/**
 * Material Design Spacing Scale (8dp grid)
 */
export const materialSpacing = {
  1: '8px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '40px',
  6: '48px',
  8: '64px',
  10: '80px',
  12: '96px'
};

/**
 * Material Design Corner Radius Scale
 */
export const materialCorners = {
  none: '0px',
  extraSmall: '4px',
  small: '8px',
  medium: '12px',
  large: '16px',
  extraLarge: '28px'
};

/**
 * Material Design Elevation Shadows
 */
export const materialElevation = {
  0: 'none',
  1: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
  2: '0px 3px 6px rgba(0, 0, 0, 0.15), 0px 2px 4px rgba(0, 0, 0, 0.12)',
  3: '0px 6px 12px rgba(0, 0, 0, 0.15), 0px 4px 8px rgba(0, 0, 0, 0.12)',
  4: '0px 8px 16px rgba(0, 0, 0, 0.15), 0px 6px 12px rgba(0, 0, 0, 0.12)',
  5: '0px 12px 24px rgba(0, 0, 0, 0.15), 0px 8px 16px rgba(0, 0, 0, 0.12)'
};

/**
 * Material Design Component Heights
 */
export const materialComponentHeights = {
  small: '32px',
  medium: '40px',
  large: '48px',
  extraLarge: '56px'
};

/**
 * Material Design State Layers
 */
export const materialStateLayers = {
  hover: {
    light: 'rgba(98, 0, 238, 0.08)',
    dark: 'rgba(187, 134, 252, 0.08)'
  },
  focus: {
    light: 'rgba(98, 0, 238, 0.12)',
    dark: 'rgba(187, 134, 252, 0.12)'
  },
  pressed: {
    light: 'rgba(98, 0, 238, 0.16)',
    dark: 'rgba(187, 134, 252, 0.16)'
  },
  dragged: {
    light: 'rgba(98, 0, 238, 0.16)',
    dark: 'rgba(187, 134, 252, 0.16)'
  }
};

/**
 * Utility function to get Material Design theme colors
 * @param {string} theme - 'light' or 'dark'
 * @returns {object} Color palette for the specified theme
 */
export const getMaterialColors = (theme = 'light') => {
  return materialColors[theme] || materialColors.light;
};

/**
 * Utility function to generate CSS custom properties for Material Design
 * @param {string} theme - 'light' or 'dark'
 * @returns {object} CSS custom properties object
 */
export const generateMaterialCSSProperties = (theme = 'light') => {
  const colors = getMaterialColors(theme);
  
  return {
    '--md-primary-main': colors.primary.main,
    '--md-primary-light': colors.primary.light,
    '--md-primary-dark': colors.primary.dark,
    '--md-on-primary': colors.primary.on,
    '--md-secondary-main': colors.secondary.main,
    '--md-secondary-light': colors.secondary.light,
    '--md-secondary-dark': colors.secondary.dark,
    '--md-on-secondary': colors.secondary.on,
    '--md-surface-main': colors.surface.main,
    '--md-surface-variant': colors.surface.variant,
    '--md-on-surface': colors.surface.on,
    '--md-on-surface-variant': colors.surface.onVariant,
    '--md-background-main': colors.background.main,
    '--md-on-background': colors.background.on,
    '--md-error-main': colors.error.main,
    '--md-on-error': colors.error.on,
    '--md-text-primary': colors.text.primary,
    '--md-text-secondary': colors.text.secondary,
    '--md-text-disabled': colors.text.disabled,
    '--md-outline': colors.outline,
    '--md-outline-variant': colors.outlineVariant
  };
};

/**
 * Utility function to create Material Design style objects for React components
 */
export const createMaterialStyles = {
  /**
   * Create button styles based on Material Design
   * @param {string} variant - 'filled', 'outlined', 'text'
   * @param {string} color - 'primary', 'secondary', 'error'
   * @param {string} size - 'small', 'medium', 'large'
   */
  button: (variant = 'filled', color = 'primary', size = 'medium') => {
    const baseStyles = {
      fontFamily: 'Roboto, sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '2.25rem',
      letterSpacing: '0.0892857em',
      borderRadius: materialCorners.large,
      height: materialComponentHeights[size],
      padding: `0 ${materialSpacing[3]}`,
      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
      cursor: 'pointer',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: materialSpacing[1]
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: `var(--md-${color}-main)`,
          color: `var(--md-on-${color})`,
          boxShadow: materialElevation[1]
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: `var(--md-${color}-main)`,
          border: `1px solid var(--md-outline)`
        };
      case 'text':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: `var(--md-${color}-main)`,
          boxShadow: 'none'
        };
      default:
        return baseStyles;
    }
  },

  /**
   * Create card styles based on Material Design
   * @param {number} elevation - 0 to 5
   */
  card: (elevation = 1) => ({
    backgroundColor: 'var(--md-surface-main)',
    color: 'var(--md-on-surface)',
    borderRadius: materialCorners.medium,
    boxShadow: materialElevation[elevation],
    padding: materialSpacing[2],
    transition: 'box-shadow 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)'
  }),

  /**
   * Create text field styles based on Material Design
   */
  textField: () => ({
    fontFamily: 'Roboto, sans-serif',
    fontSize: '1rem',
    lineHeight: '1.5rem',
    padding: `${materialSpacing[2]} ${materialSpacing[2]}`,
    borderRadius: materialCorners.extraSmall,
    border: `1px solid var(--md-outline)`,
    backgroundColor: 'var(--md-surface-main)',
    color: 'var(--md-on-surface)',
    transition: 'border-color 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    outline: 'none',
    '&:focus': {
      borderColor: 'var(--md-primary-main)',
      boxShadow: `0 0 0 2px var(--md-primary-main)33`
    }
  })
};

/**
 * Hook to check if Material Design theme is active
 */
export const useMaterialTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  return currentTheme?.includes('material');
};

export default {
  materialColors,
  materialTypography,
  materialSpacing,
  materialCorners,
  materialElevation,
  materialComponentHeights,
  materialStateLayers,
  getMaterialColors,
  generateMaterialCSSProperties,
  createMaterialStyles,
  useMaterialTheme
};
