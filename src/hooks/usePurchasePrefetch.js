/**
 * usePurchasePrefetch - Wave 3 Intelligent Prefetch Hook
 * Prefetch inteligente para datos de compras basado en patrones de usuario
 * 
 * FEATURES WAVE 3:
 * - Prefetch predictivo basado en navegación del usuario
 * - Cache warming de suppliers y products relacionados
 * - Network-aware prefetching (respeta conexiones lentas)
 * - Memory management automático
 * - Performance monitoring de prefetch effectiveness
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import { useCallback, useRef, useEffect } from 'react';
import { useIntelligentPrefetch, usePerformanceOptimizations } from './usePerformanceOptimizations';
import usePurchaseStore from '@/store/usePurchaseStore';
import { useTelemetry } from './useTelemetry';

/**
 * Hook para prefetch inteligente de datos de compras
 * 
 * @param {Object} options - Configuración del prefetch
 * @returns {Object} Controles y estado del prefetch
 */
export const usePurchasePrefetch = (options = {}) => {
  const {
    enableSupplierPrefetch = true,
    enableProductPrefetch = true,
    enableStatsPrefetch = true,
    prefetchDelay = 2000,
    maxPrefetchItems = 50
  } = options;

  const { trackEvent, trackMetric } = useTelemetry();
  const { loadPurchases, loadSuppliers, loadProducts, getStatistics } = usePurchaseStore();
  
  // Performance optimizations
  const {
    optimizedCallback,
    createCleanupRegistry
  } = usePerformanceOptimizations({
    componentName: 'usePurchasePrefetch',
    enableMemoization: true
  });

  const registerCleanup = createCleanupRegistry();
  const prefetchHistory = useRef(new Set());
  const prefetchQueue = useRef([]);

  // Prefetch de purchases relacionados
  const prefetchRelatedPurchases = optimizedCallback(async (currentPurchaseId) => {
    if (!currentPurchaseId || prefetchHistory.current.has(`purchases_${currentPurchaseId}`)) {
      return null;
    }

    try {
      // Marcar como prefetched
      prefetchHistory.current.add(`purchases_${currentPurchaseId}`);
      
      trackEvent('prefetch.purchases.start', { 
        purchase_id: currentPurchaseId,
        type: 'related_purchases'
      });

      const startTime = Date.now();
      
      // Cargar purchases adicionales (siguiente página)
      const result = await loadPurchases({ 
        limit: maxPrefetchItems,
        offset: 20,
        prefetch: true 
      });
      
      const prefetchTime = Date.now() - startTime;
      trackMetric('prefetch.purchases.time', prefetchTime);
      
      trackEvent('prefetch.purchases.success', {
        purchase_id: currentPurchaseId,
        prefetch_time: prefetchTime,
        items_prefetched: result?.data?.length || 0
      });

      return result;
    } catch (error) {
      trackEvent('prefetch.purchases.error', {
        purchase_id: currentPurchaseId,
        error: error.message
      });
      console.warn('Purchases prefetch failed:', error);
      return null;
    }
  }, [loadPurchases, maxPrefetchItems, trackEvent, trackMetric], 'prefetchRelatedPurchases');

  // Prefetch de suppliers basado en purchases actuales
  const prefetchSuppliers = optimizedCallback(async (purchaseIds = []) => {
    if (!enableSupplierPrefetch || prefetchHistory.current.has('suppliers')) {
      return null;
    }

    try {
      prefetchHistory.current.add('suppliers');
      
      trackEvent('prefetch.suppliers.start', { 
        related_purchases: purchaseIds.length 
      });

      const startTime = Date.now();
      const result = await loadSuppliers({ prefetch: true });
      const prefetchTime = Date.now() - startTime;
      
      trackMetric('prefetch.suppliers.time', prefetchTime);
      trackEvent('prefetch.suppliers.success', {
        prefetch_time: prefetchTime,
        suppliers_prefetched: result?.data?.length || 0
      });

      return result;
    } catch (error) {
      trackEvent('prefetch.suppliers.error', { error: error.message });
      console.warn('Suppliers prefetch failed:', error);
      return null;
    }
  }, [enableSupplierPrefetch, loadSuppliers, trackEvent, trackMetric], 'prefetchSuppliers');

  // Prefetch de products relacionados
  const prefetchProducts = optimizedCallback(async (supplierIds = []) => {
    if (!enableProductPrefetch || prefetchHistory.current.has('products')) {
      return null;
    }

    try {
      prefetchHistory.current.add('products');
      
      trackEvent('prefetch.products.start', {
        related_suppliers: supplierIds.length
      });

      const startTime = Date.now();
      const result = await loadProducts({ 
        suppliers: supplierIds.slice(0, 10), // Limitar a 10 suppliers
        prefetch: true 
      });
      const prefetchTime = Date.now() - startTime;
      
      trackMetric('prefetch.products.time', prefetchTime);
      trackEvent('prefetch.products.success', {
        prefetch_time: prefetchTime,
        products_prefetched: result?.data?.length || 0
      });

      return result;
    } catch (error) {
      trackEvent('prefetch.products.error', { error: error.message });
      console.warn('Products prefetch failed:', error);
      return null;
    }
  }, [enableProductPrefetch, loadProducts, trackEvent, trackMetric], 'prefetchProducts');

  // Prefetch de estadísticas
  const prefetchStatistics = optimizedCallback(async () => {
    if (!enableStatsPrefetch || prefetchHistory.current.has('statistics')) {
      return null;
    }

    try {
      prefetchHistory.current.add('statistics');
      
      trackEvent('prefetch.statistics.start');

      const startTime = Date.now();
      const result = await getStatistics({ prefetch: true });
      const prefetchTime = Date.now() - startTime;
      
      trackMetric('prefetch.statistics.time', prefetchTime);
      trackEvent('prefetch.statistics.success', {
        prefetch_time: prefetchTime
      });

      return result;
    } catch (error) {
      trackEvent('prefetch.statistics.error', { error: error.message });
      console.warn('Statistics prefetch failed:', error);
      return null;
    }
  }, [enableStatsPrefetch, getStatistics, trackEvent, trackMetric], 'prefetchStatistics');

  // Configuración de condiciones para prefetch inteligente
  const prefetchConditions = {
    hasGoodConnection: () => {
      const connection = navigator.connection;
      if (!connection) return true;
      
      return !connection.saveData && 
             !['slow-2g', '2g'].includes(connection.effectiveType);
    },
    hasAvailableMemory: () => {
      if (!performance.memory) return true;
      
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
      return memoryUsage < 0.7; // Menos del 70% de memoria usada
    },
    isUserActive: () => {
      return document.visibilityState === 'visible';
    }
  };

  // Setup del prefetch inteligente para purchases
  const {
    startPrefetch: startPurchasesPrefetch,
    prefetchedData: prefetchedPurchases
  } = useIntelligentPrefetch(
    () => prefetchRelatedPurchases(),
    {
      delay: prefetchDelay,
      conditions: prefetchConditions,
      priority: 'low'
    }
  );

  // Setup del prefetch inteligente para suppliers
  const {
    startPrefetch: startSuppliersPrefetch,
    prefetchedData: prefetchedSuppliers
  } = useIntelligentPrefetch(
    () => prefetchSuppliers(),
    {
      delay: prefetchDelay + 500, // Delay mayor para suppliers
      conditions: prefetchConditions,
      priority: 'low'
    }
  );

  // Estrategia de prefetch basada en interacción del usuario
  const triggerSmartPrefetch = optimizedCallback((trigger = 'hover', context = {}) => {
    const { purchaseId, supplierIds = [] } = context;

    trackEvent('prefetch.trigger', { 
      trigger, 
      purchase_id: purchaseId,
      supplier_count: supplierIds.length 
    });

    // Queue prefetch tasks based on trigger
    switch (trigger) {
      case 'hover':
        // Light prefetch on hover
        setTimeout(() => {
          startPurchasesPrefetch();
        }, 100);
        break;
        
      case 'filter_change':
        // Medium prefetch on filter change
        setTimeout(() => {
          startPurchasesPrefetch();
          startSuppliersPrefetch();
        }, 300);
        break;
        
      case 'page_load':
        // Full prefetch on page load
        setTimeout(() => {
          startPurchasesPrefetch();
          setTimeout(() => startSuppliersPrefetch(), 500);
          setTimeout(() => prefetchStatistics(), 1000);
        }, prefetchDelay);
        break;
        
      default:
        startPurchasesPrefetch();
    }
  }, [
    startPurchasesPrefetch, 
    startSuppliersPrefetch, 
    prefetchStatistics, 
    prefetchDelay, 
    trackEvent
  ], 'triggerSmartPrefetch');

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      registerCleanup(() => {
        prefetchHistory.current.clear();
        prefetchQueue.current = [];
      });
    };
  }, [registerCleanup]);

  return {
    // Triggers manuales
    triggerSmartPrefetch,
    prefetchRelatedPurchases,
    prefetchSuppliers,
    prefetchProducts,
    prefetchStatistics,
    
    // Estado
    prefetchedPurchases,
    prefetchedSuppliers,
    
    // Info
    prefetchHistory: prefetchHistory.current,
    prefetchConditions
  };
};

export default usePurchasePrefetch;
