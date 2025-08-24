/**
 * useServiceWorker - Wave 3 Service Worker Integration Hook
 * Hook para integrar Service Worker con cache offline avanzado
 * 
 * FEATURES WAVE 3:
 * - Registro automático de Service Worker
 * - Cache management inteligente
 * - Background sync coordination
 * - Network status awareness
 * - Cache invalidation manual
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelemetry } from './useTelemetry';
import { usePerformanceOptimizations } from './usePerformanceOptimizations';

/**
 * Hook para manejo completo de Service Worker
 * 
 * @param {Object} options - Configuración del Service Worker
 * @returns {Object} Estado y controles del Service Worker
 */
export const useServiceWorker = (options = {}) => {
  const {
    enableBackground = true,
    enableCaching = true,
    enableSync = true,
    swPath = '/sw.js',
    updateInterval = 60000 // 1 minuto
  } = options;

  const { trackEvent, trackMetric } = useTelemetry();
  const {
    optimizedCallback,
    createCleanupRegistry
  } = usePerformanceOptimizations({
    componentName: 'useServiceWorker',
    enableMemoization: true
  });

  const registerCleanup = createCleanupRegistry();

  // Estado del Service Worker
  const [swState, setSwState] = useState({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isActivated: false,
    isUpdating: false,
    hasUpdate: false,
    error: null,
    version: null,
    cacheStatus: {
      size: 0,
      hitRate: 0,
      lastCleanup: null
    },
    networkStatus: navigator.onLine ? 'online' : 'offline'
  });

  const swRegistration = useRef(null);
  const updateCheckInterval = useRef(null);
  const messageHandlers = useRef(new Map());

  /**
   * Registrar Service Worker
   */
  const registerServiceWorker = optimizedCallback(async () => {
    if (!swState.isSupported) {
      trackEvent('sw.registration.unsupported');
      return false;
    }

    try {
      trackEvent('sw.registration.start');
      
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/'
      });

      swRegistration.current = registration;
      
      setSwState(prev => ({
        ...prev,
        isRegistered: true,
        error: null
      }));

      // Setup event listeners
      setupServiceWorkerListeners(registration);
      
      trackEvent('sw.registration.success', {
        scope: registration.scope
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      
      setSwState(prev => ({
        ...prev,
        error: error.message
      }));

      trackEvent('sw.registration.error', {
        error: error.message
      });

      return false;
    }
  }, [swPath, trackEvent], 'registerServiceWorker');

  /**
   * Setup de listeners del Service Worker
   */
  const setupServiceWorkerListeners = optimizedCallback((registration) => {
    // Listener para updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      setSwState(prev => ({
        ...prev,
        isUpdating: true,
        hasUpdate: true
      }));

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nuevo SW disponible
          setSwState(prev => ({
            ...prev,
            isUpdating: false,
            hasUpdate: true
          }));

          trackEvent('sw.update.available');
        } else if (newWorker.state === 'activated') {
          setSwState(prev => ({
            ...prev,
            isActivated: true,
            isUpdating: false,
            hasUpdate: false
          }));

          trackEvent('sw.update.activated');
        }
      });
    });

    // Listener para mensajes del SW
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Cleanup
    registerCleanup(() => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    });
  }, [registerCleanup, trackEvent], 'setupServiceWorkerListeners');

  /**
   * Manejo de mensajes del Service Worker
   */
  const handleServiceWorkerMessage = optimizedCallback((event) => {
    const { type, data } = event.data;

    switch (type) {
      case 'SW_INSTALLED':
        setSwState(prev => ({
          ...prev,
          version: data.version,
          isActivated: true
        }));
        trackEvent('sw.installed', data);
        break;

      case 'SW_ACTIVATED':
        setSwState(prev => ({
          ...prev,
          isActivated: true
        }));
        trackEvent('sw.activated', data);
        break;

      case 'CACHE_API_NETWORK':
        trackMetric('sw.cache.api.network', 1);
        break;

      case 'CACHE_API_HIT':
        trackMetric('sw.cache.api.hit', 1, {
          offline: data.offline
        });
        break;

      case 'CACHE_BACKGROUND_UPDATED':
        trackEvent('sw.cache.background_update', {
          url: data.url
        });
        break;

      case 'PREFETCH_COMPLETED':
        trackEvent('sw.prefetch.completed', {
          resources: data.resources
        });
        break;

      case 'SYNC_COMPLETED':
        trackEvent('sw.sync.completed', {
          operation: data.operation
        });
        break;

      case 'CACHE_CLEANUP_COMPLETED':
        setSwState(prev => ({
          ...prev,
          cacheStatus: {
            ...prev.cacheStatus,
            lastCleanup: new Date().toISOString()
          }
        }));
        trackEvent('sw.cache.cleanup_completed');
        break;

      default:
        // Ejecutar handlers personalizados
        const handler = messageHandlers.current.get(type);
        if (handler) {
          handler(data);
        }
    }
  }, [trackEvent, trackMetric], 'handleServiceWorkerMessage');

  /**
   * Actualizar Service Worker
   */
  const updateServiceWorker = optimizedCallback(async () => {
    if (!swRegistration.current) return false;

    try {
      setSwState(prev => ({
        ...prev,
        isUpdating: true
      }));

      await swRegistration.current.update();
      
      // Forzar activación del nuevo SW
      if (swRegistration.current.waiting) {
        swRegistration.current.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }

      trackEvent('sw.update.manual');
      return true;
    } catch (error) {
      console.error('SW update failed:', error);
      
      setSwState(prev => ({
        ...prev,
        isUpdating: false,
        error: error.message
      }));

      trackEvent('sw.update.error', {
        error: error.message
      });
      
      return false;
    }
  }, [trackEvent], 'updateServiceWorker');

  /**
   * Limpiar cache
   */
  const clearCache = optimizedCallback(async (cacheType = 'all') => {
    if (!navigator.serviceWorker.controller) return false;

    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
        data: cacheType
      });

      trackEvent('sw.cache.cleared', {
        cache_type: cacheType
      });

      return true;
    } catch (error) {
      console.error('Cache clear failed:', error);
      trackEvent('sw.cache.clear_error', {
        error: error.message
      });
      return false;
    }
  }, [trackEvent], 'clearCache');

  /**
   * Cache manual de datos
   */
  const cachePurchaseData = optimizedCallback(async (purchaseData) => {
    if (!navigator.serviceWorker.controller) return false;

    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PURCHASE_DATA',
        data: purchaseData
      });

      trackEvent('sw.cache.manual', {
        data_type: 'purchase',
        data_id: purchaseData.id
      });

      return true;
    } catch (error) {
      console.error('Manual cache failed:', error);
      return false;
    }
  }, [trackEvent], 'cachePurchaseData');

  /**
   * Verificar actualizaciones periódicamente
   */
  const startUpdateChecker = optimizedCallback(() => {
    if (updateCheckInterval.current) return;

    updateCheckInterval.current = setInterval(async () => {
      if (swRegistration.current) {
        try {
          await swRegistration.current.update();
        } catch (error) {
          console.warn('Update check failed:', error);
        }
      }
    }, updateInterval);

    // Cleanup
    registerCleanup(() => {
      if (updateCheckInterval.current) {
        clearInterval(updateCheckInterval.current);
        updateCheckInterval.current = null;
      }
    });
  }, [updateInterval, registerCleanup], 'startUpdateChecker');

  /**
   * Registrar handler personalizado para mensajes
   */
  const registerMessageHandler = optimizedCallback((type, handler) => {
    messageHandlers.current.set(type, handler);

    return () => {
      messageHandlers.current.delete(type);
    };
  }, [], 'registerMessageHandler');

  /**
   * Obtener estadísticas de cache
   */
  const getCacheStats = optimizedCallback(async () => {
    if (!('caches' in window)) return null;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
      }

      const stats = {
        caches: cacheNames.length,
        totalEntries: totalSize,
        cacheNames
      };

      setSwState(prev => ({
        ...prev,
        cacheStatus: {
          ...prev.cacheStatus,
          size: totalSize
        }
      }));

      return stats;
    } catch (error) {
      console.error('Cache stats failed:', error);
      return null;
    }
  }, [], 'getCacheStats');

  // Efectos de inicialización
  useEffect(() => {
    if (swState.isSupported && enableBackground) {
      registerServiceWorker();
    }
  }, [swState.isSupported, enableBackground, registerServiceWorker]);

  useEffect(() => {
    if (swState.isRegistered && enableBackground) {
      startUpdateChecker();
    }
  }, [swState.isRegistered, enableBackground, startUpdateChecker]);

  // Monitor de estado de red
  useEffect(() => {
    const handleOnline = () => {
      setSwState(prev => ({
        ...prev,
        networkStatus: 'online'
      }));
      trackEvent('network.online');
    };

    const handleOffline = () => {
      setSwState(prev => ({
        ...prev,
        networkStatus: 'offline'
      }));
      trackEvent('network.offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    registerCleanup(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }, [trackEvent, registerCleanup]);

  return {
    // Estado
    ...swState,
    
    // Controles
    register: registerServiceWorker,
    update: updateServiceWorker,
    clearCache,
    cachePurchaseData,
    getCacheStats,
    
    // Utilities
    registerMessageHandler,
    
    // Información
    isOnline: swState.networkStatus === 'online',
    canCache: swState.isSupported && enableCaching,
    canSync: swState.isSupported && enableSync
  };
};

export default useServiceWorker;
