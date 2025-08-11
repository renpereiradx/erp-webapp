/**
 * Custom hook para manejo de estilos multitema
 * Centraliza toda la lógica de estilos adaptativos
 * Evita duplicación de código entre componentes
 */

import { useTheme } from 'next-themes';
import { useMemo } from 'react';

export const useThemeStyles = () => {
  const { theme } = useTheme();
  
  const themeConfig = useMemo(() => ({
    isNeoBrutalism: theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark',
    isMaterial: theme === 'material-light' || theme === 'material-dark',
    isFluent: theme === 'fluent-light' || theme === 'fluent-dark',
    mode: theme?.endsWith('dark') ? 'dark' : 'light',
  }), [theme]);

  const styles = useMemo(() => ({
    // Contenedores principales
    container: () => {
      if (themeConfig.isNeoBrutalism) {
        return "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 rounded-none";
      } else if (themeConfig.isMaterial) {
        return "bg-white shadow-md rounded-md";
      } else if (themeConfig.isFluent) {
        return "bg-white shadow-sm rounded-lg";
      }
      return "bg-white border shadow-lg rounded-lg";
    },

    // Tarjetas y paneles
    card: (extra = '') => {
      if (themeConfig.isNeoBrutalism) {
        return `bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${extra}`.trim();
      } else if (themeConfig.isMaterial) {
        return `bg-white shadow-sm rounded-md ${extra}`.trim();
      } else if (themeConfig.isFluent) {
        return `bg-white shadow-sm rounded-lg ${extra}`.trim();
      }
      return `bg-white border shadow rounded ${extra}`.trim();
    },

    // Botones con variantes
    button: (variant = 'primary') => {
      if (themeConfig.isNeoBrutalism) {
        if (variant === 'primary') {
          return "bg-brutalist-blue text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-150";
        }
        if (variant === 'destructive') {
          return "bg-red-600 text-white border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150";
        }
        return "bg-white text-black border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150";
      } else if (themeConfig.isMaterial) {
        if (variant === 'primary') {
          return "bg-blue-600 text-white shadow-sm rounded-md hover:bg-blue-700 transition-all duration-200";
        }
        if (variant === 'destructive') {
          return "bg-red-600 text-white shadow-sm rounded-md hover:bg-red-700 transition-all duration-200";
        }
        return "bg-gray-50 text-gray-900 border rounded-md hover:bg-gray-100 transition-all duration-200";
      } else if (themeConfig.isFluent) {
        if (variant === 'primary') {
          return "bg-sky-600 text-white shadow-sm rounded-lg hover:bg-sky-700 transition-all duration-200";
        }
        if (variant === 'destructive') {
          return "bg-red-600 text-white shadow-sm rounded-lg hover:bg-red-700 transition-all duration-200";
        }
        return "bg-white text-gray-900 border rounded-lg hover:bg-gray-50 transition-all duration-200";
      }
      if (variant === 'primary') return "bg-blue-500 text-white hover:bg-blue-600 transition-colors";
      if (variant === 'destructive') return "bg-red-600 text-white hover:bg-red-700 transition-colors";
      return "bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors";
    },

    // Headers y títulos
    header: (level = 'h1') => {
      if (themeConfig.isNeoBrutalism) {
        const sizes = {
          h1: "text-3xl font-black uppercase tracking-wide",
          h2: "text-2xl font-black uppercase tracking-wide",
          h3: "text-xl font-black uppercase tracking-wide",
          h4: "text-lg font-black uppercase tracking-wide",
        };
        return sizes[level] || sizes.h1;
      } else {
        const sizes = {
          h1: "text-3xl font-bold",
          h2: "text-2xl font-bold",
          h3: "text-xl font-semibold",
          h4: "text-lg font-semibold",
        };
        return sizes[level] || sizes.h1;
      }
    },

    // Labels y texto
    label: () => {
      if (themeConfig.isNeoBrutalism) return "text-sm font-black uppercase tracking-wide";
      return "text-sm font-medium";
    },

    // Texto del cuerpo
    body: () => {
      if (themeConfig.isNeoBrutalism) return "font-bold";
      return "text-muted-foreground";
    },

    // Pestañas de navegación
    tab: () => {
      if (themeConfig.isNeoBrutalism) {
        return "border-4 border-black bg-white data-[state=active]:bg-brutalist-blue data-[state=active]:text-white font-black uppercase transition-all duration-150";
      } else if (themeConfig.isMaterial) {
        return "rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200";
      } else if (themeConfig.isFluent) {
        return "rounded-lg data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all duration-200";
      }
      return "data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200";
    },

    // Input fields
    input: () => {
      if (themeConfig.isNeoBrutalism) {
        return "border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all duration-150";
      } else if (themeConfig.isMaterial) {
        return "border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200";
      } else if (themeConfig.isFluent) {
        return "border border-gray-300 rounded-lg focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all duration-200";
      }
      return "border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200";
    },

    // Card headers
    cardHeader: () => {
      if (themeConfig.isNeoBrutalism) {
        return "border-b-4 border-black";
      }
      return "border-b";
    }
  }), [themeConfig]);

  return {
    ...themeConfig,
    // Exposición en nivel superior para retrocompatibilidad
    ...styles,
    // Objeto agrupado
    styles
  };
};

export default useThemeStyles;
