/**
 * Hook de Performance Optimizations - Wave 3 Enterprise
 * Proporciona herramientas avanzadas para optimización de rendering y memoria
 * 
 * FEATURES WAVE 3:
 * - useMemo y useCallback optimizados automáticamente
 * - Memory leak detection y cleanup
 * - Rendering performance monitoring
 * - Lazy loading y code splitting helpers
 * - Cache warming y prefetch strategies
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import { 
  useCallback, 
  useMemo, 
  useRef, 
  useEffect, 
  useState,
  startTransition,
  useDeferredValue
} from 'react';
import { useTelemetry } from './useTelemetry';

/**
 * Hook para optimizaciones automáticas de performance
 * 
 * @param {Object} options - Configuración de optimización
 * @param {boolean} options.enableMemoization - Si habilitar memoización automática
 * @param {boolean} options.enableProfiling - Si habilitar profiling de performance
 * @param {string} options.componentName - Nombre del componente para métricas
 * @returns {Object} Herramientas de optimización
 */
export const usePerformanceOptimizations = (options = {}) => {
  const {
    enableMemoization = true,
    enableProfiling = process.env.NODE_ENV === 'development',
    componentName = 'UnknownComponent'
  } = options;

  const { trackEvent, trackMetric, trackTiming } = useTelemetry();
  const renderStartTime = useRef(Date.now());
  const renderCount = useRef(0);
  const memoryUsage = useRef({ initial: 0, peak: 0 });

  // Tracking de renders
  useEffect(() => {
    renderCount.current++;
    
    if (enableProfiling) {
      const renderTime = Date.now() - renderStartTime.current;
      
      trackMetric(`render.${componentName}.time`, renderTime, {
        render_count: renderCount.current
      });
      
      trackEvent(`render.${componentName}.complete`, {
        render_time: renderTime,
        render_count: renderCount.current
      });

      // Memory monitoring si está disponible
      if (performance.memory) {
        const currentMemory = performance.memory.usedJSHeapSize;
        if (currentMemory > memoryUsage.current.peak) {
          memoryUsage.current.peak = currentMemory;
        }
        
        trackMetric(`memory.${componentName}.usage`, currentMemory, {
          peak: memoryUsage.current.peak
        });
      }
    }
    
    renderStartTime.current = Date.now();
  });

  /**
   * useMemo optimizado con debugging
   */
  const optimizedMemo = useCallback((factory, deps, debugName = 'unknown') => {
    if (!enableMemoization) {
      return factory();
    }

    return useMemo(() => {
      const startTime = Date.now();
      const result = factory();
      const computeTime = Date.now() - startTime;
      
      if (enableProfiling && computeTime > 5) { // Log solo si toma más de 5ms
        trackMetric(`memo.${componentName}.${debugName}`, computeTime);
      }
      
      return result;
    }, deps);
  }, [enableMemoization, enableProfiling, componentName, trackMetric]);

  /**
   * useCallback optimizado con debugging
   */
  const optimizedCallback = useCallback((callback, deps, debugName = 'unknown') => {
    if (!enableMemoization) {
      return callback;
    }

    return useCallback((...args) => {
      const startTime = Date.now();
      const result = callback(...args);
      const executeTime = Date.now() - startTime;
      
      if (enableProfiling && executeTime > 1) { // Log solo si toma más de 1ms
        trackMetric(`callback.${componentName}.${debugName}`, executeTime);
      }
      
      return result;
    }, deps);
  }, [enableMemoization, enableProfiling, componentName, trackMetric]);

  /**
   * Helper para transiciones no bloqueantes
   */
  const scheduleUpdate = useCallback((updateFn, priority = 'normal') => {
    if (priority === 'low') {
      startTransition(() => {
        updateFn();
      });
    } else {
      updateFn();
    }
  }, []);

  /**
   * Hook para valores diferidos (reduce re-renders)
   */
  const useDeferredState = (value, delay = 300) => {
    return useDeferredValue(value);
  };

  /**
   * Cleanup automático de recursos
   */
  const createCleanupRegistry = () => {
    const cleanupFunctions = useRef([]);
    
    const registerCleanup = useCallback((cleanupFn) => {
      cleanupFunctions.current.push(cleanupFn);
    }, []);
    
    useEffect(() => {
      return () => {
        cleanupFunctions.current.forEach(fn => {
          try {
            fn();
          } catch (error) {
            console.warn('Error during cleanup:', error);
          }
        });
        cleanupFunctions.current = [];
      };
    }, []);
    
    return registerCleanup;
  };

  return {
    // Optimización automática
    optimizedMemo,
    optimizedCallback,
    scheduleUpdate,
    useDeferredState,
    
    // Resource management
    createCleanupRegistry,
    
    // Métricas
    renderCount: renderCount.current,
    memoryUsage: memoryUsage.current,
    
    // Debugging
    enableProfiling,
    componentName
  };
};

/**
 * Hook para lazy loading de componentes
 * 
 * @param {Function} importFn - Función de import dinámico
 * @param {Object} options - Opciones de lazy loading
 * @returns {Object} Componente lazy y estado
 */
