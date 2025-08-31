/**
 * Theme testing utilities for comprehensive theme system testing
 * Provides helpers for testing theme context, styles, and DOM manipulation
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { THEME_CONFIG, DEFAULT_THEME } from '../config/themes';

/**
 * Custom render function with ThemeProvider wrapper
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {string} options.theme - Initial theme ID
 * @param {Object} options.providerProps - Additional ThemeProvider props
 * @returns {Object} - Render result with theme utilities
 */
export const renderWithTheme = (ui, { theme = DEFAULT_THEME, providerProps = {}, ...renderOptions } = {}) => {
  // Mock localStorage for testing
  const mockLocalStorage = {
    getItem: vi.fn(() => theme),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  const Wrapper = ({ children }) => (
    <ThemeProvider {...providerProps}>
      {children}
    </ThemeProvider>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    mockLocalStorage,
  };
};

/**
 * Create a mock theme configuration for testing
 * @param {Object} overrides - Properties to override in the default config
 * @returns {Object} - Mock theme config
 */
export const createMockThemeConfig = (overrides = {}) => ({
  id: 'test-theme',
  name: 'Test Theme',
  type: 'test',
  mode: 'light',
  category: 'test',
  cssClasses: ['test-theme'],
  dataAttributes: { theme: 'test-theme', mode: 'light' },
  ...overrides,
});

/**
 * Create a mock style configuration for testing
 * @param {Object} overrides - Properties to override in the default config
 * @returns {Object} - Mock style config
 */
export const createMockStyleConfig = (overrides = {}) => ({
  card: {
    base: 'bg-card text-card-foreground',
    border: 'border',
    shadow: 'shadow-sm',
    radius: 'rounded-lg'
  },
  button: {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground'
  },
  typography: {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-bold',
    body: 'font-normal',
    label: 'text-sm font-medium'
  },
  input: {
    base: 'border bg-background text-foreground p-2.5',
    radius: 'rounded-md'
  },
  colors: {
    chart: ['#000000', '#111111', '#222222', '#333333', '#444444'],
    accent: '#000000'
  },
  ...overrides,
});

/**
 * Mock theme context value for testing
 * @param {Object} overrides - Properties to override in the default context
 * @returns {Object} - Mock context value
 */
export const createMockThemeContext = (overrides = {}) => ({
  theme: DEFAULT_THEME,
  themeConfig: THEME_CONFIG[DEFAULT_THEME],
  isInitialized: true,
  setTheme: vi.fn(() => true),
  resetTheme: vi.fn(() => true),
  isNeoBrutalism: vi.fn(() => false),
  isMaterial: vi.fn(() => false),
  isFluent: vi.fn(() => false),
  isDark: vi.fn(() => false),
  isLight: vi.fn(() => true),
  availableThemes: Object.values(THEME_CONFIG),
  isValidTheme: vi.fn(() => true),
  ...overrides,
});

/**
 * Verify that DOM elements have correct theme classes
 * @param {Element} element - DOM element to check
 * @param {string} themeId - Expected theme ID
 * @returns {boolean} - Whether element has correct theme classes
 */
export const verifyThemeClasses = (element, themeId) => {
  const themeConfig = THEME_CONFIG[themeId];
  if (!themeConfig) return false;

  return themeConfig.cssClasses.every(className => 
    element.classList.contains(className)
  );
};

/**
 * Verify that DOM elements have correct data attributes
 * @param {Element} element - DOM element to check
 * @param {string} themeId - Expected theme ID
 * @returns {boolean} - Whether element has correct data attributes
 */
export const verifyThemeDataAttributes = (element, themeId) => {
  const themeConfig = THEME_CONFIG[themeId];
  if (!themeConfig) return false;

  return Object.entries(themeConfig.dataAttributes).every(([key, value]) =>
    element.getAttribute(`data-${key}`) === value
  );
};

/**
 * Get all theme classes that should be cleaned up
 * @returns {string[]} - Array of all theme CSS classes
 */
export const getAllThemeClasses = () => {
  return Object.values(THEME_CONFIG).flatMap(config => config.cssClasses);
};

/**
 * Test helper to verify theme switching behavior
 * @param {Function} setTheme - Theme setter function
 * @param {string} fromTheme - Initial theme
 * @param {string} toTheme - Target theme
 * @returns {Promise<boolean>} - Whether theme switching worked correctly
 */
export const testThemeSwitching = async (setTheme, fromTheme, toTheme) => {
  // Apply initial theme
  const initialSuccess = setTheme(fromTheme);
  if (!initialSuccess) return false;

  // Verify initial state
  const root = document.documentElement;
  const body = document.body;
  
  if (!verifyThemeClasses(root, fromTheme) || !verifyThemeClasses(body, fromTheme)) {
    return false;
  }

  // Switch to target theme
  const switchSuccess = setTheme(toTheme);
  if (!switchSuccess) return false;

  // Verify new state
  if (!verifyThemeClasses(root, toTheme) || !verifyThemeClasses(body, toTheme)) {
    return false;
  }

  // Verify old classes were removed
  const oldConfig = THEME_CONFIG[fromTheme];
  if (oldConfig) {
    const hasOldClasses = oldConfig.cssClasses.some(className =>
      root.classList.contains(className) || body.classList.contains(className)
    );
    if (hasOldClasses) return false;
  }

  return true;
};

/**
 * Clean up DOM after theme tests
 */
export const cleanupThemeDOM = () => {
  const root = document.documentElement;
  const body = document.body;
  
  // Remove all theme classes
  const allClasses = getAllThemeClasses();
  root.classList.remove(...allClasses);
  body.classList.remove(...allClasses);

  // Remove all data-theme and data-mode attributes
  root.removeAttribute('data-theme');
  root.removeAttribute('data-mode');
  body.removeAttribute('data-theme');
  body.removeAttribute('data-mode');
};

/**
 * Mock window.localStorage for testing
 * @param {Object} initialData - Initial localStorage data
 * @returns {Object} - Mock localStorage implementation
 */
export const mockLocalStorage = (initialData = {}) => {
  const store = { ...initialData };
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() { return { ...store }; }
  };
};

/**
 * Assert that styles object has expected structure
 * @param {Object} styles - Styles object to validate
 * @returns {boolean} - Whether styles object is valid
 */
export const validateStylesObject = (styles) => {
  const requiredMethods = [
    'container', 'card', 'button', 'header', 'body', 'label',
    'input', 'tab', 'metricCard', 'chartColors', 'accentColor'
  ];
  
  return requiredMethods.every(method => {
    return typeof styles[method] === 'function';
  });
};

/**
 * Test all available themes for basic functionality
 * @param {Function} setTheme - Theme setter function
 * @returns {Promise<Object>} - Test results for each theme
 */
export const testAllThemes = async (setTheme) => {
  const results = {};
  
  for (const [themeId, themeConfig] of Object.entries(THEME_CONFIG)) {
    try {
      const success = setTheme(themeId);
      const domValid = verifyThemeClasses(document.documentElement, themeId);
      const attributesValid = verifyThemeDataAttributes(document.documentElement, themeId);
      
      results[themeId] = {
        success,
        domValid,
        attributesValid,
        overall: success && domValid && attributesValid
      };
    } catch (error) {
      results[themeId] = {
        success: false,
        error: error.message,
        overall: false
      };
    }
  }
  
  return results;
};

// Export all available theme IDs for testing
export const AVAILABLE_THEME_IDS = Object.keys(THEME_CONFIG);

// Export default theme for testing
export const TEST_DEFAULT_THEME = DEFAULT_THEME;