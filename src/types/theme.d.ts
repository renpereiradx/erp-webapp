/**
 * TypeScript definitions for the theme system
 * Provides type safety and IntelliSense for theme-related code
 */

// Theme identifiers
export type ThemeId = 
  | 'neo-brutalism-light'
  | 'neo-brutalism-dark'
  | 'material-light'
  | 'material-dark'
  | 'fluent-light'
  | 'fluent-dark';

// Theme types
export type ThemeType = 'neo-brutalism' | 'material' | 'fluent';

// Theme modes
export type ThemeMode = 'light' | 'dark';

// Theme categories
export type ThemeCategory = 'modern' | 'google' | 'microsoft';

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

// Typography levels
export type TypographyLevel = 'h1' | 'h2' | 'h3';

// Body variants
export type BodyVariant = 'default' | 'muted';

// Color arrays for charts
export type ChartColors = [string, string, string, string, string];

// Data attributes for DOM elements
export interface ThemeDataAttributes {
  theme: string;
  mode: ThemeMode;
  [key: string]: string;
}

// Theme configuration structure
export interface ThemeConfig {
  id: ThemeId;
  name: string;
  type: ThemeType;
  mode: ThemeMode;
  category: ThemeCategory;
  cssClasses: string[];
  dataAttributes: ThemeDataAttributes;
}

// Style configuration for each theme type
export interface StyleVariants {
  primary: string;
  secondary: string;
  destructive: string;
}

export interface TypographyConfig {
  h1: string;
  h2: string;
  h3: string;
  body: string;
  label: string;
}

export interface CardConfig {
  base: string;
  border: string;
  shadow: string;
  radius: string;
}

export interface InputConfig {
  base: string;
  radius: string;
}

export interface ColorConfig {
  chart: ChartColors;
  accent: string;
}

export interface StyleConfig {
  card: CardConfig;
  button: StyleVariants;
  typography: TypographyConfig;
  input: InputConfig;
  colors: ColorConfig;
}

// Theme context value interface
export interface ThemeContextValue {
  // Current state
  theme: ThemeId;
  themeConfig: ThemeConfig;
  isInitialized: boolean;
  
  // Actions
  setTheme: (themeId: ThemeId) => boolean;
  resetTheme: () => boolean;
  
  // Theme detection helpers
  isNeoBrutalism: () => boolean;
  isMaterial: () => boolean;
  isFluent: () => boolean;
  isDark: () => boolean;
  isLight: () => boolean;
  
  // Utilities
  availableThemes: ThemeConfig[];
  isValidTheme: (themeId: string) => themeId is ThemeId;
}

// Styles object interface
export interface ThemeStyles {
  container: (extra?: string) => string;
  card: (extra?: string) => string;
  button: (variant?: ButtonVariant) => string;
  header: (level?: TypographyLevel) => string;
  body: (variant?: BodyVariant) => string;
  label: () => string;
  input: (extra?: string) => string;
  tab: (extra?: string) => string;
  metricCard: () => { border: string; borderRadius: string; boxShadow: string };
  chartColors: () => ChartColors;
  accentColor: () => string;
}

// Theme info interface for useThemeStyles return
export interface ThemeInfo {
  theme: ThemeId;
  type: ThemeType;
  mode: ThemeMode;
  isNeoBrutalism: boolean;
  isMaterial: boolean;
  isFluent: boolean;
  isDark: boolean;
  isLight: boolean;
}

// useThemeStyles hook return type
export interface UseThemeStylesReturn extends ThemeInfo {
  styles: ThemeStyles;
  styleConfig: StyleConfig;
}

// Specialized hook return types
export interface ThemeHelpers {
  isNeoBrutalism: () => boolean;
  isMaterial: () => boolean;
  isFluent: () => boolean;
  isDark: () => boolean;
  isLight: () => boolean;
}

export interface ThemeActions {
  setTheme: (themeId: ThemeId) => boolean;
  resetTheme: () => boolean;
}

export interface TypographyStyles {
  h1: string;
  h2: string;
  h3: string;
  body: string;
  bodyMuted: string;
  label: string;
}

// Configuration maps
export interface ThemeConfigMap {
  [key: string]: ThemeConfig;
}

export interface StyleConfigMap {
  [key: string]: StyleConfig;
}

// Validation and utility function types
export type ThemeValidator = (themeId: string) => themeId is ThemeId;
export type ThemeDetector = (themeId: ThemeId) => boolean;
export type ThemeGetter<T> = (themeId: ThemeId) => T | null;

// Event types (for future use)
export interface ThemeChangeEvent {
  oldTheme: ThemeId;
  newTheme: ThemeId;
  timestamp: number;
}

// Error types
export class ThemeError extends Error {
  constructor(message: string, public readonly themeId?: string) {
    super(message);
    this.name = 'ThemeError';
  }
}

export class ThemeValidationError extends ThemeError {
  constructor(themeId: string) {
    super(`Invalid theme ID: ${themeId}`, themeId);
    this.name = 'ThemeValidationError';
  }
}

export class ThemeApplicationError extends ThemeError {
  constructor(themeId: string, cause?: Error) {
    super(`Failed to apply theme: ${themeId}`, themeId);
    this.name = 'ThemeApplicationError';
    this.cause = cause;
  }
}