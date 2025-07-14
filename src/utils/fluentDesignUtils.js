/* 
 * Fluent Design System 2.0 Utility Functions and Helpers
 * Based on Microsoft Fluent 2.0 specifications
 */

/**
 * Fluent Design Color Palette
 * Complete color system for Fluent Design themes
 */
export const fluentColors = {
  light: {
    brand: {
      primary: '#0078D4',
      primaryHover: '#005A9E',
      primaryPressed: '#004578',
      primarySelected: '#0078D4',
      secondary: '#40E0D0',
      tertiary: '#0078D4'
    },
    neutral: {
      white: '#FFFFFF',
      black: '#000000',
      grey10: '#FAF9F8',
      grey20: '#F3F2F1',
      grey30: '#EDEBE9',
      grey40: '#E1DFDD',
      grey50: '#D2D0CE',
      grey60: '#C8C6C4',
      grey70: '#BEBBB8',
      grey80: '#B3B0AD',
      grey90: '#A19F9D',
      grey100: '#979593',
      grey110: '#8A8886',
      grey120: '#797775',
      grey130: '#605E5C',
      grey140: '#484644',
      grey150: '#323130',
      grey160: '#201F1E'
    },
    semantic: {
      success: '#107C10',
      warning: '#FFB900',
      danger: '#D13438',
      severe: '#D13438',
      caution: '#FFB900',
      info: '#0078D4'
    },
    text: {
      primary: '#212121',
      secondary: '#605E5C',
      tertiary: '#8A8886',
      disabled: '#A19F9D',
      accent: '#0078D4',
      onAccent: '#FFFFFF',
      onAccentSelected: '#FFFFFF'
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#FAF9F8',
      tertiary: '#F3F2F1',
      quaternary: '#EDEBE9',
      alt: '#FAFAFA',
      card: '#FFFFFF',
      cardHover: '#F8F8F8',
      cardPressed: '#F0F0F0'
    },
    background: {
      canvas: '#FAFAFA',
      application: '#F3F2F1',
      layer: '#FFFFFF',
      layerAlt: '#F8F7F6',
      overlay: 'rgba(255, 255, 255, 0.95)'
    },
    border: {
      neutral: '#E1DFDD',
      neutralVariant: '#C8C6C4',
      onAccent: 'rgba(255, 255, 255, 0.1)',
      accent: '#0078D4',
      focus: '#605E5C'
    }
  },
  dark: {
    brand: {
      primary: '#2899F5',
      primaryHover: '#479EF5',
      primaryPressed: '#6BB6FF',
      primarySelected: '#2899F5',
      secondary: '#40E0D0',
      tertiary: '#2899F5'
    },
    neutral: {
      white: '#FFFFFF',
      black: '#000000',
      grey10: '#0B0A0A',
      grey20: '#151414',
      grey30: '#1E1D1D',
      grey40: '#292827',
      grey50: '#343332',
      grey60: '#3F3E3D',
      grey70: '#4A4948',
      grey80: '#565554',
      grey90: '#61605F',
      grey100: '#6C6B6A',
      grey110: '#787776',
      grey120: '#8A8886',
      grey130: '#9C9A99',
      grey140: '#B3B0AD',
      grey150: '#BEBBB8',
      grey160: '#C8C6C4'
    },
    semantic: {
      success: '#54B054',
      warning: '#FCE100',
      danger: '#F7630C',
      severe: '#F7630C',
      caution: '#FCE100',
      info: '#2899F5'
    },
    text: {
      primary: '#F3F2F1',
      secondary: '#C8C6C4',
      tertiary: '#8A8886',
      disabled: '#605E5C',
      accent: '#2899F5',
      onAccent: '#000000',
      onAccentSelected: '#000000'
    },
    surface: {
      primary: '#201F1E',
      secondary: '#292827',
      tertiary: '#323130',
      quaternary: '#3B3A39',
      alt: '#1B1A19',
      card: '#292827',
      cardHover: '#343332',
      cardPressed: '#3B3A39'
    },
    background: {
      canvas: '#201F1E',
      application: '#1B1A19',
      layer: '#292827',
      layerAlt: '#323130',
      overlay: 'rgba(32, 31, 30, 0.95)'
    },
    border: {
      neutral: '#3B3A39',
      neutralVariant: '#484644',
      onAccent: 'rgba(0, 0, 0, 0.1)',
      accent: '#2899F5',
      focus: '#C8C6C4'
    }
  }
};

/**
 * Fluent Design Typography Scale
 */
