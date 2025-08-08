/**
 * Custom hook para manejo de estilos multitema
 * Centraliza toda la lógica de estilos adaptativos
 * Evita duplicación de código entre componentes
 */

import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { materialColors, materialTypography, materialCorners, materialElevation } from '@/utils/materialDesignUtils';
import { fluentColors, fluentTypography, fluentCorners, fluentElevation } from '@/utils/fluentDesignUtils';

export const useThemeStyles = () => {
  const { theme } = useTheme();
  
  const themeConfig = useMemo(() => ({
    isNeoBrutalism: theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark',
    isMaterial: theme === 'material-light' || theme === 'material-dark',
    isFluent: theme === 'fluent-light' || theme === 'fluent-dark',
  }), [theme]);

  const styles = useMemo(() => ({
    // Contenedores principales
    container: () => {
      if (themeConfig.isNeoBrutalism) {
        return "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]";
      } else if (themeConfig.isMaterial) {
        return `bg-white ${materialElevation.level2} ${materialCorners.medium}`;
      } else if (themeConfig.isFluent) {
        return `bg-white ${fluentElevation.card} ${fluentCorners.medium}`;
      }
      return "bg-white border shadow-lg rounded-lg";
    },

    // Tarjetas y paneles
    card: () => {
      if (themeConfig.isNeoBrutalism) {
        return "bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
      } else if (themeConfig.isMaterial) {
        return `bg-white ${materialElevation.level1} ${materialCorners.small}`;
      } else if (themeConfig.isFluent) {
        return `bg-white ${fluentElevation.subtle} ${fluentCorners.small}`;
      }
      return "bg-white border shadow rounded";
    },

    // Botones con variantes
    button: (variant = 'primary') => {
      if (themeConfig.isNeoBrutalism) {
        if (variant === 'primary') {
          return "bg-brutalist-blue text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-150";
        }
        return "bg-white text-black border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150";
      } else if (themeConfig.isMaterial) {
        if (variant === 'primary') {
          return `${materialColors.primary.main} text-white ${materialElevation.level1} ${materialCorners.small} hover:shadow-md transition-all duration-200`;
        }
        return `${materialColors.surface.main} ${materialColors.onSurface.main} ${materialElevation.level0} ${materialCorners.small} hover:shadow-sm transition-all duration-200`;
      } else if (themeConfig.isFluent) {
        if (variant === 'primary') {
          return `${fluentColors.accent} text-white ${fluentElevation.subtle} ${fluentCorners.small} hover:opacity-90 transition-all duration-200`;
        }
        return `${fluentColors.surface} ${fluentColors.onSurface} ${fluentElevation.subtle} ${fluentCorners.small} hover:bg-gray-50 transition-all duration-200`;
      }
      return variant === 'primary' ? "bg-blue-500 text-white hover:bg-blue-600 transition-colors" : "bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors";
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
      } else if (themeConfig.isMaterial) {
        const sizes = {
          h1: `${materialTypography.h4} font-medium`,
          h2: `${materialTypography.h5} font-medium`,
          h3: `${materialTypography.h6} font-medium`,
          h4: `${materialTypography.subtitle1} font-medium`,
        };
        return sizes[level] || sizes.h1;
      } else if (themeConfig.isFluent) {
        const sizes = {
          h1: `${fluentTypography.title1} font-semibold`,
          h2: `${fluentTypography.title2} font-semibold`,
          h3: `${fluentTypography.subtitle1} font-semibold`,
          h4: `${fluentTypography.subtitle2} font-semibold`,
        };
        return sizes[level] || sizes.h1;
      }
      const sizes = {
        h1: "text-3xl font-bold",
        h2: "text-2xl font-bold",
        h3: "text-xl font-semibold",
        h4: "text-lg font-semibold",
      };
      return sizes[level] || sizes.h1;
    },

    // Labels y texto
    label: () => {
      if (themeConfig.isNeoBrutalism) {
        return "text-sm font-black uppercase tracking-wide";
      } else if (themeConfig.isMaterial) {
        return materialTypography.caption;
      } else if (themeConfig.isFluent) {
        return fluentTypography.caption1;
      }
      return "text-sm font-medium";
    },

    // Texto del cuerpo
    body: () => {
      if (themeConfig.isNeoBrutalism) {
        return "font-bold";
      } else if (themeConfig.isMaterial) {
        return materialTypography.body1;
      } else if (themeConfig.isFluent) {
        return fluentTypography.body1;
      }
      return "text-muted-foreground";
    },

    // Pestañas de navegación
    tab: () => {
      if (themeConfig.isNeoBrutalism) {
        return "border-4 border-black bg-white data-[state=active]:bg-brutalist-blue data-[state=active]:text-white font-black uppercase transition-all duration-150";
      } else if (themeConfig.isMaterial) {
        return `${materialCorners.small} data-[state=active]:${materialColors.primary.main} data-[state=active]:text-white transition-all duration-200`;
      } else if (themeConfig.isFluent) {
        return `${fluentCorners.small} data-[state=active]:${fluentColors.accent} data-[state=active]:text-white transition-all duration-200`;
      }
      return "data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200";
    },

    // Input fields
    input: () => {
      if (themeConfig.isNeoBrutalism) {
        return "border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-1px] focus:translate-y-[-1px] transition-all duration-150";
      } else if (themeConfig.isMaterial) {
        return `border border-gray-300 ${materialCorners.small} focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200`;
      } else if (themeConfig.isFluent) {
        return `border border-gray-300 ${fluentCorners.small} focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all duration-200`;
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
    styles
  };
};

export default useThemeStyles;
