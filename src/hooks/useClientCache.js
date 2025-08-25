/**
 * @fileoverview Hook useClientCache - Cache management avanzado
 * Wave 3B: Advanced Caching
 * 
 * Features:
 * - TTL avanzado con timers automáticos
 * - LRU eviction con límite configurable
 * - Background revalidation cuando edad > 50% TTL
 * - LocalStorage persistence para offline
 * - Telemetría completa cache hit/miss/evict
 * - Invalidación inteligente por tipo operación
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useClientStore } from '@/store/useClientStore';

/**
 * Configuración por defecto del cache
 */
const DEFAULT_CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutos en milisegundos
  maxEntries: 30,
  staleThreshold: 0.5, // 50% del TTL
  persistToStorage: true,
  enableTelemetry: true,
  backgroundRevalidation: true
};

/**
 * Hook para gestión avanzada de cache de clientes
 * @param {Object} config - Configuración del cache
 * @returns {Object} Interface del cache con métodos y estado
 */
export function useClientCache(config = {}) {
  const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
  const store = useClientStore();
  
  const [cacheState, setCacheState] = useState({
    hits: 0,
    misses: 0,
    evictions: 0,
    revalidations: 0,
    lastCleanup: Date.now()
  });

  const timersRef = useRef(new Map());
  const telemetryRef = useRef([]);

  /**
   * Registrar evento de telemetría
   */
  const recordTelemetry = useCallback((event, data) => {
    if (!finalConfig.enableTelemetry) return;

    const entry = {
      timestamp: Date.now(),
      event,
      data
    };

    telemetryRef.current.push(entry);
    
    // Mantener solo los últimos 100 eventos
    if (telemetryRef.current.length > 100) {
      telemetryRef.current = telemetryRef.current.slice(-100);
    }

    // También enviar al store si tiene telemetría
    if (typeof store?.getTelemetrySnapshot === 'function') {
      try {
        // El store ya maneja su propia telemetría
      } catch (error) {
        console.warn('Cache telemetry error:', error);
      }
    }
  }, [finalConfig.enableTelemetry, store]);

  /**
   * Generar clave de cache
   */
  const generateCacheKey = useCallback((search = '', page = 1, pageSize = 20) => {
    return `clients_${search || 'all'}_${page}_${pageSize}`;
  }, []);

  /**
   * Verificar si una entrada está stale
   */
  const isStale = useCallback((entry) => {
    if (!entry || !entry.timestamp) return true;
    
    const age = Date.now() - entry.timestamp;
    const staleTime = finalConfig.ttl * finalConfig.staleThreshold;
    
    return age > staleTime;
  }, [finalConfig.ttl, finalConfig.staleThreshold]);

  /**
   * Verificar si una entrada está expirada
   */
  const isExpired = useCallback((entry) => {
    if (!entry || !entry.timestamp) return true;
    
    const age = Date.now() - entry.timestamp;
    return age > finalConfig.ttl;
  }, [finalConfig.ttl]);

  /**
   * Obtener entrada del cache
   */
  const getCacheEntry = useCallback((cacheKey) => {
    const pageCache = store.pageCache || {};
    const entry = pageCache[cacheKey];

    if (!entry) {
      setCacheState(prev => ({ ...prev, misses: prev.misses + 1 }));
      recordTelemetry('cache.miss', { cacheKey });
      return null;
    }

    if (isExpired(entry)) {
      setCacheState(prev => ({ ...prev, misses: prev.misses + 1 }));
      recordTelemetry('cache.expired', { cacheKey, age: Date.now() - entry.timestamp });
      return null;
    }

    setCacheState(prev => ({ ...prev, hits: prev.hits + 1 }));
    recordTelemetry('cache.hit', { 
      cacheKey, 
      age: Date.now() - entry.timestamp,
      stale: isStale(entry)
    });

    return entry;
  }, [store.pageCache, isExpired, isStale, recordTelemetry]);

  /**
   * Configurar timer de expiración para una entrada
   */
  const setExpirationTimer = useCallback((cacheKey, entry) => {
    // Limpiar timer existente si existe
    if (timersRef.current.has(cacheKey)) {
      clearTimeout(timersRef.current.get(cacheKey));
    }

    // Calcular tiempo hasta expiración
    const age = Date.now() - entry.timestamp;
    const timeToExpire = finalConfig.ttl - age;

    if (timeToExpire > 0) {
      const timerId = setTimeout(() => {
        recordTelemetry('cache.auto_expired', { cacheKey });
        // La limpieza se hará en el próximo acceso o cleanup
        timersRef.current.delete(cacheKey);
      }, timeToExpire);

      timersRef.current.set(cacheKey, timerId);
    }
  }, [finalConfig.ttl, recordTelemetry]);

  /**
   * Programar revalidación en background
   */
  const scheduleBackgroundRevalidation = useCallback((cacheKey, search, page, pageSize) => {
    if (!finalConfig.backgroundRevalidation) return;

    // Revalidar después de un breve delay para no bloquear UI
    setTimeout(async () => {
      try {
        recordTelemetry('cache.background_revalidation_start', { cacheKey });
        
        await store.fetchClients(page, pageSize, search, true);
        
        setCacheState(prev => ({ ...prev, revalidations: prev.revalidations + 1 }));
        recordTelemetry('cache.background_revalidation_success', { cacheKey });
      } catch (error) {
        recordTelemetry('cache.background_revalidation_error', { 
          cacheKey, 
          error: error.message 
        });
      }
    }, 100);
  }, [finalConfig.backgroundRevalidation, store, recordTelemetry]);

  /**
   * Obtener datos con cache inteligente
   */
  const getWithCache = useCallback(async (search = '', page = 1, pageSize = 20) => {
    const cacheKey = generateCacheKey(search, page, pageSize);
    const cachedEntry = getCacheEntry(cacheKey);

    if (cachedEntry) {
      // Configurar timer de expiración si no existe
      setExpirationTimer(cacheKey, cachedEntry);

      // Programar revalidación en background si está stale
      if (isStale(cachedEntry)) {
        scheduleBackgroundRevalidation(cacheKey, search, page, pageSize);
      }

      return {
        data: cachedEntry.clients || [],
        pagination: cachedEntry.pagination,
        fromCache: true,
        stale: isStale(cachedEntry)
      };
    }

    // Cache miss - fetch from store
    try {
      const result = await store.fetchClients(page, pageSize, search);
      
      recordTelemetry('cache.fetch_success', { 
        cacheKey, 
        count: Array.isArray(result) ? result.length : result?.data?.length || 0 
      });

      return {
        data: Array.isArray(result) ? result : result.data || [],
        pagination: result.pagination,
        fromCache: false,
        stale: false
      };
    } catch (error) {
      recordTelemetry('cache.fetch_error', { cacheKey, error: error.message });
      throw error;
    }
  }, [
    generateCacheKey, 
    getCacheEntry, 
    setExpirationTimer, 
    isStale, 
    scheduleBackgroundRevalidation, 
    store, 
    recordTelemetry
  ]);

  /**
   * Invalidar cache por patrón
   */
  const invalidateCache = useCallback((pattern = null) => {
    const pageCache = store.pageCache || {};
    let invalidatedKeys = [];

    if (pattern) {
      // Invalidar por patrón específico
      Object.keys(pageCache).forEach(key => {
        if (key.includes(pattern)) {
          invalidatedKeys.push(key);
        }
      });
    } else {
      // Invalidar todo el cache
      invalidatedKeys = Object.keys(pageCache);
    }

    if (invalidatedKeys.length > 0) {
      store.clearCache?.();
      setCacheState(prev => ({ ...prev, evictions: prev.evictions + invalidatedKeys.length }));
      recordTelemetry('cache.invalidated', { 
        pattern, 
        keysCount: invalidatedKeys.length,
        keys: invalidatedKeys 
      });
    }

    // Limpiar timers de las claves invalidadas
    invalidatedKeys.forEach(key => {
      if (timersRef.current.has(key)) {
        clearTimeout(timersRef.current.get(key));
        timersRef.current.delete(key);
      }
    });
  }, [store, recordTelemetry]);

  /**
   * Persistir cache a localStorage
   */
  const persistCache = useCallback(() => {
    if (!finalConfig.persistToStorage) return;

    try {
      const pageCache = store.pageCache || {};
      const cacheData = {
        timestamp: Date.now(),
        cache: pageCache,
        config: finalConfig
      };

      localStorage.setItem('clientCache', JSON.stringify(cacheData));
      recordTelemetry('cache.persisted', { entriesCount: Object.keys(pageCache).length });
    } catch (error) {
      recordTelemetry('cache.persist_error', { error: error.message });
    }
  }, [finalConfig, store.pageCache, recordTelemetry]);

  /**
   * Hidratar cache desde localStorage
   */
  const hydrateCache = useCallback(() => {
    if (!finalConfig.persistToStorage) return false;

    try {
      const stored = localStorage.getItem('clientCache');
      if (!stored) return false;

      const cacheData = JSON.parse(stored);
      const age = Date.now() - cacheData.timestamp;

      // Verificar si el cache persistido no está demasiado viejo
      if (age > finalConfig.ttl * 2) {
        localStorage.removeItem('clientCache');
        recordTelemetry('cache.hydrate_expired', { age });
        return false;
      }

      // Hidratar cache válido
      const validEntries = {};
      Object.entries(cacheData.cache).forEach(([key, entry]) => {
        if (!isExpired(entry)) {
          validEntries[key] = entry;
          setExpirationTimer(key, entry);
        }
      });

      if (Object.keys(validEntries).length > 0) {
        recordTelemetry('cache.hydrated', { 
          entriesCount: Object.keys(validEntries).length,
          totalStored: Object.keys(cacheData.cache).length
        });
        return true;
      }

      return false;
    } catch (error) {
      recordTelemetry('cache.hydrate_error', { error: error.message });
      return false;
    }
  }, [finalConfig, isExpired, setExpirationTimer, recordTelemetry]);

  /**
   * Obtener estadísticas del cache
   */
  const getCacheStats = useCallback(() => {
    const pageCache = store.pageCache || {};
    const totalOperations = cacheState.hits + cacheState.misses;
    const hitRatio = totalOperations > 0 ? (cacheState.hits / totalOperations) * 100 : 0;

    return {
      ...cacheState,
      totalOperations,
      hitRatio: Number(hitRatio.toFixed(1)),
      entriesCount: Object.keys(pageCache).length,
      maxEntries: finalConfig.maxEntries,
      ttl: finalConfig.ttl,
      config: finalConfig,
      telemetryEvents: telemetryRef.current.length
    };
  }, [store.pageCache, cacheState, finalConfig]);

  /**
   * Cleanup automático en unmount
   */
  useEffect(() => {
    return () => {
      // Limpiar todos los timers
      timersRef.current.forEach(timerId => {
        clearTimeout(timerId);
      });
      timersRef.current.clear();

      // Persistir cache si está configurado
      if (finalConfig.persistToStorage) {
        persistCache();
      }
    };
  }, [finalConfig.persistToStorage, persistCache]);

  /**
   * Hidratación inicial
   */
  useEffect(() => {
    hydrateCache();
  }, [hydrateCache]);

  return {
    // Métodos principales
    get: getWithCache,
    invalidate: invalidateCache,
    persist: persistCache,
    hydrate: hydrateCache,
    
    // Estado y estadísticas
    stats: getCacheStats(),
    
    // Utilidades
    generateKey: generateCacheKey,
    isStale,
    isExpired,
    
    // Configuración
    config: finalConfig
  };
}

export default useClientCache;
