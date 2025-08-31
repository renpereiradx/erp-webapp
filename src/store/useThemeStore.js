/**
 * Store de temas usando Zustand - Patrón MVP Oficial
 * Siguiendo especificaciones de GUIA_MVP_DESARROLLO.md
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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

const useThemeStore = create()(
  devtools(
    (set, get) => ({
      // Estado inicial
      theme: getInitialTheme(),

      // Acción para cambiar tema
      setTheme: (newTheme) => {
        try {
          // Persistir en localStorage
          localStorage.setItem('erp-theme', newTheme);
          
          // Aplicar al DOM
          applyTheme(newTheme);
          
          // Actualizar estado
          set({ theme: newTheme });
          
          console.log('🎨 Theme changed to:', newTheme);
        } catch (error) {
          console.error('Failed to set theme:', error);
        }
      },

      // Inicializar tema (llamar desde App.jsx)
      initializeTheme: () => {
        const currentTheme = get().theme;
        applyTheme(currentTheme);
        console.log('🎨 Theme initialized:', currentTheme);
      },

      // Helpers para detectar tipo de tema
      isNeoBrutalism: () => {
        const theme = get().theme;
        return theme?.includes('neo-brutalism');
      },

      isMaterial: () => {
        const theme = get().theme;
        return theme?.includes('material');
      },

      isFluent: () => {
        const theme = get().theme;
        return theme?.includes('fluent');
      },

      isDark: () => {
        const theme = get().theme;
        return theme?.includes('dark');
      }
    }),
    {
      name: 'theme-store' // Para DevTools
    }
  )
);

export default useThemeStore;