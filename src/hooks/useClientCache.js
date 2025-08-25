import { useEffect, useRef, useCallback, useMemo } from 'react';
import { telemetry } from '@/lib/telemetry';

/**
 * Wave 3B: Advanced Cache Management Hook
 * 
 * Características implementadas:
 * - TTL con auto-cleanup y background revalidation
 * - LRU eviction (límite 30 entradas por defecto)
 * - Background revalidation cuando edad > 50% TTL
 * - Prefetch con cola de deduplicación
 * - Invalidación post-mutación inteligente
 * - Telemetría completa (hit/miss/evict/prefetch)
 * - Persistencia localStorage opcional
 * 
 * @param {Object} options - Configuración del cache
 * @param {number} options.ttl - TTL en ms (default: 5 minutos)
 * @param {number} options.maxEntries - Máximo entradas LRU (default: 30)
 * @param {boolean} options.enableTelemetry - Telemetría habilitada (default: true)
 * @param {boolean} options.enablePersistence - Persistencia localStorage (default: true)
 * @param {boolean} options.enableBackgroundRevalidation - Revalidación background (default: true)
 * @param {number} options.revalidationThreshold - Umbral revalidación (default: 0.5 = 50%)
 * @param {Function} options.fetcher - Función para obtener datos frescos
 * @param {string} options.prefix - Prefijo para keys de cache (default: 'client_cache')
 */
