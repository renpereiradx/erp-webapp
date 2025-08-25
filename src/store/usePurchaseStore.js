/**
 * Store de Zustand para gestión de estado de compras - Versión Production Hardened
 * Wave 1: Arquitectura Base Sólida + Wave 2: Resiliencia & Recovery
 * Implementa patrón establecido con helpers de resiliencia, cache, circuit breaker y offline
 * Añade recovery automático con backoff exponencial para operaciones críticas
 * Siguiendo estructura exitosa de Reservations/Products
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import purchaseService from '@/services/purchaseService';
import { telemetry } from '@/utils/telemetry';
import { classifyError, withRetry as baseWithRetry } from './helpers/reliability';
import { createCircuitHelpers } from './helpers/circuit';
import { lruTrim, invalidatePages as sharedInvalidatePages } from './helpers/cache';
import { createOfflineSnapshotHelpers } from './helpers/offline';
import { executeWithPurchaseRecovery } from '@/helpers/recovery';

/**
 * @typedef {Object} PurchaseOrder
 * @property {string|number} id
 * @property {number} supplier_id
 * @property {string} status PENDING|confirmed|completed|cancelled
 * @property {number} total_amount
 * @property {string} created_at ISO 8601
 * @property {string} user_id
 * @property {PurchaseItem[]} purchase_items
 * @property {string} [supplier_name] joined data
 * @property {Record<string,any>} [metadata]
 *
 * @typedef {Object} PurchaseItem
 * @property {string} product_id
 * @property {number} quantity
 * @property {number} unit_price
 * @property {number} [tax_rate_id]
 * @property {number} [profit_pct]
 * @property {string} [exp_date] ISO 8601
 *
 * @typedef {Object} PurchasePayment
 * @property {number} payment_id
 * @property {number} purchase_order_id
 * @property {number} amount_paid
 * @property {number} outstanding_amount
 * @property {number} total_paid_so_far
 * @property {number} total_order_amount
 * @property {string} payment_status partial|complete|overpaid
 * @property {boolean} order_fully_paid
 * @property {string} payment_reference
 * @property {string} processed_at ISO 8601
 * @property {string} processed_by
 *
 * @typedef {Object} Pagination
 * @property {number} current_page
 * @property {number} per_page
 * @property {number} total
 * @property {number} total_pages
 *
 * @typedef {Object} CircuitState
 * @property {number} openUntil
 * @property {number} failures
 * @property {number} threshold
 * @property {number} cooldownMs
 *
 * @typedef {Object} PageCacheEntry
 * @property {PurchaseOrder[]} purchases
 * @property {Pagination} pagination
 * @property {number} ts timestamp ms
 */

// Configuración del cache
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 30;

// Configuración del circuit breaker
const CIRCUIT_THRESHOLD = 4;
const CIRCUIT_COOLDOWN_MS = 30 * 1000; // 30 seconds

// Helper functions con telemetría
const withRetry = (action, context = 'purchase') => baseWithRetry(action, context);

const circuit = createCircuitHelpers('purchases', telemetry, {
  threshold: CIRCUIT_THRESHOLD,
  cooldownMs: CIRCUIT_COOLDOWN_MS
});

const offlineSnapshot = createOfflineSnapshotHelpers('purchases', 'purchase_orders');

/**
 * Invalidar páginas del cache específicas de purchases
 */
const invalidatePages = () => sharedInvalidatePages('purchase-pages');

/**
 * Hook de store Zustand para gestión de compras
 */
