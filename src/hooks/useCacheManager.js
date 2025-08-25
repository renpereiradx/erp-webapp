import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para gestión avanzada de cache con TTL, LRU y telemetría
 */
export const useCacheManager = (options = {}) => {
  const {
    maxSize = 30,
    defaultTTL = 60000, // 60 segundos
    enableTelemetry = true,
    namespace = 'cache'
  } = options;

  const cacheRef = useRef(new Map());
  const accessOrderRef = useRef(new Map()); // Para LRU
  const ttlTimersRef = useRef(new Map());
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0
  });

  // Telemetría
  const logTelemetry = useCallback((event, data = {}) => {
    if (!enableTelemetry) return;
    console.log(`[telemetry] ${namespace}.${event}`, data);
  }, [enableTelemetry, namespace]);

  // Limpieza LRU
  const evictLRU = useCallback(() => {
    if (cacheRef.current.size <= maxSize) return;

    // Encontrar la entrada menos recientemente usada
    const oldestKey = accessOrderRef.current.keys().next().value;
    if (oldestKey) {
      cacheRef.current.delete(oldestKey);
      accessOrderRef.current.delete(oldestKey);
      
      // Limpiar timer TTL si existe
      const timer = ttlTimersRef.current.get(oldestKey);
      if (timer) {
        clearTimeout(timer);
        ttlTimersRef.current.delete(oldestKey);
      }

      setCacheStats(prev => ({
        ...prev,
        evictions: prev.evictions + 1,
        size: prev.size - 1
      }));

      logTelemetry('evict.lru', { key: oldestKey, reason: 'size_limit' });
    }
  }, [maxSize, logTelemetry]);

  // Actualizar orden de acceso para LRU
  const updateAccessOrder = useCallback((key) => {
    accessOrderRef.current.delete(key);
    accessOrderRef.current.set(key, Date.now());
  }, []);

  // Obtener del cache
  const get = useCallback((key) => {
    const entry = cacheRef.current.get(key);
    
    if (!entry) {
      setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      logTelemetry('miss', { key });
      return null;
    }

    // Verificar TTL
    if (Date.now() > entry.expiresAt) {
      cacheRef.current.delete(key);
      accessOrderRef.current.delete(key);
      
      const timer = ttlTimersRef.current.get(key);
      if (timer) {
        clearTimeout(timer);
        ttlTimersRef.current.delete(key);
      }

      setCacheStats(prev => ({ 
        ...prev, 
        misses: prev.misses + 1,
        size: prev.size - 1
      }));

      logTelemetry('miss', { key, reason: 'expired' });
      return null;
    }

    updateAccessOrder(key);
    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    logTelemetry('hit', { key, age: Date.now() - entry.createdAt });
    
    return entry.data;
  }, [updateAccessOrder, logTelemetry]);

  // Guardar en cache
  const set = useCallback((key, data, customTTL = defaultTTL) => {
    const now = Date.now();
    const expiresAt = now + customTTL;

    // Limpiar timer anterior si existe
    const existingTimer = ttlTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Crear entrada
    const entry = {
      data,
      createdAt: now,
      expiresAt,
      accessCount: 1
    };

    const isNewEntry = !cacheRef.current.has(key);
    cacheRef.current.set(key, entry);
    updateAccessOrder(key);

    // Configurar timer TTL
    const timer = setTimeout(() => {
      cacheRef.current.delete(key);
      accessOrderRef.current.delete(key);
      ttlTimersRef.current.delete(key);
      
      setCacheStats(prev => ({ 
        ...prev, 
        size: prev.size - 1 
      }));
      
      logTelemetry('expire', { key, ttl: customTTL });
    }, customTTL);

    ttlTimersRef.current.set(key, timer);

    // Actualizar stats
    if (isNewEntry) {
      setCacheStats(prev => ({ ...prev, size: prev.size + 1 }));
    }

    // Ejecutar LRU si es necesario
    evictLRU();

    logTelemetry('set', { 
      key, 
      ttl: customTTL, 
      isUpdate: !isNewEntry,
      size: cacheRef.current.size 
    });
  }, [defaultTTL, updateAccessOrder, evictLRU, logTelemetry]);

  // Invalidar entrada específica
  const invalidate = useCallback((key) => {
    const hadEntry = cacheRef.current.has(key);
    
    if (hadEntry) {
      cacheRef.current.delete(key);
      accessOrderRef.current.delete(key);
      
      const timer = ttlTimersRef.current.get(key);
      if (timer) {
        clearTimeout(timer);
        ttlTimersRef.current.delete(key);
      }

      setCacheStats(prev => ({ ...prev, size: prev.size - 1 }));
      logTelemetry('invalidate', { key });
    }

    return hadEntry;
  }, [logTelemetry]);

  // Invalidar múltiples entradas por patrón
  const invalidatePattern = useCallback((pattern) => {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const key of cacheRef.current.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => invalidate(key));
    
    logTelemetry('invalidate.pattern', { 
      pattern, 
      count: keysToDelete.length,
      keys: keysToDelete 
    });

    return keysToDelete.length;
  }, [invalidate, logTelemetry]);

  // Limpiar todo el cache
  const clear = useCallback(() => {
    const size = cacheRef.current.size;
    
    // Limpiar todos los timers
    for (const timer of ttlTimersRef.current.values()) {
      clearTimeout(timer);
    }

    cacheRef.current.clear();
    accessOrderRef.current.clear();
    ttlTimersRef.current.clear();

    setCacheStats({
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    });

    logTelemetry('clear', { previousSize: size });
  }, [logTelemetry]);

  // Verificar si una entrada está cerca de expirar
  const isStale = useCallback((key, staleThreshold = 0.5) => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.createdAt;
    const ttl = entry.expiresAt - entry.createdAt;
    
    return age > (ttl * staleThreshold);
  }, []);

  // Obtener estadísticas de rendimiento
  const getStats = useCallback(() => {
    const total = cacheStats.hits + cacheStats.misses;
    const hitRatio = total > 0 ? (cacheStats.hits / total) * 100 : 0;

    return {
      ...cacheStats,
      hitRatio: Math.round(hitRatio * 100) / 100,
      maxSize,
      defaultTTL
    };
  }, [cacheStats, maxSize, defaultTTL]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      for (const timer of ttlTimersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  return {
    get,
    set,
    invalidate,
    invalidatePattern,
    clear,
    isStale,
    getStats,
    stats: cacheStats
  };
};

export default useCacheManager;