export const useClientCache = (options = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos
    maxEntries = 30,
    enableTelemetry = true,
    enablePersistence = true,
    enableBackgroundRevalidation = true,
    revalidationThreshold = 0.5, // 50%
    fetcher = null,
    prefix = 'client_cache'
  } = options;

  // Referencias para mantener estado persistente
  const cacheRef = useRef(new Map());
  const accessOrderRef = useRef(new Map()); // Para LRU tracking
  const backgroundJobsRef = useRef(new Set()); // Para deduplicación
  const telemetryRef = useRef({
    hits: 0,
    misses: 0,
    evictions: 0,
    prefetches: 0,
    backgroundRevalidations: 0,
    totalRequests: 0
  });

  // Timers para auto-cleanup
  const cleanupTimerRef = useRef(null);

  // Wave 3B: Cargar cache desde localStorage al inicializar
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const savedCache = localStorage.getItem(`${prefix}_data`);
      const savedStats = localStorage.getItem(`${prefix}_stats`);
      
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        const now = Date.now();
        
        // Filtrar entradas expiradas al cargar
        Object.entries(parsed).forEach(([key, entry]) => {
          if (now - entry.timestamp < ttl) {
            cacheRef.current.set(key, entry);
            accessOrderRef.current.set(key, now);
          }
        });

        if (enableTelemetry) {
          telemetry.record('feature.clients.cache.loaded', {
            entriesLoaded: cacheRef.current.size,
            entriesExpired: Object.keys(parsed).length - cacheRef.current.size
          });
        }
      }

      if (savedStats) {
        telemetryRef.current = { ...telemetryRef.current, ...JSON.parse(savedStats) };
      }
    } catch (error) {
      console.warn('Error loading cache from localStorage:', error);
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.load_error', { error: error.message });
      }
    }
  }, [prefix, ttl, enablePersistence, enableTelemetry]);

  // Wave 3B: Persistir cache en localStorage
  const persistCache = useCallback(() => {
    if (!enablePersistence) return;

    try {
      const cacheData = {};
      cacheRef.current.forEach((value, key) => {
        cacheData[key] = value;
      });

      localStorage.setItem(`${prefix}_data`, JSON.stringify(cacheData));
      localStorage.setItem(`${prefix}_stats`, JSON.stringify(telemetryRef.current));
    } catch (error) {
      console.warn('Error persisting cache:', error);
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.persist_error', { error: error.message });
      }
    }
  }, [prefix, enablePersistence, enableTelemetry]);

  // Wave 3B: LRU Eviction - Evitar que el cache crezca indefinidamente
  const evictLRU = useCallback(() => {
    if (cacheRef.current.size <= maxEntries) return;

    // Encontrar la entrada menos recientemente usada
    let oldestKey = null;
    let oldestTime = Infinity;

    accessOrderRef.current.forEach((time, key) => {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      cacheRef.current.delete(oldestKey);
      accessOrderRef.current.delete(oldestKey);
      telemetryRef.current.evictions++;

      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.eviction', {
          evictedKey: oldestKey,
          reason: 'lru',
          cacheSize: cacheRef.current.size
        });
      }
    }
  }, [maxEntries, enableTelemetry]);

  // Wave 3B: Background Revalidation
  const shouldRevalidate = useCallback((entry) => {
    if (!enableBackgroundRevalidation || !fetcher) return false;
    
    const age = Date.now() - entry.timestamp;
    const ageThreshold = ttl * revalidationThreshold;
    
    return age > ageThreshold;
  }, [enableBackgroundRevalidation, fetcher, ttl, revalidationThreshold]);

  const backgroundRevalidate = useCallback(async (key) => {
    if (!fetcher || backgroundJobsRef.current.has(key)) return;

    backgroundJobsRef.current.add(key);
    
    try {
      const freshData = await fetcher(key);
      
      // Actualizar cache con datos frescos
      cacheRef.current.set(key, {
        data: freshData,
        timestamp: Date.now()
      });
      accessOrderRef.current.set(key, Date.now());
      
      telemetryRef.current.backgroundRevalidations++;
      
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.background_revalidation', {
          key,
          success: true
        });
      }
    } catch (error) {
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.background_revalidation', {
          key,
          success: false,
          error: error.message
        });
      }
    } finally {
      backgroundJobsRef.current.delete(key);
    }
  }, [fetcher, enableTelemetry]);

  // Obtener valor del cache
  const get = useCallback((key) => {
    telemetryRef.current.totalRequests++;
    
    const entry = cacheRef.current.get(key);
    const now = Date.now();

    if (!entry) {
      telemetryRef.current.misses++;
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.miss', { key });
      }
      return null;
    }

    // Verificar si está expirado
    if (now - entry.timestamp > ttl) {
      cacheRef.current.delete(key);
      accessOrderRef.current.delete(key);
      telemetryRef.current.misses++;
      
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.miss', { key, reason: 'expired' });
      }
      return null;
    }

    // Cache hit - actualizar orden de acceso
    accessOrderRef.current.set(key, now);
    telemetryRef.current.hits++;

    if (enableTelemetry) {
      telemetry.record('feature.clients.cache.hit', { key });
    }

    // Wave 3B: Verificar si necesita revalidación background
    if (shouldRevalidate(entry)) {
      backgroundRevalidate(key);
    }

    return entry.data;
  }, [ttl, enableTelemetry, shouldRevalidate, backgroundRevalidate]);

  // Establecer valor en cache
  const set = useCallback((key, data) => {
    const now = Date.now();
    
    cacheRef.current.set(key, {
      data,
      timestamp: now
    });
    
    accessOrderRef.current.set(key, now);
    
    // Evictar si excede límite
    evictLRU();
    
    // Persistir cambios
    persistCache();

    if (enableTelemetry) {
      telemetry.record('feature.clients.cache.set', {
        key,
        cacheSize: cacheRef.current.size
      });
    }
  }, [evictLRU, persistCache, enableTelemetry]);

  // Wave 3B: Prefetch con deduplicación
  const prefetch = useCallback(async (key) => {
    if (!fetcher || backgroundJobsRef.current.has(`prefetch_${key}`)) return;
    
    // Si ya está en cache y no necesita revalidación, no prefetch
    const existing = cacheRef.current.get(key);
    if (existing && !shouldRevalidate(existing)) return;

    backgroundJobsRef.current.add(`prefetch_${key}`);
    
    try {
      const data = await fetcher(key);
      set(key, data);
      
      telemetryRef.current.prefetches++;
      
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.prefetch', {
          key,
          success: true
        });
      }
    } catch (error) {
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.prefetch', {
          key,
          success: false,
          error: error.message
        });
      }
    } finally {
      backgroundJobsRef.current.delete(`prefetch_${key}`);
    }
  }, [fetcher, set, shouldRevalidate, enableTelemetry]);

  // Wave 3B: Invalidación inteligente post-mutación
  const invalidate = useCallback((keyOrPattern) => {
    if (typeof keyOrPattern === 'string') {
      // Invalidar key específica
      if (cacheRef.current.has(keyOrPattern)) {
        cacheRef.current.delete(keyOrPattern);
        accessOrderRef.current.delete(keyOrPattern);
        
        if (enableTelemetry) {
          telemetry.record('feature.clients.cache.invalidate', {
            key: keyOrPattern,
            type: 'single'
          });
        }
      }
    } else if (keyOrPattern instanceof RegExp) {
      // Invalidar por patrón
      let invalidatedCount = 0;
      
      cacheRef.current.forEach((_, key) => {
        if (keyOrPattern.test(key)) {
          cacheRef.current.delete(key);
          accessOrderRef.current.delete(key);
          invalidatedCount++;
        }
      });
      
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.invalidate', {
          pattern: keyOrPattern.toString(),
          type: 'pattern',
          count: invalidatedCount
        });
      }
    }
    
    persistCache();
  }, [persistCache, enableTelemetry]);

  // Limpiar cache expirado
  const cleanup = useCallback(() => {
    const now = Date.now();
    let cleanedCount = 0;

    cacheRef.current.forEach((entry, key) => {
      if (now - entry.timestamp > ttl) {
        cacheRef.current.delete(key);
        accessOrderRef.current.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      persistCache();
      
      if (enableTelemetry) {
        telemetry.record('feature.clients.cache.cleanup', {
          cleanedCount,
          remainingCount: cacheRef.current.size
        });
      }
    }
  }, [ttl, persistCache, enableTelemetry]);

  // Auto-cleanup timer
  useEffect(() => {
    cleanupTimerRef.current = setInterval(cleanup, ttl / 2); // Cleanup cada mitad del TTL
    
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanup, ttl]);

  // Limpiar cache completamente
  const clear = useCallback(() => {
    const size = cacheRef.current.size;
    cacheRef.current.clear();
    accessOrderRef.current.clear();
    backgroundJobsRef.current.clear();
    
    persistCache();

    if (enableTelemetry) {
      telemetry.record('feature.clients.cache.clear', { clearedCount: size });
    }
  }, [persistCache, enableTelemetry]);

  // Estadísticas en tiempo real
  const stats = useMemo(() => {
    const { hits, misses, evictions, prefetches, backgroundRevalidations, totalRequests } = telemetryRef.current;
    
    return {
      hits,
      misses,
      evictions,
      prefetches,
      backgroundRevalidations,
      totalRequests,
      hitRatio: totalRequests > 0 ? hits / totalRequests : 0,
      cacheSize: cacheRef.current.size,
      maxEntries
    };
  }, [maxEntries]);

  return {
    // Operaciones principales
    get,
    set,
    prefetch,
    invalidate,
    cleanup,
    clear,
    
    // Estadísticas
    stats,
    
    // Estado
    isBackgroundJobRunning: (key) => backgroundJobsRef.current.has(key),
    
    // Configuración
    ttl,
    maxEntries
  };
};
