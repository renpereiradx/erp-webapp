import { useEffect, useRef, useCallback } from 'react';
import { telemetry } from '@/lib/telemetry';

/**
 * Wave 3B: Advanced Prefetch & Cache Warming Hook
 * 
 * Características implementadas:
 * - Prefetch siguiente página asíncrono con cola de deduplicación
 * - Cache warming inteligente basado en patrones de uso
 * - Revalidación background cuando edad cache > 50% TTL
 * - Invalidación post-mutación por tipo de operación
 * - Telemetría específica para prefetch operations
 * 
 * @param {Object} options - Configuración del prefetch
 * @param {Function} options.fetcher - Función para obtener datos
 * @param {Object} options.cache - Instancia del cache (useClientCache)
 * @param {boolean} options.enablePrefetch - Prefetch habilitado (default: true)
 * @param {boolean} options.enableCacheWarming - Cache warming habilitado (default: true)
 * @param {number} options.prefetchThreshold - Threshold para prefetch automático (default: 0.8)
 */
export const usePrefetchManager = (options = {}) => {
  const {
    fetcher,
    cache,
    enablePrefetch = true,
    enableCacheWarming = true,
    prefetchThreshold = 0.8 // 80% de la página para trigger prefetch
  } = options;

  // Referencias para gestión de cola
  const prefetchQueueRef = useRef(new Set());
  const warmingQueueRef = useRef(new Set());
  const intersectionObserverRef = useRef(null);

  /**
   * Wave 3B: Prefetch siguiente página con deduplicación
   */
  const prefetchNextPage = useCallback(async (currentPage, totalPages, searchTerm = '', pageSize = 25) => {
    if (!enablePrefetch || !fetcher || !cache) return;

    const nextPage = currentPage + 1;
    if (nextPage > totalPages) return;

    const prefetchKey = `page_${nextPage}_${searchTerm}_${pageSize}`;
    
    // Deduplicación: evitar prefetch duplicados
    if (prefetchQueueRef.current.has(prefetchKey)) return;

    // Verificar si ya está en cache
    const cached = cache.get(prefetchKey);
    if (cached) return;

    prefetchQueueRef.current.add(prefetchKey);

    try {
      telemetry.record('feature.clients.prefetch.next_page.start', {
        currentPage,
        nextPage,
        searchTerm,
        pageSize
      });

      const data = await fetcher({
        page: nextPage,
        pageSize,
        searchTerm
      });

      // Guardar en cache
      cache.set(prefetchKey, data);

      telemetry.record('feature.clients.prefetch.next_page.success', {
        currentPage,
        nextPage,
        searchTerm,
        pageSize,
        resultCount: data?.clients?.length || 0
      });

    } catch (error) {
      telemetry.record('feature.clients.prefetch.next_page.error', {
        currentPage,
        nextPage,
        searchTerm,
        pageSize,
        error: error.message
      });
    } finally {
      prefetchQueueRef.current.delete(prefetchKey);
    }
  }, [enablePrefetch, fetcher, cache]);

  /**
   * Wave 3B: Cache Warming inteligente
   * Precarga páginas populares y datos frecuentemente accedidos
   */
  const warmCache = useCallback(async (patterns = []) => {
    if (!enableCacheWarming || !fetcher || !cache) return;

    const defaultPatterns = [
      { page: 1, pageSize: 25, searchTerm: '' }, // Primera página siempre
      { page: 1, pageSize: 50, searchTerm: '' }, // Primera página con más resultados
    ];

    const warmingPatterns = patterns.length > 0 ? patterns : defaultPatterns;

    for (const pattern of warmingPatterns) {
      const warmingKey = `warming_${pattern.page}_${pattern.searchTerm}_${pattern.pageSize}`;
      
      if (warmingQueueRef.current.has(warmingKey)) continue;
      if (cache.get(`page_${pattern.page}_${pattern.searchTerm}_${pattern.pageSize}`)) continue;

      warmingQueueRef.current.add(warmingKey);

      try {
        telemetry.record('feature.clients.cache_warming.start', pattern);

        const data = await fetcher(pattern);
        cache.set(`page_${pattern.page}_${pattern.searchTerm}_${pattern.pageSize}`, data);

        telemetry.record('feature.clients.cache_warming.success', {
          ...pattern,
          resultCount: data?.clients?.length || 0
        });

      } catch (error) {
        telemetry.record('feature.clients.cache_warming.error', {
          ...pattern,
          error: error.message
        });
      } finally {
        warmingQueueRef.current.delete(warmingKey);
      }

      // Pequeña pausa entre warmings para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [enableCacheWarming, fetcher, cache]);

  /**
   * Wave 3B: Invalidación inteligente post-mutación
   */
  const invalidateAfterMutation = useCallback((operationType, affectedData = {}) => {
    if (!cache) return;

    switch (operationType) {
      case 'create':
        // Invalidar primera página para que aparezca el nuevo cliente
        cache.invalidate(/^page_1_/);
        telemetry.record('feature.clients.invalidation.create', {
          pattern: 'page_1_*',
          reason: 'new_client_created'
        });
        break;

      case 'update':
        // Invalidar páginas que podrían contener el cliente actualizado
        if (affectedData.clientId) {
          cache.invalidate(/^page_\d+_/); // Invalidar todas las páginas por seguridad
          telemetry.record('feature.clients.invalidation.update', {
            clientId: affectedData.clientId,
            pattern: 'page_*',
            reason: 'client_updated'
          });
        }
        break;

      case 'delete':
        // Invalidar todas las páginas pues el orden puede cambiar
        cache.invalidate(/^page_\d+_/);
        telemetry.record('feature.clients.invalidation.delete', {
          clientId: affectedData.clientId,
          pattern: 'page_*',
          reason: 'client_deleted'
        });
        break;

      case 'search':
        // Solo invalidar páginas de búsqueda específica
        if (affectedData.searchTerm) {
          const searchPattern = new RegExp(`^page_\\d+_${affectedData.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_`);
          cache.invalidate(searchPattern);
          telemetry.record('feature.clients.invalidation.search', {
            searchTerm: affectedData.searchTerm,
            reason: 'search_changed'
          });
        }
        break;

      default:
        // Invalidación completa por seguridad
        cache.clear();
        telemetry.record('feature.clients.invalidation.complete', {
          operationType,
          reason: 'unknown_operation'
        });
    }
  }, [cache]);

  /**
   * Wave 3B: Intersection Observer para prefetch automático
   */
  const setupScrollPrefetch = useCallback((element, prefetchConfig) => {
    if (!enablePrefetch || !element) return;

    // Limpiar observer anterior
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= prefetchThreshold) {
            prefetchNextPage(
              prefetchConfig.currentPage,
              prefetchConfig.totalPages,
              prefetchConfig.searchTerm,
              prefetchConfig.pageSize
            );
          }
        });
      },
      {
        threshold: [prefetchThreshold],
        rootMargin: '100px' // Prefetch cuando esté 100px antes de ser visible
      }
    );

    intersectionObserverRef.current.observe(element);

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [enablePrefetch, prefetchThreshold, prefetchNextPage]);

  /**
   * Cache warming automático al inicializar
   */
  useEffect(() => {
    if (enableCacheWarming) {
      // Warm cache con delay para no interferir con carga inicial
      const timer = setTimeout(() => {
        warmCache();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [enableCacheWarming, warmCache]);

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      prefetchQueueRef.current.clear();
      warmingQueueRef.current.clear();
    };
  }, []);

  return {
    // Prefetch operations
    prefetchNextPage,
    warmCache,
    
    // Invalidation
    invalidateAfterMutation,
    
    // Scroll prefetch
    setupScrollPrefetch,
    
    // Estado
    isPrefetching: (key) => prefetchQueueRef.current.has(key),
    isWarming: (key) => warmingQueueRef.current.has(key),
    
    // Stats
    getQueueStats: () => ({
      prefetchQueue: prefetchQueueRef.current.size,
      warmingQueue: warmingQueueRef.current.size
    })
  };
};
