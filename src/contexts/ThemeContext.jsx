/**
 * Enterprise-grade Theme Context with robust validation and performance optimization
 * Provides centralized theme management with comprehensive error handling
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  THEME_CONFIG, 
  DEFAULT_THEME, 
  STORAGE_KEY,
  isValidTheme,
  getAllThemeClasses,
  getThemeById,
  isNeoBrutalism,
  isMaterial,
  isFluent,
  isDark,
  isLight
} from '../config/themes';

const ThemeContext = createContext(null);

/**
 * Función robusta para aplicar tema al DOM
 * @param {string} themeId - ID del tema a aplicar
 * @returns {boolean} - true si se aplicó correctamente
 */
const applyThemeToDOM = (themeId) => {
  if (typeof window === 'undefined') return false;
  
  const themeConfig = getThemeById(themeId);
  if (!themeConfig) {
    console.error(`Invalid theme: ${themeId}`);
    return false;
  }
  
  try {
    const root = document.documentElement;
    const body = document.body;
    
    // Limpiar todas las clases de tema existentes de forma dinámica
    const allThemeClasses = getAllThemeClasses();
    root.classList.remove(...allThemeClasses);
    body.classList.remove(...allThemeClasses);
    
    // Aplicar nuevas clases del tema
    root.classList.add(...themeConfig.cssClasses);
    body.classList.add(...themeConfig.cssClasses);
    
    // Establecer atributos data dinámicamente
    Object.entries(themeConfig.dataAttributes).forEach(([key, value]) => {
      root.setAttribute(`data-${key}`, value);
      body.setAttribute(`data-${key}`, value);
    });
    
    return true;
  } catch (error) {
    console.error('Failed to apply theme to DOM:', error);
    return false;
  }
};

/**
 * Cargar tema inicial con validación y fallbacks
 * @returns {string} - ID del tema válido
 */
const getInitialTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    
    if (savedTheme && isValidTheme(savedTheme)) {
      return savedTheme;
    }
    
    // Si el tema guardado no es válido, usar el por defecto
    if (savedTheme && !isValidTheme(savedTheme)) {
      console.warn(`Invalid saved theme: ${savedTheme}. Using default: ${DEFAULT_THEME}`);
      localStorage.setItem(STORAGE_KEY, DEFAULT_THEME);
    }
    
    return DEFAULT_THEME;
  } catch (error) {
    console.warn('Error loading theme from localStorage:', error);
    return DEFAULT_THEME;
  }
};

/**
 * Persistir tema en localStorage con manejo de errores
 * @param {string} themeId - ID del tema a persistir
 * @returns {boolean} - true si se guardó correctamente
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

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme());
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Cambiar tema con validación completa
   * @param {string} newThemeId - ID del nuevo tema
   * @returns {boolean} - true si el cambio fue exitoso
   */
  const setTheme = useCallback((newThemeId) => {
    // Validar que el tema existe
    if (!isValidTheme(newThemeId)) {
      console.error(`Invalid theme ID: ${newThemeId}`);
      return false;
    }

    // Si es el mismo tema, no hacer nada
    if (newThemeId === theme) {
      return true;
    }

    try {
      // Aplicar al DOM primero
      const domApplied = applyThemeToDOM(newThemeId);
      if (!domApplied) {
        return false;
      }

      // Persistir en localStorage
      const persisted = persistTheme(newThemeId);
      if (!persisted) {
        console.warn('Theme applied but not persisted');
      }

      // Actualizar estado
      setThemeState(newThemeId);

      if (process.env.NODE_ENV === 'development') {
        console.log('🎨 Theme changed to:', newThemeId);
      }

      return true;
    } catch (error) {
      console.error('Failed to set theme:', error);
      return false;
    }
  }, [theme]);

  /**
   * Inicializar tema al montar el componente
   */
  const initializeTheme = useCallback(() => {
    if (isInitialized) return;
    
    const success = applyThemeToDOM(theme);
    if (success) {
      setIsInitialized(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('🎨 Theme initialized:', theme);
      }
    }
  }, [theme, isInitialized]);

  /**
   * Obtener configuración completa del tema actual
   */
  const themeConfig = useMemo(() => {
    return getThemeById(theme) || getThemeById(DEFAULT_THEME);
  }, [theme]);

  /**
   * Helpers para detectar características del tema (memoizados)
   */
  const themeHelpers = useMemo(() => ({
    isNeoBrutalism: () => isNeoBrutalism(theme),
    isMaterial: () => isMaterial(theme),
    isFluent: () => isFluent(theme),
    isDark: () => isDark(theme),
    isLight: () => isLight(theme)
  }), [theme]);

  /**
   * Resetear tema al por defecto
   */
  const resetTheme = useCallback(() => {
    return setTheme(DEFAULT_THEME);
  }, [setTheme]);

  // Inicializar tema cuando el componente se monta
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // Memoizar el value del context para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
    // Estado actual
    theme,
    themeConfig,
    isInitialized,
    
    // Acciones
    setTheme,
    resetTheme,
    
    // Helpers
    ...themeHelpers,
    
    // Utilidades
    availableThemes: Object.values(THEME_CONFIG),
    isValidTheme
  }), [theme, themeConfig, isInitialized, setTheme, resetTheme, themeHelpers]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de tema con validación robusta
 * @returns {Object} - Contexto de tema completo
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure your component is wrapped with <ThemeProvider>.'
    );
  }
  
  return context;
};

/**
 * Hook para obtener solo los helpers de tema (más performante)
 * @returns {Object} - Solo las funciones helper del tema
 */
export const useThemeHelpers = () => {
  const { isNeoBrutalism, isMaterial, isFluent, isDark, isLight } = useTheme();
  return { isNeoBrutalism, isMaterial, isFluent, isDark, isLight };
};

/**
 * Hook para obtener solo el tema actual (más performante)
 * @returns {string} - ID del tema actual
 */
export const useCurrentTheme = () => {
  const { theme } = useTheme();
  return theme;
};

/**
 * Hook para obtener solo las acciones de tema (más performante)
 * @returns {Object} - Solo las funciones de acción
 */
export const useThemeActions = () => {
  const { setTheme, resetTheme } = useTheme();
  return { setTheme, resetTheme };
};