export const fluentTypography = {
  display: {
    fontFamily: 'Segoe UI',
    fontWeight: 600,
    fontSize: '4.25rem',
    lineHeight: '5.75rem',
    letterSpacing: '-0.02em'
  },
  largeTitle: {
    fontFamily: 'Segoe UI',
    fontWeight: 600,
    fontSize: '2.5rem',
    lineHeight: '3.25rem',
    letterSpacing: '-0.01em'
  },
  title: {
    fontFamily: 'Segoe UI',
    fontWeight: 600,
    fontSize: '1.75rem',
    lineHeight: '2.25rem',
    letterSpacing: '0em'
  },
  subtitle: {
    fontFamily: 'Segoe UI',
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    letterSpacing: '0em'
  },
  bodyLarge: {
    fontFamily: 'Segoe UI',
    fontWeight: 400,
    fontSize: '1.125rem',
    lineHeight: '1.5rem',
    letterSpacing: '0em'
  },
  body: {
    fontFamily: 'Segoe UI',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    letterSpacing: '0em'
  },
  bodyStrong: {
    fontFamily: 'Segoe UI',
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    letterSpacing: '0em'
  },
  caption: {
    fontFamily: 'Segoe UI',
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0em'
  },
  captionStrong: {
    fontFamily: 'Segoe UI',
    fontWeight: 600,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0em'
  }
};

/**
 * Fluent Design Spacing Tokens
 */
export const fluentSpacing = {
  none: '0px',
  20: '2px',
  40: '4px',
  60: '6px',
  80: '8px',
  100: '10px',
  120: '12px',
  160: '16px',
  200: '20px',
  240: '24px',
  280: '28px',
  320: '32px',
  360: '36px',
  400: '40px',
  480: '48px',
  520: '52px',
  560: '56px'
};

/**
 * Fluent Design Corner Radius Scale
 */
export const fluentCorners = {
  none: '0px',
  small: '2px',
  medium: '4px',
  large: '6px',
  xlarge: '8px',
  circular: '10000px'
};

/**
 * Fluent Design Elevation Shadows
 */
export const fluentElevation = {
  2: '0px 1px 2px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
  4: '0px 2px 4px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
  8: '0px 4px 8px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
  16: '0px 8px 16px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
  28: '0px 14px 28px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.20)',
  64: '0px 32px 64px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.20)'
};

/**
 * Fluent Design Component Heights
 */
export const fluentComponentHeights = {
  small: '24px',
  medium: '32px',
  large: '40px',
  xlarge: '48px'
};

/**
 * Fluent Design Motion and Animation
 */
export const fluentMotion = {
  duration: {
    ultraFast: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    gentle: '250ms',
    slow: '300ms',
    slower: '400ms',
    ultraSlow: '500ms'
  },
  curves: {
    accelerateMax: 'cubic-bezier(1, 0, 1, 1)',
    accelerateMid: 'cubic-bezier(0.7, 0, 1, 0.5)',
    accelerateMin: 'cubic-bezier(0.8, 0, 0.78, 1)',
    decelerateMax: 'cubic-bezier(0, 0, 0, 1)',
    decelerateMid: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
    decelerateMin: 'cubic-bezier(0.33, 0, 0.1, 1)',
    easyEase: 'cubic-bezier(0.33, 0, 0.67, 1)',
    linear: 'cubic-bezier(0, 0, 1, 1)'
  }
};

/**
 * Utility function to get Fluent Design theme colors
 * @param {string} theme - 'light' or 'dark'
 * @returns {object} Color palette for the specified theme
 */
export const getFluentColors = (theme = 'light') => {
  return fluentColors[theme] || fluentColors.light;
};

/**
 * Utility function to generate CSS custom properties for Fluent Design
 * @param {string} theme - 'light' or 'dark'
 * @returns {object} CSS custom properties object
 */
export const generateFluentCSSProperties = (theme = 'light') => {
  const colors = getFluentColors(theme);
  
  return {
    '--fluent-brand-primary': colors.brand.primary,
    '--fluent-brand-primary-hover': colors.brand.primaryHover,
    '--fluent-brand-primary-pressed': colors.brand.primaryPressed,
    '--fluent-text-primary': colors.text.primary,
    '--fluent-text-secondary': colors.text.secondary,
    '--fluent-text-on-accent': colors.text.onAccent,
    '--fluent-surface-primary': colors.surface.primary,
    '--fluent-surface-card': colors.surface.card,
    '--fluent-background-canvas': colors.background.canvas,
    '--fluent-border-neutral': colors.border.neutral,
    '--fluent-semantic-success': colors.semantic.success,
    '--fluent-semantic-warning': colors.semantic.warning,
    '--fluent-semantic-danger': colors.semantic.danger
  };
};

/**
 * Utility function to create Fluent Design style objects for React components
 */
