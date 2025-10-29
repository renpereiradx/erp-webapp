/**
 * Configuración de temas basada en Microsoft Fluent Design System 2
 * Solo dos modos: Light y Dark
 * Documentación: docs/FLUENT_DESIGN_SYSTEM.md
 */

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

export const THEME_CONFIG = {
  light: {
    id: 'light',
    name: 'Light Mode',
    mode: 'light',
    cssClasses: ['theme--light'],
    dataAttributes: { mode: 'light' }
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    mode: 'dark',
    cssClasses: ['theme--dark'],
    dataAttributes: { mode: 'dark' }
  }
};

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

export const DEFAULT_THEME = 'light';
export const STORAGE_KEY = 'erp-theme-mode';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all available themes
 * @returns {Array} - Array of theme objects
 */
export const getAvailableThemes = () => Object.values(THEME_CONFIG);

/**
 * Get theme configuration by ID
 * @param {string} themeId - Theme ID ('light' or 'dark')
 * @returns {Object|null} - Theme configuration or null
 */
export const getThemeById = (themeId) => THEME_CONFIG[themeId] || null;

/**
 * Validate if a theme ID exists
 * @param {string} themeId - Theme ID to validate
 * @returns {boolean} - true if valid
 */
export const isValidTheme = (themeId) => Boolean(THEME_CONFIG[themeId]);

/**
 * Get all theme CSS classes
 * @returns {Array} - Array of all CSS classes
 */
export const getAllThemeClasses = () =>
  Object.values(THEME_CONFIG).flatMap(theme => theme.cssClasses);

/**
 * Check if theme is dark mode
 * @param {string} themeId - Theme ID
 * @returns {boolean} - true if dark mode
 */
export const isDark = (themeId) => themeId === 'dark';

/**
 * Check if theme is light mode
 * @param {string} themeId - Theme ID
 * @returns {boolean} - true if light mode
 */
export const isLight = (themeId) => themeId === 'light';

/**
 * Get opposite theme
 * @param {string} themeId - Current theme ID
 * @returns {string} - Opposite theme ID
 */
export const getOppositeTheme = (themeId) =>
  themeId === 'light' ? 'dark' : 'light';

/**
 * Toggle between light and dark
 * @param {string} currentTheme - Current theme ID
 * @returns {string} - New theme ID
 */
export const toggleTheme = (currentTheme) => getOppositeTheme(currentTheme);
