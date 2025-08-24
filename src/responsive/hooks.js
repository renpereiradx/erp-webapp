/**
 * Responsive Design Hooks - Wave 4 UX & Accessibility
 * Hooks para diseño responsive y mobile-first
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Breakpoints enterprise estándar
export const breakpoints = {
  mobile: 320,
  mobileLg: 480,
  tablet: 768,
  desktop: 1024,
  desktopLg: 1440,
  ultrawide: 1920
};

// Media queries predefinidas
const mediaQueries = {
  mobile: `(max-width: ${breakpoints.mobileLg - 1}px)`,
  mobileLg: `(min-width: ${breakpoints.mobileLg}px) and (max-width: ${breakpoints.tablet - 1}px)`,
  tablet: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px) and (max-width: ${breakpoints.desktopLg - 1}px)`,
  desktopLg: `(min-width: ${breakpoints.desktopLg}px) and (max-width: ${breakpoints.ultrawide - 1}px)`,
  ultrawide: `(min-width: ${breakpoints.ultrawide}px)`,
  
  // Utility queries
  isMobile: `(max-width: ${breakpoints.tablet - 1}px)`,
  isTabletUp: `(min-width: ${breakpoints.tablet}px)`,
  isDesktopUp: `(min-width: ${breakpoints.desktop}px)`,
  isTouch: '(hover: none) and (pointer: coarse)'
};

/**
 * Hook principal para responsive design
 * Detecta el breakpoint actual y proporciona utilidades
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });
  
  const [currentBreakpoint, setCurrentBreakpoint] = useState('desktop');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Detectar dispositivo táctil
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };
    
    checkTouch();
  }, []);
  
  // Actualizar tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Determinar breakpoint actual
  useEffect(() => {
    const width = windowSize.width;
    
    if (width < breakpoints.mobileLg) {
      setCurrentBreakpoint('mobile');
    } else if (width < breakpoints.tablet) {
      setCurrentBreakpoint('mobileLg');
    } else if (width < breakpoints.desktop) {
      setCurrentBreakpoint('tablet');
    } else if (width < breakpoints.desktopLg) {
      setCurrentBreakpoint('desktop');
    } else if (width < breakpoints.ultrawide) {
      setCurrentBreakpoint('desktopLg');
    } else {
      setCurrentBreakpoint('ultrawide');
    }
  }, [windowSize.width]);
  
  // Utilidades calculadas
  const utils = useMemo(() => ({
    // Breakpoint checks
    isMobile: currentBreakpoint === 'mobile',
    isMobileLg: currentBreakpoint === 'mobileLg',
    isTablet: currentBreakpoint === 'tablet',
    isDesktop: currentBreakpoint === 'desktop',
    isDesktopLg: currentBreakpoint === 'desktopLg',
    isUltrawide: currentBreakpoint === 'ultrawide',
    
    // Range checks
    isMobileRange: ['mobile', 'mobileLg'].includes(currentBreakpoint),
    isTabletUp: !['mobile', 'mobileLg'].includes(currentBreakpoint),
    isDesktopUp: ['desktop', 'desktopLg', 'ultrawide'].includes(currentBreakpoint),
    
    // Device characteristics
    isTouchDevice,
    isPortrait: windowSize.height > windowSize.width,
    isLandscape: windowSize.width > windowSize.height,
    
    // Screen size categories
    isSmallScreen: windowSize.width < breakpoints.tablet,
    isMediumScreen: windowSize.width >= breakpoints.tablet && windowSize.width < breakpoints.desktopLg,
    isLargeScreen: windowSize.width >= breakpoints.desktopLg,
    
    // Responsive values
    columns: currentBreakpoint === 'mobile' ? 1 : 
             currentBreakpoint === 'mobileLg' ? 1 :
             currentBreakpoint === 'tablet' ? 2 :
             currentBreakpoint === 'desktop' ? 3 : 4,
             
    containerPadding: currentBreakpoint === 'mobile' ? '16px' :
                     currentBreakpoint === 'mobileLg' ? '20px' :
                     currentBreakpoint === 'tablet' ? '24px' : '32px',
                     
    fontSize: currentBreakpoint === 'mobile' ? 'sm' :
              currentBreakpoint === 'mobileLg' ? 'sm' :
              currentBreakpoint === 'tablet' ? 'md' : 'lg'
  }), [currentBreakpoint, windowSize, isTouchDevice]);
  
  return {
    windowSize,
    currentBreakpoint,
    breakpoints,
    ...utils
  };
};

/**
 * Hook para media queries específicas
 * Permite escuchar cambios en media queries customizadas
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (e) => setMatches(e.matches);
    
    // Set initial value
    setMatches(mediaQueryList.matches);
    
    // Add listener
    mediaQueryList.addEventListener('change', handleChange);
    
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);
  
  return matches;
};

/**
 * Hook para valores responsive
 * Permite definir diferentes valores según el breakpoint
 */
export const useResponsiveValue = (values) => {
  const { currentBreakpoint } = useResponsive();
  
  if (typeof values === 'object' && values !== null) {
    return values[currentBreakpoint] || values.default || values.mobile;
  }
  
  return values;
};

/**
 * Hook para clases CSS responsive
 * Genera clases CSS basadas en el breakpoint actual
 */
export const useResponsiveClasses = (classMap) => {
  const { currentBreakpoint } = useResponsive();
  
  const getClasses = useCallback((key) => {
    const config = classMap[key];
    
    if (typeof config === 'string') {
      return config;
    }
    
    if (typeof config === 'object' && config !== null) {
      return config[currentBreakpoint] || config.default || '';
    }
    
    return '';
  }, [classMap, currentBreakpoint]);
  
  const classes = useMemo(() => {
    const result = {};
    
    Object.keys(classMap).forEach(key => {
      result[key] = getClasses(key);
    });
    
    return result;
  }, [classMap, getClasses]);
  
  return classes;
};

/**
 * Hook para detectar orientación del dispositivo
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');
  
  useEffect(() => {
    const handleOrientationChange = () => {
      if (screen.orientation) {
        setOrientation(screen.orientation.angle === 0 || screen.orientation.angle === 180 ? 'portrait' : 'landscape');
      } else {
        setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
      }
    };
    
    handleOrientationChange();
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);
  
  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
};

/**
 * Hook para detección de conexión de red
 * Útil para optimizaciones responsive en redes lentas
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
    effectiveType: '4g',
    saveData: false
  });
  
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    
    const updateNetworkStatus = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || '4g',
        saveData: connection?.saveData || false
      });
    };
    
    updateNetworkStatus();
    
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkStatus);
    }
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);
  
  return {
    ...networkStatus,
    isSlowConnection: networkStatus.effectiveType === 'slow-2g' || networkStatus.effectiveType === '2g',
    isFastConnection: networkStatus.effectiveType === '4g' || networkStatus.effectiveType === '5g'
  };
};

/**
 * Hook para container queries (polyfill)
 * Simula container queries usando ResizeObserver
 */
export const useContainerQuery = (containerRef, breakpoint) => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setMatches(width >= breakpoint);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [containerRef, breakpoint]);
  
  return matches;
};

export default {
  useResponsive,
  useMediaQuery,
  useResponsiveValue,
  useResponsiveClasses,
  useOrientation,
  useNetworkStatus,
  useContainerQuery,
  breakpoints,
  mediaQueries
};