export const useLazyComponent = (importFn, options = {}) => {
  const {
    fallback = null,
    preload = false,
    onError = () => {},
    retryCount = 3
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [component, setComponent] = useState(null);
  const { trackEvent } = useTelemetry();
  const retryAttempts = useRef(0);

  const loadComponent = useCallback(async () => {
    if (component || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      trackEvent('lazy_component.load_start');
      const startTime = Date.now();
      
      const loadedComponent = await importFn();
      
      const loadTime = Date.now() - startTime;
      trackEvent('lazy_component.load_success', { load_time: loadTime });
      
      setComponent(loadedComponent);
      retryAttempts.current = 0;
    } catch (err) {
      console.error('Error loading lazy component:', err);
      setError(err);
      onError(err);
      
      trackEvent('lazy_component.load_error', {
        error: err.message,
        retry_attempt: retryAttempts.current
      });
      
      // Retry logic
      if (retryAttempts.current < retryCount) {
        retryAttempts.current++;
        setTimeout(() => {
          setLoading(false);
          loadComponent();
        }, 1000 * retryAttempts.current); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [importFn, component, loading, onError, retryCount, trackEvent]);

  // Preload if requested
  useEffect(() => {
    if (preload) {
      loadComponent();
    }
  }, [preload, loadComponent]);

  return {
    component,
    loading,
    error,
    loadComponent
  };
};

/**
 * Hook para virtual scrolling performance
 * 
 * @param {Array} items - Array de items
 * @param {Object} options - Opciones de virtualización
 * @returns {Object} Items virtualizados y helpers
 */
export const useVirtualizedList = (items, options = {}) => {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
    enableSmoothing = true
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const { trackMetric } = useTelemetry();

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    const visible = items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));

    // Track virtualization efficiency
    trackMetric('virtualization.visible_items', visible.length, {
      total_items: items.length,
      efficiency: visible.length / items.length
    });

    return visible;
  }, [items, scrollTop, itemHeight, containerHeight, overscan, trackMetric]);

  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    
    if (enableSmoothing) {
      // Smooth scrolling con requestAnimationFrame
      requestAnimationFrame(() => {
        setScrollTop(newScrollTop);
      });
    } else {
      setScrollTop(newScrollTop);
    }
  }, [enableSmoothing]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    handleScroll,
    totalHeight,
    scrollTop,
    containerStyle: {
      height: containerHeight,
      overflow: 'auto',
      position: 'relative'
    },
    contentStyle: {
      height: totalHeight,
      position: 'relative'
    }
  };
};

/**
 * Hook para prefetch inteligente
 * 
 * @param {Function} prefetchFn - Función de prefetch
 * @param {Object} options - Opciones de prefetch
 * @returns {Object} Controles de prefetch
 */
export const useIntelligentPrefetch = (prefetchFn, options = {}) => {
  const {
    delay = 1000,
    conditions = {},
    priority = 'low'
  } = options;

  const { trackEvent } = useTelemetry();
  const prefetchTimer = useRef(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchedData, setPrefetchedData] = useState(null);

  const shouldPrefetch = useMemo(() => {
    // Verificar condiciones de red y sistema
    const connection = navigator.connection;
    if (connection) {
      // No prefetch en conexiones lentas
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return false;
      }
      
      // No prefetch si está en modo de ahorro de datos
      if (connection.saveData) {
        return false;
      }
    }

    // Verificar memoria disponible
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
      if (memoryUsage > 0.8) { // Si usa más del 80% de memoria
        return false;
      }
    }

    // Verificar condiciones customizadas
    return Object.values(conditions).every(condition => condition === true);
  }, [conditions]);

  const startPrefetch = useCallback(() => {
    if (!shouldPrefetch || isPrefetching || prefetchedData) {
      return;
    }

    prefetchTimer.current = setTimeout(async () => {
      setIsPrefetching(true);
      
      try {
        trackEvent('prefetch.start', { priority });
        const startTime = Date.now();
        
        const data = await prefetchFn();
        
        const prefetchTime = Date.now() - startTime;
        trackEvent('prefetch.success', { 
          prefetch_time: prefetchTime,
          priority 
        });
        
        setPrefetchedData(data);
      } catch (error) {
        trackEvent('prefetch.error', {
          error: error.message,
          priority
        });
        console.warn('Prefetch failed:', error);
      } finally {
        setIsPrefetching(false);
      }
    }, delay);
  }, [shouldPrefetch, isPrefetching, prefetchedData, prefetchFn, delay, priority, trackEvent]);

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
    setIsPrefetching(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelPrefetch();
    };
  }, [cancelPrefetch]);

  return {
    startPrefetch,
    cancelPrefetch,
    isPrefetching,
    prefetchedData,
    shouldPrefetch
  };
};

export default {
  usePerformanceOptimizations,
  useLazyComponent,
  useVirtualizedList,
  useIntelligentPrefetch
};
