/**
 * Theme styles hook - Simplified for Fluent Design System 2 migration
 *
 * DEPRECATION NOTICE:
 * This hook is maintained for backward compatibility during the Sass migration.
 * New components should use Sass/SCSS classes directly with BEM methodology.
 * See: docs/PAGE_MIGRATION_GUIDE.md
 *
 * For legacy pages not yet migrated, this hook returns Tailwind classes.
 * Once a page is migrated to Sass, remove usage of this hook.
 */

import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook for legacy theme styles (Tailwind-based)
 * @deprecated Use Sass/SCSS classes with BEM methodology instead
 * @returns {Object} - Theme info and style helpers
 */
export const useThemeStyles = () => {
  // Get theme from context
  let theme, isDark, isLight, setTheme, resetTheme, toggleTheme;

  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    isDark = themeContext.isDark;
    isLight = themeContext.isLight;
    setTheme = themeContext.setTheme;
    resetTheme = themeContext.resetTheme;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    // Fallback values if outside ThemeProvider
    theme = 'light';
    isDark = false;
    isLight = true;
    setTheme = () => {};
    resetTheme = () => {};
    toggleTheme = () => {};
  }

  // Theme info (simplified - no more type distinctions)
  const themeInfo = useMemo(() => ({
    theme,
    mode: theme, // 'light' or 'dark'
    isDark,
    isLight,
    // Legacy compatibility (all false since we removed multi-theme support)
    isNeoBrutalism: false,
    isMaterial: false,
    isFluent: true, // Always Fluent now
    type: 'fluent' // Always Fluent
  }), [theme, isDark, isLight]);

  // Fallback Tailwind styles for non-migrated pages
  const styles = useMemo(() => ({
    // Container styles
    container: (extra = '') =>
      `bg-background text-foreground border rounded-lg shadow-sm p-6 ${extra}`.trim(),

    // Page container (no border/shadow)
    page: (extra = '') =>
      `bg-background text-foreground w-full ${extra}`.trim(),

    // Card styles
    card: (variantOrExtra = '', maybeExtra = '') => {
      const base = 'bg-card text-card-foreground border rounded-lg shadow-sm';
      const extra = typeof maybeExtra === 'string' ? maybeExtra : variantOrExtra;
      return `${base} ${extra}`.trim();
    },

    // Button styles
    button: (variant = 'primary') => {
      const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border px-4 py-2 rounded-md font-medium transition-colors',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md font-medium transition-colors',
        ghost: 'hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md font-medium transition-colors',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md font-medium transition-colors'
      };
      return variants[variant] || variants.primary;
    },

    // Typography
    header: (level = 'h1') => {
      const levels = {
        h1: 'text-3xl font-semibold text-foreground',
        h2: 'text-2xl font-semibold text-foreground',
        h3: 'text-xl font-semibold text-foreground',
        h4: 'text-lg font-semibold text-foreground',
        h5: 'text-base font-semibold text-foreground',
        h6: 'text-sm font-semibold text-foreground'
      };
      return levels[level] || levels.h1;
    },

    body: (variant = 'default') =>
      variant === 'muted'
        ? 'text-base text-muted-foreground'
        : 'text-base text-foreground',

    label: () =>
      'text-sm font-medium text-foreground',

    // Input styles
    input: (variantOrExtra = '', maybeOptions = '') => {
      const base = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
      const extra = typeof maybeOptions === 'string' ? maybeOptions : variantOrExtra;
      return `${base} ${extra}`.trim();
    },

    // Tab styles
    tab: (extra = '') =>
      `border rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-sm font-medium transition-all ${extra}`.trim(),

    // Metric card (for charts/dashboards)
    metricCard: () => ({
      border: '1px solid hsl(var(--border))',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    }),

    // Chart colors
    chartColors: () => [
      '#0078D4', // Fluent primary blue
      '#107C10', // Fluent success green
      '#FFB900', // Fluent warning yellow
      '#D13438', // Fluent error red
      '#8764B8', // Fluent purple
      '#2899F5', // Fluent light blue
      '#54B054'  // Fluent light green
    ],

    // Accent color
    accentColor: () => '#0078D4',

    // Badge styles
    badge: (variant = 'primary') => {
      const base = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border';
      const variants = {
        primary: `${base} bg-primary/10 text-primary border-primary/20`,
        secondary: `${base} bg-muted text-muted-foreground border-border`,
        success: `${base} bg-green-50 text-green-700 border-green-200`,
        warning: `${base} bg-yellow-50 text-yellow-700 border-yellow-200`,
        error: `${base} bg-red-50 text-red-700 border-red-200`,
        info: `${base} bg-blue-50 text-blue-700 border-blue-200`
      };
      return variants[variant] || variants.primary;
    },

    // Card sections
    cardHeader: () => 'border-b border-border',
    cardFooter: () => 'border-t border-border',
    cardSeparator: () => 'border-b border-border/50',
    cardNote: () => 'bg-muted/30 rounded-md'
  }), []);

  // Card variant helper
  const cardVariant = (variant, options = {}) => styles.card(variant, options);

  return {
    ...themeInfo,
    styles,
    cardVariant,
    // Legacy styleConfig (empty since we're using Sass now)
    styleConfig: {},
    // Actions
    setTheme,
    resetTheme,
    toggleTheme
  };
};

/**
 * Hook for button styles
 * @deprecated Use btn and btn--{variant} classes instead
 */
export const useButtonStyles = (variant = 'primary') => {
  const { styles } = useThemeStyles();
  return useMemo(() => styles.button(variant), [styles, variant]);
};

/**
 * Hook for typography styles
 * @deprecated Use heading-{n} and body classes instead
 */
export const useTypographyStyles = () => {
  const { styles } = useThemeStyles();
  return useMemo(() => ({
    h1: styles.header('h1'),
    h2: styles.header('h2'),
    h3: styles.header('h3'),
    h4: styles.header('h4'),
    h5: styles.header('h5'),
    h6: styles.header('h6'),
    body: styles.body(),
    bodyMuted: styles.body('muted'),
    label: styles.label()
  }), [styles]);
};

export default useThemeStyles;