export const createFluentStyles = {
  /**
   * Create button styles based on Fluent Design
   * @param {string} variant - 'primary', 'default', 'outline', 'subtle', 'transparent'
   * @param {string} size - 'small', 'medium', 'large'
   * @param {string} appearance - 'primary', 'secondary', 'outline', 'subtle', 'transparent'
   */
  button: (variant = 'default', size = 'medium', appearance = 'primary') => {
    const baseStyles = {
      fontFamily: 'Segoe UI, sans-serif',
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      borderRadius: fluentCorners.medium,
      border: '1px solid transparent',
      transition: `all var(--fluent-duration-fast) var(--fluent-curve-easy-ease)`,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: fluentSpacing[80],
      outline: 'none',
      position: 'relative'
    };

    // Size variations
    const sizeStyles = {
      small: {
        height: fluentComponentHeights.small,
        padding: `0 ${fluentSpacing[120]}`,
        fontSize: '0.75rem'
      },
      medium: {
        height: fluentComponentHeights.medium,
        padding: `0 ${fluentSpacing[160]}`
      },
      large: {
        height: fluentComponentHeights.large,
        padding: `0 ${fluentSpacing[200]}`
      }
    };

    // Appearance variations
    const appearanceStyles = {
      primary: {
        backgroundColor: 'var(--fluent-brand-primary)',
        color: 'var(--fluent-text-on-accent)',
        '&:hover': {
          backgroundColor: 'var(--fluent-brand-primary-hover)'
        },
        '&:active': {
          backgroundColor: 'var(--fluent-brand-primary-pressed)'
        }
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--fluent-brand-primary)',
        borderColor: 'var(--fluent-border-neutral)',
        '&:hover': {
          backgroundColor: 'var(--fluent-surface-card-hover)'
        }
      },
      subtle: {
        backgroundColor: 'transparent',
        color: 'var(--fluent-text-primary)',
        '&:hover': {
          backgroundColor: 'var(--fluent-surface-card-hover)'
        }
      },
      transparent: {
        backgroundColor: 'transparent',
        color: 'var(--fluent-brand-primary)',
        '&:hover': {
          backgroundColor: 'var(--fluent-surface-card-hover)'
        }
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...appearanceStyles[appearance]
    };
  },

  /**
   * Create card styles based on Fluent Design
   * @param {number} elevation - 2, 4, 8, 16, 28, 64
   * @param {boolean} interactive - Whether the card is interactive
   */
  card: (elevation = 4, interactive = false) => {
    const baseStyles = {
      backgroundColor: 'var(--fluent-surface-card)',
      color: 'var(--fluent-text-primary)',
      borderRadius: fluentCorners.large,
      border: '1px solid var(--fluent-border-neutral)',
      padding: fluentSpacing[160],
      boxShadow: fluentElevation[elevation]
    };

    if (interactive) {
      return {
        ...baseStyles,
        cursor: 'pointer',
        transition: `all var(--fluent-duration-fast) var(--fluent-curve-easy-ease)`,
        '&:hover': {
          backgroundColor: 'var(--fluent-surface-card-hover)',
          boxShadow: fluentElevation[Math.min(elevation + 4, 64)]
        },
        '&:active': {
          backgroundColor: 'var(--fluent-surface-card-pressed)',
          transform: 'scale(0.98)'
        }
      };
    }

    return baseStyles;
  },

  /**
   * Create input field styles based on Fluent Design
   * @param {string} size - 'small', 'medium', 'large'
   * @param {boolean} error - Whether the input has an error state
   */
  input: (size = 'medium', error = false) => {
    const baseStyles = {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      backgroundColor: 'var(--fluent-surface-primary)',
      color: 'var(--fluent-text-primary)',
      border: '1px solid var(--fluent-border-neutral)',
      borderRadius: fluentCorners.medium,
      outline: 'none',
      transition: `all var(--fluent-duration-fast) var(--fluent-curve-easy-ease)`,
      '&:focus': {
        borderColor: 'var(--fluent-brand-primary)',
        boxShadow: `0 0 0 1px var(--fluent-brand-primary)`
      },
      '&::placeholder': {
        color: 'var(--fluent-text-tertiary)'
      }
    };

    const sizeStyles = {
      small: {
        height: fluentComponentHeights.small,
        padding: `0 ${fluentSpacing[80]}`
      },
      medium: {
        height: fluentComponentHeights.medium,
        padding: `0 ${fluentSpacing[120]}`
      },
      large: {
        height: fluentComponentHeights.large,
        padding: `0 ${fluentSpacing[160]}`
      }
    };

    const errorStyles = error ? {
      borderColor: 'var(--fluent-semantic-danger)',
      '&:focus': {
        borderColor: 'var(--fluent-semantic-danger)',
        boxShadow: `0 0 0 1px var(--fluent-semantic-danger)`
      }
    } : {};

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...errorStyles
    };
  }
};

/**
 * Hook to check if Fluent Design theme is active
 */
export const useFluentTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  return currentTheme?.includes('fluent');
};

/**
 * Utility function to apply Fluent motion to elements
 * @param {string} motion - 'fade-in', 'slide-up', 'scale-in'
 * @returns {object} CSS styles for motion
 */
export const applyFluentMotion = (motion = 'fade-in') => {
  const motionStyles = {
    'fade-in': {
      animation: `fluent-fade-in var(--fluent-duration-normal) var(--fluent-curve-decelerate-mid)`
    },
    'slide-up': {
      animation: `fluent-slide-up var(--fluent-duration-normal) var(--fluent-curve-decelerate-mid)`
    },
    'scale-in': {
      animation: `fluent-scale-in var(--fluent-duration-normal) var(--fluent-curve-decelerate-mid)`
    }
  };

  return motionStyles[motion] || motionStyles['fade-in'];
};

export default {
  fluentColors,
  fluentTypography,
  fluentSpacing,
  fluentCorners,
  fluentElevation,
  fluentComponentHeights,
  fluentMotion,
  getFluentColors,
  generateFluentCSSProperties,
  createFluentStyles,
  useFluentTheme,
  applyFluentMotion
};