const usePurchaseStore = create(
  devtools(
    (set, get) => ({
      // ==================== ESTADO PRINCIPAL ====================
      
      // Lista de órdenes de compra
      purchaseOrders: [],
      
      // Orden de compra individual (para detalles)
      currentPurchase: null,
      
      // Paginación
      pagination: {
        current_page: 1,
        per_page: 20,
        total: 0,
        total_pages: 0
      },
      
      // Estados de carga
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isLoadingPayments: false,
      
      // Error handling
      error: null,
      errorType: null,
      
      // ==================== CACHE Y PERFORMANCE ====================
      
      // Cache de páginas con TTL
      pageCache: new Map(),
      
      // Cache individual de órdenes
      purchaseCache: new Map(),
      
      // Circuit breaker state
      circuit: {
        openUntil: 0,
        failures: 0,
        threshold: CIRCUIT_THRESHOLD,
        cooldownMs: CIRCUIT_COOLDOWN_MS
      },
      
      // Offline snapshot
      offlineData: {
        hasSnapshot: false,
        snapshotDate: null,
        purchases: []
      },
      
      // ==================== ACCIONES PRINCIPALES ====================
      
      /**
       * Cargar órdenes de compra con paginación - Wave 2: Recovery Automático
       */
      loadPurchases: async (page = 1, filters = {}) => {
        const { pageCache } = get();
        const cacheKey = `page-${page}-${JSON.stringify(filters)}`;
        
        // Verificar cache primero
        const cached = pageCache.get(cacheKey);
        if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
          telemetry.increment('purchase.purchases.cache_hit');
          set({
            purchaseOrders: cached.purchases,
            pagination: cached.pagination
          });
          return { success: true, fromCache: true };
        }
        
        set({ isLoading: true, error: null });
        telemetry.increment('purchase.purchases.load_start');
        
        try {
          // Wave 2: Recovery automático integrado
          const result = await executeWithPurchaseRecovery(
            async () => {
              return await circuit.execute(async () => {
                return await withRetry(async () => {
                  return await purchaseService.getPurchasesPaginated(page, 20, filters);
                });
              });
            },
            {
              operationType: 'load_purchases',
              telemetry: telemetry.track || telemetry.increment,
              context: { page, filters: Object.keys(filters) },
              onRetry: (error, retryContext) => {
                console.warn(`🔄 Retrying loadPurchases (attempt ${retryContext.attempt}):`, error.message);
                // Mantener loading state durante retries
                set({ isLoading: true, error: null });
              },
              onError: (error, errorContext) => {
                console.error(`❌ LoadPurchases error (attempt ${errorContext.attempt}):`, error.message);
                // Actualizar estado de error temporalmente
                if (!errorContext.retryInfo.retryable) {
                  set({ isLoading: false, error: error.message });
                }
              }
            }
          );
          
          if (result.success) {
            const { purchases, pagination } = result.data;
            
            // Normalizar datos
            const normalizedPurchases = Array.isArray(purchases) ? purchases : [];
            
            // Actualizar cache
            pageCache.set(cacheKey, {
              purchases: normalizedPurchases,
              pagination,
              ts: Date.now()
            });
            
            // Trim cache si es necesario
            lruTrim(pageCache, CACHE_MAX_SIZE, (key, entry) => {
              telemetry.increment('purchase.purchases.cache_evicted');
            });
            
            set({
              purchaseOrders: normalizedPurchases,
              pagination,
              isLoading: false,
              error: null
            });
            
            telemetry.increment('purchase.purchases.load_success');
            telemetry.timing('purchase.purchases.load_duration', Date.now());
            
            return { success: true, data: normalizedPurchases };
          } else {
            throw new Error(result.error || 'Error al cargar órdenes de compra');
          }
          
        } catch (error) {
          const { type, message, isRetryable } = classifyError(error);
          
          set({
            isLoading: false,
            error: message,
            errorType: type
          });
          
          telemetry.increment('purchase.purchases.load_error', {
            error_type: type,
            retryable: isRetryable
          });
          
          return { success: false, error: message };
        }
      },
      
      /**
       * Crear nueva orden de compra mejorada - Wave 2: Recovery Automático
       */
      createPurchase: async (purchaseData) => {
        set({ isCreating: true, error: null });
        telemetry.increment('purchase.purchases.create_start');
        
        try {
          // Wave 2: Recovery automático para operaciones críticas
          const result = await executeWithPurchaseRecovery(
            async () => {
              return await circuit.execute(async () => {
                return await withRetry(async () => {
                  // Validar estructura de datos antes del envío
                  const validatedData = {
                    supplier_id: Number(purchaseData.supplier_id),
                    status: purchaseData.status || 'pending',
                    product_details: Array.isArray(purchaseData.product_details) 
                      ? purchaseData.product_details 
                      : [],
                    payment_method_id: purchaseData.payment_method_id || 1,
                    currency_id: purchaseData.currency_id || 1,
                    metadata: purchaseData.metadata || {}
                  };
                  
                  return await purchaseService.createPurchase(validatedData);
                });
              });
            },
            {
              operationType: 'create_purchase',
              telemetry: telemetry.track || telemetry.increment,
              context: { 
                supplier_id: purchaseData.supplier_id,
                items_count: purchaseData.product_details?.length || 0
              },
              customMaxRetries: 3, // Más conservador para creación
              onRetry: (error, retryContext) => {
                console.warn(`🔄 Retrying createPurchase (attempt ${retryContext.attempt}):`, error.message);
                // Mantener estado de creación durante retries
                set({ isCreating: true, error: null });
              },
              onError: (error, errorContext) => {
                console.error(`❌ CreatePurchase error (attempt ${errorContext.attempt}):`, error.message);
                // Solo actualizar estado si no es recuperable
                if (!errorContext.retryInfo.retryable) {
                  set({ isCreating: false, error: error.message });
                }
              }
            }
          );
          
          if (result.success) {
            set({ isCreating: false });
            
            // Invalidar cache de páginas
            invalidatePages();
            
            telemetry.increment('purchase.purchases.create_success');
            telemetry.increment('purchase.purchases.total_created');
            
            return { 
              success: true, 
              purchaseOrderId: result.purchase_order_id,
              totalAmount: result.total_amount,
              data: result // Wave 2: Retornar data completa
            };
          } else {
            throw new Error(result.error || 'Error al crear orden de compra');
          }
          
        } catch (error) {
          const { type, message, isRetryable } = classifyError(error);
          
          set({
            isCreating: false,
            error: message,
            errorType: type
          });
          
          telemetry.increment('purchase.purchases.create_error', {
            error_type: type,
            retryable: isRetryable
          });
          
          return { success: false, error: message };
        }
      },
      
      /**
       * Cargar orden de compra individual
       */
      loadPurchaseById: async (id) => {
        const { purchaseCache } = get();
        
        // Verificar cache individual
        const cached = purchaseCache.get(id);
        if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
          telemetry.increment('purchase.purchases.detail_cache_hit');
          set({ currentPurchase: cached.purchase });
          return { success: true, fromCache: true };
        }
        
        set({ isLoading: true, error: null });
        telemetry.increment('purchase.purchases.detail_load_start');
        
        try {
          const result = await circuit.execute(async () => {
            return await withRetry(async () => {
              return await purchaseService.getPurchaseById(id);
            });
          });
          
          if (result.success && result.data) {
            // Actualizar cache individual
            purchaseCache.set(id, {
              purchase: result.data,
              ts: Date.now()
            });
            
            set({
              currentPurchase: result.data,
              isLoading: false,
              error: null
            });
            
            telemetry.increment('purchase.purchases.detail_load_success');
            
            return { success: true, data: result.data };
          } else {
            throw new Error(result.error || 'Orden de compra no encontrada');
          }
          
        } catch (error) {
          const { type, message, isRetryable } = classifyError(error);
          
          set({
            isLoading: false,
            error: message,
            errorType: type
          });
          
          telemetry.increment('purchase.purchases.detail_load_error', {
            error_type: type,
            retryable: isRetryable
          });
          
          return { success: false, error: message };
        }
      },
      
      /**
       * Cancelar orden de compra
       */
      cancelPurchase: async (id, reason = '') => {
        set({ isUpdating: true, error: null });
        telemetry.increment('purchase.purchases.cancel_start');
        
        try {
          const result = await circuit.execute(async () => {
            return await withRetry(async () => {
              return await purchaseService.cancelPurchase(id, reason);
            });
          });
          
          if (result.success) {
            set({ isUpdating: false });
            
            // Invalidar caches
            invalidatePages();
            get().purchaseCache.delete(id);
            
            telemetry.increment('purchase.purchases.cancel_success');
            
            return { success: true };
          } else {
            throw new Error(result.error || 'Error al cancelar orden de compra');
          }
          
        } catch (error) {
          const { type, message, isRetryable } = classifyError(error);
          
          set({
            isUpdating: false,
            error: message,
            errorType: type
          });
          
          telemetry.increment('purchase.purchases.cancel_error', {
            error_type: type,
            retryable: isRetryable
          });
          
          return { success: false, error: message };
        }
      },
      
      // ==================== GESTIÓN DE CACHE ====================
      
      /**
       * Limpiar toda la cache
       */
      clearCache: () => {
        const { pageCache, purchaseCache } = get();
        pageCache.clear();
        purchaseCache.clear();
        telemetry.increment('purchase.purchases.cache_cleared');
      },
      
      /**
       * Invalidar cache y recargar datos
       */
      invalidateAndReload: async (page = 1, filters = {}) => {
        get().clearCache();
        return await get().loadPurchases(page, filters);
      },
      
      // ==================== GESTIÓN DE ERRORES ====================
      
      /**
       * Limpiar error actual
       */
      clearError: () => {
        set({ error: null, errorType: null });
      },
      
      /**
       * Reset manual del circuit breaker
       */
      resetCircuitBreaker: () => {
        set({
          circuit: {
            openUntil: 0,
            failures: 0,
            threshold: CIRCUIT_THRESHOLD,
            cooldownMs: CIRCUIT_COOLDOWN_MS
          }
        });
        telemetry.increment('purchase.purchases.circuit_reset_manual');
      },
      
      // ==================== OFFLINE SUPPORT ====================
      
      /**
       * Crear snapshot para modo offline
       */
      createOfflineSnapshot: async () => {
        const { purchaseOrders } = get();
        
        if (purchaseOrders.length > 0) {
          await offlineSnapshot.persist({
            purchases: purchaseOrders,
            snapshotDate: new Date().toISOString(),
            hasSnapshot: true
          });
          
          set({
            offlineData: {
              hasSnapshot: true,
              snapshotDate: new Date().toISOString(),
              purchases: purchaseOrders
            }
          });
          
          telemetry.increment('purchase.purchases.offline_snapshot_created');
        }
      },
      
      /**
       * Cargar desde snapshot offline
       */
      loadFromOfflineSnapshot: async () => {
        const snapshot = await offlineSnapshot.retrieve();
        
        if (snapshot && snapshot.purchases) {
          set({
            purchaseOrders: snapshot.purchases,
            offlineData: {
              hasSnapshot: true,
              snapshotDate: snapshot.snapshotDate,
              purchases: snapshot.purchases
            }
          });
          
          telemetry.increment('purchase.purchases.offline_snapshot_loaded');
          return { success: true, data: snapshot.purchases };
        }
        
        return { success: false, error: 'No offline snapshot available' };
      },
      
      // ==================== GETTERS DERIVADOS ====================
      
      /**
       * Obtener estadísticas derivadas
       */
      getMetrics: () => {
        const { purchaseOrders, pageCache, purchaseCache, circuit } = get();
        
        return {
          totalOrders: purchaseOrders.length,
          pendingOrders: purchaseOrders.filter(p => p.status === 'pending').length,
          confirmedOrders: purchaseOrders.filter(p => p.status === 'confirmed').length,
          completedOrders: purchaseOrders.filter(p => p.status === 'completed').length,
          cancelledOrders: purchaseOrders.filter(p => p.status === 'cancelled').length,
          cacheSize: pageCache.size + purchaseCache.size,
          circuitState: circuit.openUntil > Date.now() ? 'open' : 'closed',
          circuitFailures: circuit.failures
        };
      },
      
      /**
       * Verificar si hay datos stale en cache
       */
      hasStaleData: () => {
        const { pageCache } = get();
        const now = Date.now();
        const staleThreshold = CACHE_TTL_MS / 2; // 50% del TTL
        
        for (const [key, entry] of pageCache.entries()) {
          if ((now - entry.ts) > staleThreshold) {
            return true;
          }
        }
        return false;
      }
    }),
    {
      name: 'purchase-store',
      version: 1
    }
  )
);

export default usePurchaseStore;
