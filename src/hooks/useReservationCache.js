import { useCallback, useRef } from 'react';
import useCacheManager from './useCacheManager';

/**
 * Hook especializado para cache de reservaciones con invalidación inteligente
 */
export const useReservationCache = (options = {}) => {
  const {
    pageCacheTTL = parseInt(import.meta.env.VITE_RESERVATIONS_CACHE_TTL_MS) || 60000,
    statsCacheTTL = 300000, // 5 minutos para estadísticas
    schedulesCacheTTL = 180000, // 3 minutos para horarios disponibles
    enablePrefetch = true
  } = options;

  const cache = useCacheManager({
    maxSize: 30,
    defaultTTL: pageCacheTTL,
    namespace: 'reservations'
  });

  const prefetchQueueRef = useRef(new Set());
  const backgroundTasksRef = useRef(new Set());

  // Generar claves de cache consistentes
  const generateCacheKey = useCallback((type, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${type}${sortedParams ? `#${sortedParams}` : ''}`;
  }, []);

  // Cache de páginas de reservaciones
  const getCachedPage = useCallback((filters = {}, page = 1) => {
    const key = generateCacheKey('page', { ...filters, page });
    return cache.get(key);
  }, [cache, generateCacheKey]);

  const setCachedPage = useCallback((data, filters = {}, page = 1) => {
    const key = generateCacheKey('page', { ...filters, page });
    cache.set(key, data, pageCacheTTL);
    
    // Log para telemetría
    console.log(`[telemetry] reservations.cache.page.set`, { 
      key, 
      count: data?.reservations?.length || 0,
      hasNext: !!data?.pagination?.hasNext
    });
  }, [cache, generateCacheKey, pageCacheTTL]);

  // Cache de horarios disponibles
  const getCachedSchedules = useCallback((productId, date) => {
    const key = generateCacheKey('schedules', { productId, date });
    return cache.get(key);
  }, [cache, generateCacheKey]);

  const setCachedSchedules = useCallback((schedules, productId, date) => {
    const key = generateCacheKey('schedules', { productId, date });
    cache.set(key, schedules, schedulesCacheTTL);
  }, [cache, generateCacheKey, schedulesCacheTTL]);

  // Cache de estadísticas
  const getCachedStats = useCallback((type = 'general') => {
    const key = generateCacheKey('stats', { type });
    return cache.get(key);
  }, [cache, generateCacheKey]);

  const setCachedStats = useCallback((stats, type = 'general') => {
    const key = generateCacheKey('stats', { type });
    cache.set(key, stats, statsCacheTTL);
  }, [cache, generateCacheKey, statsCacheTTL]);

  // Invalidación inteligente post-mutación
  const invalidateAfterMutation = useCallback((mutationType, reservationData = {}) => {
    console.log(`[telemetry] reservations.cache.invalidate.${mutationType}`, reservationData);

    switch (mutationType) {
      case 'create':
      case 'update':
      case 'delete':
        // Invalidar todas las páginas (pueden afectar orden/filtros)
        const pagesInvalidated = cache.invalidatePattern('^page#');
        
        // Invalidar estadísticas
        cache.invalidatePattern('^stats#');
        
        // Invalidar horarios del producto específico si disponible
        if (reservationData.product_id) {
          cache.invalidatePattern(`^schedules#.*productId:${reservationData.product_id}`);
        }
        
        console.log(`[telemetry] reservations.cache.invalidate.complete`, {
          mutationType,
          pagesInvalidated,
          productId: reservationData.product_id
        });
        break;
        
      case 'reschedule':
        // Invalidar horarios de ambos productos si cambió
        if (reservationData.oldProductId && reservationData.newProductId) {
          cache.invalidatePattern(`^schedules#.*productId:${reservationData.oldProductId}`);
          cache.invalidatePattern(`^schedules#.*productId:${reservationData.newProductId}`);
        }
        
        // Invalidar páginas y stats
        cache.invalidatePattern('^page#');
        cache.invalidatePattern('^stats#');
        break;
        
      default:
        console.warn(`Unknown mutation type: ${mutationType}`);
    }
  }, [cache]);

  // Prefetch de página siguiente
  const prefetchNextPage = useCallback(async (currentFilters, currentPage, fetchFunction) => {
    if (!enablePrefetch) return;

    const nextPage = currentPage + 1;
    const nextPageKey = generateCacheKey('page', { ...currentFilters, page: nextPage });
    
    // Skip si ya está en cache o en cola de prefetch
    if (cache.get(nextPageKey) || prefetchQueueRef.current.has(nextPageKey)) {
      console.log(`[telemetry] reservations.prefetch.skip`, { 
        key: nextPageKey, 
        reason: cache.get(nextPageKey) ? 'already_cached' : 'in_queue'
      });
      return;
    }

    prefetchQueueRef.current.add(nextPageKey);

    try {
      console.log(`[telemetry] reservations.prefetch.start`, { key: nextPageKey });
      
      const data = await fetchFunction({ ...currentFilters, page: nextPage });
      
      if (data && data.reservations && data.reservations.length > 0) {
        setCachedPage(data, currentFilters, nextPage);
        console.log(`[telemetry] reservations.prefetch.success`, { 
          key: nextPageKey,
          count: data.reservations.length
        });
      } else {
        console.log(`[telemetry] reservations.prefetch.empty`, { key: nextPageKey });
      }
    } catch (error) {
      console.log(`[telemetry] reservations.prefetch.error`, { 
        key: nextPageKey,
        error: error.message
      });
    } finally {
      prefetchQueueRef.current.delete(nextPageKey);
    }
  }, [enablePrefetch, cache, generateCacheKey, setCachedPage]);

  // Revalidación en background
  const backgroundRevalidate = useCallback(async (filters, page, fetchFunction) => {
    const key = generateCacheKey('page', { ...filters, page });
    
    // Solo revalidar si está stale
    if (!cache.isStale(key, 0.5)) return;

    // Evitar múltiples revalidaciones simultáneas
    if (backgroundTasksRef.current.has(key)) return;

    backgroundTasksRef.current.add(key);

    try {
      console.log(`[telemetry] reservations.revalidate.background.start`, { key });
      
      const data = await fetchFunction({ ...filters, page });
      setCachedPage(data, filters, page);
      
      console.log(`[telemetry] reservations.revalidate.background.success`, { 
        key,
        count: data?.reservations?.length || 0
      });
    } catch (error) {
      console.log(`[telemetry] reservations.revalidate.background.error`, { 
        key,
        error: error.message
      });
    } finally {
      backgroundTasksRef.current.delete(key);
    }
  }, [cache, generateCacheKey, setCachedPage]);

  // Verificar si necesita revalidación
  const needsRevalidation = useCallback((filters = {}, page = 1) => {
    const key = generateCacheKey('page', { ...filters, page });
    return cache.isStale(key, 0.5);
  }, [cache, generateCacheKey]);

  // Estadísticas del cache
  const getCacheStats = useCallback(() => {
    return {
      ...cache.getStats(),
      prefetchQueue: prefetchQueueRef.current.size,
      backgroundTasks: backgroundTasksRef.current.size
    };
  }, [cache]);

  return {
    // Cache de páginas
    getCachedPage,
    setCachedPage,
    
    // Cache de horarios
    getCachedSchedules,
    setCachedSchedules,
    
    // Cache de estadísticas
    getCachedStats,
    setCachedStats,
    
    // Invalidación
    invalidateAfterMutation,
    
    // Optimizaciones
    prefetchNextPage,
    backgroundRevalidate,
    needsRevalidation,
    
    // Utilidades
    getCacheStats,
    clearCache: cache.clear,
    
    // Cache base para acceso directo
    cache
  };
};

export default useReservationCache;
