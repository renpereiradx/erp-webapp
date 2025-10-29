/**
 * Theme Context for Fluent Design System 2
 * Simplified implementation with only light/dark modes
 * Documentation: docs/FLUENT_DESIGN_SYSTEM.md
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  THEME_CONFIG,
  DEFAULT_THEME,
  STORAGE_KEY,
  isValidTheme,
  getAllThemeClasses,
  getThemeById,
  isDark,
  isLight,
  toggleTheme as toggleThemeHelper
} from '../config/themes';

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext(null);

// =============================================================================
// THEME APPLICATION
// =============================================================================

/**
 * Apply theme to DOM
 * @param {string} themeId - Theme ID ('light' or 'dark')
 * @returns {boolean} - Success status
 */
const applyThemeToDOM = (themeId) => {
  if (typeof window === 'undefined') return false;

  const themeConfig = getThemeById(themeId);
  if (!themeConfig) return false;

  try {
    const body = document.body;

    // Remove all existing theme classes
    const allThemeClasses = getAllThemeClasses();
    body.classList.remove(...allThemeClasses);

    // Apply new theme class
    body.classList.add(...themeConfig.cssClasses);

    // Set data attributes
    Object.entries(themeConfig.dataAttributes).forEach(([key, value]) => {
      body.setAttribute(`data-${key}`, value);
    });

    return true;
  } catch (error) {
    console.error('Failed to apply theme to DOM:', error);
    return false;
  }
};

// =============================================================================
// THEME PERSISTENCE
// =============================================================================

/**
 * Get initial theme from localStorage or default
 * @returns {string} - Valid theme ID
 */
const getInitialTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (savedTheme && isValidTheme(savedTheme)) {
      return savedTheme;
    }

    return DEFAULT_THEME;
  } catch (error) {
    console.error('Failed to get initial theme:', error);
    return DEFAULT_THEME;
  }
};

/**
 * Persist theme to localStorage
 * @param {string} themeId - Theme ID to persist
 * @returns {boolean} - Success status
 */
const persistTheme = (themeId) => {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(STORAGE_KEY, themeId);
    return true;
  } catch (error) {
    console.error('Failed to persist theme:', error);
    return false;
  }
};

// =============================================================================
// PROVIDER
// =============================================================================

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme());
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Set theme with validation and persistence
   * @param {string} newThemeId - New theme ID
   * @returns {boolean} - Success status
   */
  const setTheme = useCallback((newThemeId) => {
    // Validate theme
    if (!isValidTheme(newThemeId)) {
      console.warn(`Invalid theme ID: ${newThemeId}`);
      return false;
    }

    // Skip if same theme
    if (newThemeId === theme) {
      return true;
    }

    try {
      // Apply to DOM
      const applied = applyThemeToDOM(newThemeId);
      if (!applied) return false;

      // Persist to localStorage
      persistTheme(newThemeId);

      // Update state
      setThemeState(newThemeId);

      return true;
    } catch (error) {
      console.error('Failed to set theme:', error);
      return false;
    }
  }, [theme]);

  /**
   * Toggle between light and dark mode
   */
  const toggleTheme = useCallback(() => {
    const newTheme = toggleThemeHelper(theme);
    return setTheme(newTheme);
  }, [theme, setTheme]);

  /**
   * Reset to default theme
   */
  const resetTheme = useCallback(() => {
    return setTheme(DEFAULT_THEME);
  }, [setTheme]);

  /**
   * Initialize theme on mount
   */
  useEffect(() => {
    if (!isInitialized) {
      const success = applyThemeToDOM(theme);
      if (success) {
        setIsInitialized(true);
      }
    }
  }, [theme, isInitialized]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    // State
    theme,
    isInitialized,
    isDark: isDark(theme),
    isLight: isLight(theme),

    // Actions
    setTheme,
    toggleTheme,
    resetTheme,

    // Config
    themeConfig: getThemeById(theme),
    availableThemes: Object.values(THEME_CONFIG)
  }), [theme, isInitialized, setTheme, toggleTheme, resetTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Main hook to access theme context
 * @returns {Object} - Theme context
 * @throws {Error} - If used outside ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Wrap your component tree with <ThemeProvider>.'
    );
  }

  return context;
};

/**
 * Hook to get only the current theme (optimized)
 * @returns {string} - Current theme ID
 */
export const useCurrentTheme = () => {
  const { theme } = useTheme();
  return theme;
};

/**
 * Hook to get only theme actions (optimized)
 * @returns {Object} - Theme actions
 */
export const useThemeActions = () => {
  const { setTheme, toggleTheme, resetTheme } = useTheme();
  return { setTheme, toggleTheme, resetTheme };
};
