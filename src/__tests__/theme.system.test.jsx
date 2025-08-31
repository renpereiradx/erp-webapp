/**
 * Comprehensive theme system tests
 * Tests the entire theme system including context, hooks, and DOM manipulation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Import theme system components
import { ThemeProvider, useTheme, useThemeHelpers, useCurrentTheme, useThemeActions } from '../contexts/ThemeContext';
import { useThemeStyles, useButtonStyles, useTypographyStyles } from '../hooks/useThemeStyles';
import { THEME_CONFIG, DEFAULT_THEME, isValidTheme, getAllThemeClasses } from '../config/themes';

// Import test utilities
import {
  renderWithTheme,
  createMockThemeConfig,
  createMockStyleConfig,
  createMockThemeContext,
  verifyThemeClasses,
  verifyThemeDataAttributes,
  testThemeSwitching,
  cleanupThemeDOM,
  mockLocalStorage,
  validateStylesObject,
  testAllThemes,
  AVAILABLE_THEME_IDS
} from '../utils/themeTestUtils.jsx';

// Mock localStorage globally
const mockStorage = mockLocalStorage();
Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
  writable: true,
});

describe('Theme System', () => {
  beforeEach(() => {
    cleanupThemeDOM();
    vi.clearAllMocks();
    mockStorage.clear();
  });

  afterEach(() => {
    cleanupThemeDOM();
  });

  describe('Theme Configuration', () => {
    it('should have valid default theme', () => {
      expect(DEFAULT_THEME).toBeDefined();
      expect(isValidTheme(DEFAULT_THEME)).toBe(true);
      expect(THEME_CONFIG[DEFAULT_THEME]).toBeDefined();
    });

    it('should validate theme IDs correctly', () => {
      AVAILABLE_THEME_IDS.forEach(themeId => {
        expect(isValidTheme(themeId)).toBe(true);
      });

      expect(isValidTheme('invalid-theme')).toBe(false);
      expect(isValidTheme('')).toBe(false);
      expect(isValidTheme(null)).toBe(false);
      expect(isValidTheme(undefined)).toBe(false);
    });

    it('should have consistent theme configuration structure', () => {
      Object.values(THEME_CONFIG).forEach(config => {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('mode');
        expect(config).toHaveProperty('category');
        expect(config).toHaveProperty('cssClasses');
        expect(config).toHaveProperty('dataAttributes');
        
        expect(Array.isArray(config.cssClasses)).toBe(true);
        expect(typeof config.dataAttributes).toBe('object');
      });
    });

    it('should return all theme classes correctly', () => {
      const allClasses = getAllThemeClasses();
      expect(Array.isArray(allClasses)).toBe(true);
      expect(allClasses.length).toBeGreaterThan(0);
      
      // Verify all classes are strings
      allClasses.forEach(className => {
        expect(typeof className).toBe('string');
        expect(className.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ThemeProvider', () => {
    it('should provide theme context to children', () => {
      const TestComponent = () => {
        const theme = useTheme();
        return <div data-testid="theme-consumer">{theme.theme}</div>;
      };

      renderWithTheme(<TestComponent />);
      
      expect(screen.getByTestId('theme-consumer')).toHaveTextContent(DEFAULT_THEME);
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useTheme();
        return <div>Test</div>;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useTheme must be used within a ThemeProvider'
      );
    });

    it('should initialize with default theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe(DEFAULT_THEME);
      expect(result.current.isInitialized).toBe(true);
    });

    it('should load theme from localStorage', () => {
      const savedTheme = 'material-dark';
      mockStorage.setItem('erp-theme', savedTheme);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe(savedTheme);
    });

    it('should fallback to default theme for invalid saved theme', () => {
      mockStorage.setItem('erp-theme', 'invalid-theme');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe(DEFAULT_THEME);
    });
  });

  describe('Theme Context Actions', () => {
    it('should change theme successfully', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        const success = result.current.setTheme('material-dark');
        expect(success).toBe(true);
      });

      expect(result.current.theme).toBe('material-dark');
    });

    it('should reject invalid theme IDs', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        const success = result.current.setTheme('invalid-theme');
        expect(success).toBe(false);
      });

      expect(result.current.theme).toBe(DEFAULT_THEME);
    });

    it('should reset theme to default', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Change to different theme first
      act(() => {
        result.current.setTheme('fluent-dark');
      });

      expect(result.current.theme).toBe('fluent-dark');

      // Reset to default
      act(() => {
        const success = result.current.resetTheme();
        expect(success).toBe(true);
      });

      expect(result.current.theme).toBe(DEFAULT_THEME);
    });

    it('should persist theme changes to localStorage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('neo-brutalism-dark');
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith('erp-theme', 'neo-brutalism-dark');
    });
  });

  describe('Theme Helpers', () => {
    it('should detect neo-brutalism themes correctly', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('neo-brutalism-light');
      });

      expect(result.current.isNeoBrutalism()).toBe(true);
      expect(result.current.isMaterial()).toBe(false);
      expect(result.current.isFluent()).toBe(false);
    });

    it('should detect material themes correctly', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('material-dark');
      });

      expect(result.current.isNeoBrutalism()).toBe(false);
      expect(result.current.isMaterial()).toBe(true);
      expect(result.current.isFluent()).toBe(false);
      expect(result.current.isDark()).toBe(true);
      expect(result.current.isLight()).toBe(false);
    });

    it('should detect fluent themes correctly', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('fluent-light');
      });

      expect(result.current.isNeoBrutalism()).toBe(false);
      expect(result.current.isMaterial()).toBe(false);
      expect(result.current.isFluent()).toBe(true);
      expect(result.current.isDark()).toBe(false);
      expect(result.current.isLight()).toBe(true);
    });
  });

  describe('Specialized Hooks', () => {
    it('should provide theme helpers only', () => {
      const { result } = renderHook(() => useThemeHelpers(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('isNeoBrutalism');
      expect(result.current).toHaveProperty('isMaterial');
      expect(result.current).toHaveProperty('isFluent');
      expect(result.current).toHaveProperty('isDark');
      expect(result.current).toHaveProperty('isLight');

      // Should not have other properties
      expect(result.current).not.toHaveProperty('theme');
      expect(result.current).not.toHaveProperty('setTheme');
    });

    it('should provide current theme only', () => {
      const { result } = renderHook(() => useCurrentTheme(), {
        wrapper: ThemeProvider,
      });

      expect(typeof result.current).toBe('string');
      expect(result.current).toBe(DEFAULT_THEME);
    });

    it('should provide theme actions only', () => {
      const { result } = renderHook(() => useThemeActions(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('resetTheme');
      expect(typeof result.current.setTheme).toBe('function');
      expect(typeof result.current.resetTheme).toBe('function');

      // Should not have other properties
      expect(result.current).not.toHaveProperty('theme');
      expect(result.current).not.toHaveProperty('isNeoBrutalism');
    });
  });

  describe('useThemeStyles Hook', () => {
    it('should return valid styles object', () => {
      const { result } = renderHook(() => useThemeStyles(), {
        wrapper: ThemeProvider,
      });

      expect(validateStylesObject(result.current.styles)).toBe(true);
    });

    it('should provide theme information', () => {
      const { result } = renderHook(() => useThemeStyles(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('type');
      expect(result.current).toHaveProperty('mode');
      expect(result.current).toHaveProperty('isNeoBrutalism');
      expect(result.current).toHaveProperty('isMaterial');
      expect(result.current).toHaveProperty('isFluent');
      expect(result.current).toHaveProperty('isDark');
      expect(result.current).toHaveProperty('isLight');
    });

    it('should generate different styles for different themes', () => {
      const { result, rerender } = renderHook(() => useThemeStyles(), {
        wrapper: ThemeProvider,
      });

      const brutalistButton = result.current.styles.button('primary');

      // Change theme
      act(() => {
        result.current.setTheme('material-light');
      });

      rerender();

      const materialButton = result.current.styles.button('primary');
      
      expect(brutalistButton).not.toBe(materialButton);
    });
  });

  describe('Specialized Style Hooks', () => {
    it('should provide button styles efficiently', () => {
      const { result } = renderHook(() => useButtonStyles('primary'), {
        wrapper: ThemeProvider,
      });

      expect(typeof result.current).toBe('string');
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('should provide typography styles efficiently', () => {
      const { result } = renderHook(() => useTypographyStyles(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('h1');
      expect(result.current).toHaveProperty('h2');
      expect(result.current).toHaveProperty('h3');
      expect(result.current).toHaveProperty('body');
      expect(result.current).toHaveProperty('bodyMuted');
      expect(result.current).toHaveProperty('label');

      // All values should be strings
      Object.values(result.current).forEach(style => {
        expect(typeof style).toBe('string');
      });
    });
  });

  describe('DOM Manipulation', () => {
    it('should apply theme classes to DOM', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('neo-brutalism-dark');
      });

      expect(verifyThemeClasses(document.documentElement, 'neo-brutalism-dark')).toBe(true);
      expect(verifyThemeClasses(document.body, 'neo-brutalism-dark')).toBe(true);
    });

    it('should apply data attributes to DOM', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await act(async () => {
        result.current.setTheme('material-light');
      });

      expect(verifyThemeDataAttributes(document.documentElement, 'material-light')).toBe(true);
      expect(verifyThemeDataAttributes(document.body, 'material-light')).toBe(true);
    });

    it('should clean up previous theme classes', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Apply first theme
      await act(async () => {
        result.current.setTheme('neo-brutalism-light');
      });

      // Apply second theme
      await act(async () => {
        result.current.setTheme('fluent-dark');
      });

      // Check that old classes are removed
      const oldConfig = THEME_CONFIG['neo-brutalism-light'];
      const hasOldClasses = oldConfig.cssClasses.some(className =>
        document.documentElement.classList.contains(className) ||
        document.body.classList.contains(className)
      );

      expect(hasOldClasses).toBe(false);
      expect(verifyThemeClasses(document.documentElement, 'fluent-dark')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalGetItem = mockStorage.getItem;
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe(DEFAULT_THEME);
      
      // Restore original function
      mockStorage.getItem.mockImplementation(originalGetItem);
    });

    it('should handle DOM manipulation errors gracefully', () => {
      // Mock document.documentElement to be null
      const originalDocumentElement = document.documentElement;
      Object.defineProperty(document, 'documentElement', {
        value: null,
        writable: true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        const success = result.current.setTheme('material-dark');
        expect(success).toBe(false);
      });

      // Restore original
      Object.defineProperty(document, 'documentElement', {
        value: originalDocumentElement,
        writable: true,
      });
    });
  });

  describe('Performance', () => {
    it('should memoize context value to prevent unnecessary re-renders', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        useTheme();
        renderCount++;
        return <div>Test</div>;
      };

      const { rerender } = renderWithTheme(<TestComponent />);

      const initialRenderCount = renderCount;
      
      // Rerender without changing theme
      rerender(<TestComponent />);
      
      // Should not cause additional renders due to memoization
      expect(renderCount).toBe(initialRenderCount);
    });

    it('should only re-render when theme actually changes', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        const { theme, setTheme } = useTheme();
        renderCount++;
        
        // Try to set the same theme
        React.useEffect(() => {
          setTheme(theme);
        }, [theme, setTheme]);
        
        return <div>Test</div>;
      };

      renderWithTheme(<TestComponent />);

      // Should only render once despite calling setTheme with same value
      expect(renderCount).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with theme switching', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      const success = await testThemeSwitching(
        result.current.setTheme,
        'neo-brutalism-light',
        'material-dark'
      );

      expect(success).toBe(true);
    });

    it('should test all available themes', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      const results = await testAllThemes(result.current.setTheme);

      // All themes should pass basic functionality tests
      Object.values(results).forEach(result => {
        expect(result.overall).toBe(true);
      });
    });
  });
});