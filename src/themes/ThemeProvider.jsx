/**
 * Enterprise Theme Provider - Wave 4 UX & Accessibility
 * Proveedor de temas con transiciones suaves y persistencia
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { themes, designTokens } from './themes';

// Context para el sistema de temas
const ThemeContext = createContext({
  currentTheme: 'light',
  theme: themes.light,
  setTheme: () => {},
  availableThemes: Object.keys(themes),
  isTransitioning: false,
  systemPreference: 'light'
});

// Hook para usar el contexto de temas
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

// Utilidad para detectar preferencia del sistema
const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
};

// Utilidad para aplicar CSS custom properties
const applyCSSVariables = (theme) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Aplicar tokens de diseño
  Object.entries(designTokens.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });
  
  Object.entries(designTokens.typography.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });
  
  Object.entries(designTokens.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });
  
  Object.entries(designTokens.borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });
  
  // Aplicar colores del tema actual
  const applyColorVariables = (colors, prefix = '') => {
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        applyColorVariables(value, `${prefix}${key}-`);
      } else {
        root.style.setProperty(`--color-${prefix}${key}`, value);
      }
    });
  };
  
  applyColorVariables(theme.colors);
  
  // Aplicar propiedades de accesibilidad
  root.style.setProperty('--focus-ring', theme.accessibility.focusRing);
  root.style.setProperty('--min-contrast-normal', theme.accessibility.minContrast.normal);
  root.style.setProperty('--min-contrast-large', theme.accessibility.minContrast.large);
  
  // Aplicar breakpoints
  Object.entries(designTokens.breakpoints).forEach(([key, value]) => {
    root.style.setProperty(`--breakpoint-${key}`, value);
  });
  
  // Aplicar z-index
  Object.entries(designTokens.zIndex).forEach(([key, value]) => {
    root.style.setProperty(`--z-${key}`, value);
  });
};

// Componente Provider
export const ThemeProvider = ({ 
  children, 
  defaultTheme = 'light',
  storageKey = 'erp-theme',
  enableTransitions = true,
  respectSystemPreference = true 
}) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [systemPreference, setSystemPreference] = useState('light');
  
  // Detectar preferencia del sistema
  useEffect(() => {
    if (!respectSystemPreference || typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [respectSystemPreference]);
  
  // Cargar tema desde localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedTheme = localStorage.getItem(storageKey);
      if (storedTheme && themes[storedTheme]) {
        setCurrentTheme(storedTheme);
      } else if (respectSystemPreference) {
        setCurrentTheme(systemPreference);
      }
    } catch (error) {
      console.warn('Error loading theme from localStorage:', error);
    }
  }, [storageKey, systemPreference, respectSystemPreference]);
  
  // Aplicar tema cuando cambia
  useEffect(() => {
    const theme = themes[currentTheme] || themes.light;
    
    // Añadir clase de transición si está habilitada
    if (enableTransitions && typeof document !== 'undefined') {
      setIsTransitioning(true);
      document.documentElement.classList.add('theme-transitioning');
      
      // CSS para transiciones suaves
      const style = document.createElement('style');
      style.textContent = `
        .theme-transitioning,
        .theme-transitioning *,
        .theme-transitioning *:before,
        .theme-transitioning *:after {
          transition: background-color 0.3s ease, 
                      color 0.3s ease, 
                      border-color 0.3s ease, 
                      box-shadow 0.3s ease !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
      
      // Limpiar después de la transición
      setTimeout(() => {
        setIsTransitioning(false);
        document.documentElement.classList.remove('theme-transitioning');
        document.head.removeChild(style);
      }, 300);
    }
    
    // Aplicar variables CSS
    applyCSSVariables(theme);
    
    // Aplicar clase del tema al HTML
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', currentTheme);
      document.documentElement.className = 
        document.documentElement.className.replace(/theme-\w+/g, '') + ` theme-${currentTheme}`;
    }
    
    // Guardar en localStorage
    try {
      localStorage.setItem(storageKey, currentTheme);
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
  }, [currentTheme, enableTransitions, storageKey]);
  
  // Función para cambiar tema
  const setTheme = useCallback((themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      
      // Telemetría del cambio de tema
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'theme_change', {
          theme_name: themeName,
          previous_theme: currentTheme
        });
      }
    }
  }, [currentTheme]);
  
  // Función para alternar entre claro/oscuro
  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [currentTheme, setTheme]);
  
  // Función para seguir preferencia del sistema
  const followSystemPreference = useCallback(() => {
    setTheme(systemPreference);
  }, [systemPreference, setTheme]);
  
  const value = {
    currentTheme,
    theme: themes[currentTheme] || themes.light,
    setTheme,
    toggleTheme,
    followSystemPreference,
    availableThemes: Object.keys(themes),
    isTransitioning,
    systemPreference,
    respectSystemPreference
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook para generar clases CSS basadas en el tema
export const useThemeClasses = () => {
  const { theme, currentTheme } = useTheme();
  
  return {
    // Clases de fondo
    bg: {
      primary: 'bg-[var(--color-background-primary)]',
      secondary: 'bg-[var(--color-background-secondary)]',
      tertiary: 'bg-[var(--color-background-tertiary)]'
    },
    
    // Clases de texto
    text: {
      primary: 'text-[var(--color-text-primary)]',
      secondary: 'text-[var(--color-text-secondary)]',
      tertiary: 'text-[var(--color-text-tertiary)]',
      inverse: 'text-[var(--color-text-inverse)]',
      disabled: 'text-[var(--color-text-disabled)]'
    },
    
    // Clases de border
    border: {
      primary: 'border-[var(--color-border-primary)]',
      secondary: 'border-[var(--color-border-secondary)]',
      focus: 'border-[var(--color-border-focus)]'
    },
    
    // Clases de estados
    primary: 'bg-[var(--color-primary-500)] text-white',
    secondary: 'bg-[var(--color-secondary-500)] text-white',
    success: 'bg-[var(--color-success-500)] text-white',
    warning: 'bg-[var(--color-warning-500)] text-white',
    error: 'bg-[var(--color-error-500)] text-white',
    info: 'bg-[var(--color-info-500)] text-white',
    
    // Focus ring accesible
    focusRing: 'focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]',
    
    // Utilidades del tema actual
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    isHighContrast: currentTheme === 'high-contrast',
    themeName: currentTheme
  };
};

export default ThemeProvider;
