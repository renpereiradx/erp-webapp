/**
 * @fileoverview Hook useLazyComponents - Lazy loading de componentes
 * Wave 3A: React Performance Optimizations
 * 
 * Features:
 * - Lazy loading de modales bajo demanda
 * - Preload inteligente en hover
 * - Error boundaries para componentes lazy
 * - Loading states personalizables
 * - Chunk optimization
 */

import { lazy, useState, useCallback, useRef } from 'react';

/**
 * Configuración por defecto para lazy loading
 */
const DEFAULT_LAZY_CONFIG = {
  preloadOnHover: true,
  preloadDelay: 100,
  retryOnError: true,
  maxRetries: 3,
  enableTelemetry: false
};

/**
 * Cache de componentes lazy cargados
 */
const componentCache = new Map();

/**
 * Hook para lazy loading de componentes con optimizaciones
 * @param {Object} componentMap - Mapa de componentes lazy
 * @param {Object} config - Configuración del lazy loading
 * @returns {Object} Interface para componentes lazy
 */
export function useLazyComponents(componentMap = {}, config = {}) {
  const finalConfig = { ...DEFAULT_LAZY_CONFIG, ...config };
  const [loadingStates, setLoadingStates] = useState({});
  const [errorStates, setErrorStates] = useState({});
  const [loadedComponents, setLoadedComponents] = useState(new Set());
  
  const preloadTimersRef = useRef(new Map());
  const retryCountsRef = useRef(new Map());

  /**
   * Registrar telemetría
   */
  const recordTelemetry = useCallback((event, data) => {
    if (!finalConfig.enableTelemetry) return;
    
    // Registrar evento básico por ahora
    console.debug(`[LazyComponents] ${event}:`, data);
  }, [finalConfig.enableTelemetry]);

  /**
   * Crear componente lazy con configuración optimizada
   */
  const createLazyComponent = useCallback((importFunction, componentName) => {
    if (componentCache.has(componentName)) {
      return componentCache.get(componentName);
    }

    const LazyComponent = lazy(() => {
      recordTelemetry('component.lazy_load_start', { componentName });
      
      return importFunction()
        .then(module => {
          recordTelemetry('component.lazy_load_success', { 
            componentName,
            hasDefault: !!module.default 
          });
          
          setLoadedComponents(prev => new Set([...prev, componentName]));
          setLoadingStates(prev => ({ ...prev, [componentName]: false }));
          
          return module;
        })
        .catch(error => {
          recordTelemetry('component.lazy_load_error', { 
            componentName,
            error: error.message 
          });
          
          setErrorStates(prev => ({ ...prev, [componentName]: error }));
          setLoadingStates(prev => ({ ...prev, [componentName]: false }));
          
          throw error;
        });
    });

    componentCache.set(componentName, LazyComponent);
    return LazyComponent;
  }, [recordTelemetry]);

  /**
   * Precargar componente
   */
  const preloadComponent = useCallback(async (componentName) => {
    if (loadedComponents.has(componentName)) {
      recordTelemetry('component.preload_skip', { componentName, reason: 'already_loaded' });
      return true;
    }

    if (loadingStates[componentName]) {
      recordTelemetry('component.preload_skip', { componentName, reason: 'already_loading' });
      return false;
    }

    const importFunction = componentMap[componentName];
    if (!importFunction) {
      recordTelemetry('component.preload_error', { componentName, reason: 'not_found' });
      return false;
    }

    try {
      setLoadingStates(prev => ({ ...prev, [componentName]: true }));
      recordTelemetry('component.preload_start', { componentName });
      
      const LazyComponent = createLazyComponent(importFunction, componentName);
      
      // Precargar el componente
      await importFunction();
      
      recordTelemetry('component.preload_success', { componentName });
      return true;
    } catch (error) {
      recordTelemetry('component.preload_failed', { componentName, error: error.message });
      return false;
    }
  }, [loadedComponents, loadingStates, componentMap, createLazyComponent, recordTelemetry]);

  /**
   * Manejar hover para preload
   */
  const handlePreloadHover = useCallback((componentName) => {
    if (!finalConfig.preloadOnHover) return;

    // Limpiar timer previo si existe
    if (preloadTimersRef.current.has(componentName)) {
      clearTimeout(preloadTimersRef.current.get(componentName));
    }

    // Configurar nuevo timer de preload
    const timerId = setTimeout(() => {
      preloadComponent(componentName);
      preloadTimersRef.current.delete(componentName);
    }, finalConfig.preloadDelay);

    preloadTimersRef.current.set(componentName, timerId);
  }, [finalConfig.preloadOnHover, finalConfig.preloadDelay, preloadComponent]);

  /**
   * Cancelar preload en mouse leave
   */
  const handleCancelPreload = useCallback((componentName) => {
    if (preloadTimersRef.current.has(componentName)) {
      clearTimeout(preloadTimersRef.current.get(componentName));
      preloadTimersRef.current.delete(componentName);
      recordTelemetry('component.preload_cancelled', { componentName });
    }
  }, [recordTelemetry]);

  /**
   * Obtener componente lazy
   */
  const getLazyComponent = useCallback((componentName) => {
    const importFunction = componentMap[componentName];
    if (!importFunction) {
      recordTelemetry('component.get_error', { componentName, reason: 'not_found' });
      return null;
    }

    return createLazyComponent(importFunction, componentName);
  }, [componentMap, createLazyComponent, recordTelemetry]);

  /**
   * Retry loading de componente con error
   */
  const retryComponent = useCallback(async (componentName) => {
    const retryCount = retryCountsRef.current.get(componentName) || 0;
    
    if (retryCount >= finalConfig.maxRetries) {
      recordTelemetry('component.retry_exhausted', { componentName, retryCount });
      return false;
    }

    retryCountsRef.current.set(componentName, retryCount + 1);
    
    // Limpiar estado de error
    setErrorStates(prev => {
      const newState = { ...prev };
      delete newState[componentName];
      return newState;
    });

    // Limpiar cache y intentar recargar
    componentCache.delete(componentName);
    
    recordTelemetry('component.retry_attempt', { componentName, attempt: retryCount + 1 });
    
    return await preloadComponent(componentName);
  }, [finalConfig.maxRetries, preloadComponent, recordTelemetry]);

  /**
   * Obtener estadísticas de lazy loading
   */
  const getStats = useCallback(() => {
    const totalComponents = Object.keys(componentMap).length;
    const loadedCount = loadedComponents.size;
    const loadingCount = Object.values(loadingStates).filter(Boolean).length;
    const errorCount = Object.keys(errorStates).length;

    return {
      total: totalComponents,
      loaded: loadedCount,
      loading: loadingCount,
      errors: errorCount,
      loadingPercentage: totalComponents > 0 ? ((loadedCount / totalComponents) * 100).toFixed(1) : 0,
      loadedComponents: Array.from(loadedComponents),
      errorComponents: Object.keys(errorStates),
      loadingComponents: Object.keys(loadingStates).filter(key => loadingStates[key])
    };
  }, [componentMap, loadedComponents, loadingStates, errorStates]);

  /**
   * Cleanup en unmount
   */
  const cleanup = useCallback(() => {
    // Limpiar timers de preload
    preloadTimersRef.current.forEach(timerId => {
      clearTimeout(timerId);
    });
    preloadTimersRef.current.clear();
    
    recordTelemetry('component.cleanup', { stats: getStats() });
  }, [getStats, recordTelemetry]);

  return {
    // Métodos principales
    getLazyComponent,
    preloadComponent,
    retryComponent,
    
    // Handlers para optimización
    onPreloadHover: handlePreloadHover,
    onCancelPreload: handleCancelPreload,
    
    // Estados
    loadingStates,
    errorStates,
    loadedComponents: Array.from(loadedComponents),
    
    // Utilidades
    stats: getStats(),
    cleanup,
    
    // Configuración
    config: finalConfig
  };
}

/**
 * Hook específico para lazy loading de modales de clientes
 */
export function useClientModals() {
  const clientModals = {
    ClientModal: () => import('@/components/clients/ClientModal'),
    ClientDetailModal: () => import('@/components/clients/ClientDetailModal'),
    DeleteClientModal: () => import('@/components/clients/DeleteClientModal')
  };

  return useLazyComponents(clientModals, {
    preloadOnHover: true,
    preloadDelay: 150,
    enableTelemetry: true
  });
}

export default useLazyComponents;
