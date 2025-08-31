/**
 * Context de temas compatible con React 19
 * Reemplaza Zustand para evitar problemas de compatibilidad
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Tema por defecto
const DEFAULT_THEME = 'neo-brutalism-light';

// Función auxiliar para aplicar el tema al DOM
const applyTheme = (theme) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const body = document.body;
  
  // Limpiar clases previas
  root.classList.remove(
    'neo-brutalism-light', 'neo-brutalism-dark', 
    'material-light', 'material-dark', 
    'fluent-light', 'fluent-dark'
  );
  body.classList.remove(
    'neo-brutalism-light', 'neo-brutalism-dark', 
    'material-light', 'material-dark', 
    'fluent-light', 'fluent-dark'
  );
  
  // Aplicar nuevo tema
  root.classList.add(theme);
  body.classList.add(theme);
  
  // Establecer atributos data
  root.setAttribute('data-theme', theme);
  body.setAttribute('data-theme', theme);
};

// Cargar tema inicial desde localStorage
const getInitialTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  
  try {
    return localStorage.getItem('erp-theme') || DEFAULT_THEME;
  } catch (error) {
    console.warn('Error loading theme from localStorage:', error);
    return DEFAULT_THEME;
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme());

  const setTheme = (newTheme) => {
    try {
      // Persistir en localStorage
      localStorage.setItem('erp-theme', newTheme);
      
      // Aplicar al DOM
      applyTheme(newTheme);
      
      // Actualizar estado
      setThemeState(newTheme);
      
      console.log('🎨 Theme changed to:', newTheme);
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  };

  const initializeTheme = () => {
    applyTheme(theme);
    console.log('🎨 Theme initialized:', theme);
  };

  // Helpers para detectar tipo de tema
  const isNeoBrutalism = () => theme?.includes('neo-brutalism');
  const isMaterial = () => theme?.includes('material');
  const isFluent = () => theme?.includes('fluent');
  const isDark = () => theme?.includes('dark');

  useEffect(() => {
    initializeTheme();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      initializeTheme,
      isNeoBrutalism,
      isMaterial,
      isFluent,
      isDark
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};