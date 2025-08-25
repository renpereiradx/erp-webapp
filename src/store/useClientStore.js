/**
 * @fileoverview Store hardened para gestión de clientes con enterprise features
 * Seguimiento Wave 1: Arquitectura Base Sólida → Wave 2: Resiliencia & Confiabilidad
 * 
 * Features implementados:
 * - Circuit breaker con threshold configurable
 * - Cache TTL con LRU eviction
 * - Offline snapshots con hidratación
 * - Retry logic con backoff exponencial
 * - Telemetría completa
 * - Normalización defensiva
 * - Error classification
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '@/services/clientService';
import { telemetry } from '@/utils/telemetry';

// Helpers enterprise
import { createCircuitHelpers } from './helpers/circuit';
import { createOfflineSnapshotHelpers } from './helpers/offline';
import { withRetry, withTimeoutAndRetry, classifyError } from './helpers/reliability';
import { lruTrim, invalidatePages } from './helpers/cache';

// Tipos y constantes
import { 
  CLIENT_CACHE_CONFIG, 
  CLIENT_CIRCUIT_CONFIG,
  CLIENT_PAGINATION_DEFAULTS 
} from '@/types/clientTypes';
import { 
  CLIENT_API_ERRORS,
  CLIENT_CACHE_ERRORS,
  getClientErrorMessage 
} from '@/constants/clientErrors';

/**
 * Configuración del store
 */
const STORE_CONFIG = {
  // Cache configuration
  pageCacheTTL: CLIENT_CACHE_CONFIG.TTL,
  maxCacheEntries: CLIENT_CACHE_CONFIG.MAX_ENTRIES,
  staleThreshold: CLIENT_CACHE_CONFIG.STALE_THRESHOLD,
  
  // Circuit breaker configuration
  circuitConfig: CLIENT_CIRCUIT_CONFIG,
  
  // Retry configuration
  retryConfig: {
    retries: 3,
    baseDelay: 200,
  },
  
  // Prefetch configuration
  prefetchEnabled: true,
  prefetchThreshold: CLIENT_CACHE_CONFIG.PREFETCH_THRESHOLD
};

const useClientStore = create(
  devtools(
    (set, get) => {
      // Initialize helpers
      const circuit = createCircuitHelpers('clients', telemetry);
      const offline = createOfflineSnapshotHelpers('clients_last_offline_snapshot', 'clients', telemetry);
      
      // Helper para telemetría específica de clientes
      const record = (event, payload = {}) => {
        try {
          telemetry.record(`feature.clients.${event}`, payload);
        } catch (error) {
          console.warn('Telemetry error:', error);
        }
      };

      // Helper para normalizar datos de cliente
      const normalizeClientData = (clients) => {
        if (!Array.isArray(clients)) return [];
        return clients.filter(client => client && typeof client === 'object' && client.id);
      };

      // Helper para generar claves de cache
      const getCacheKey = (search = '', page = 1) => `${search || '__'}|${page}`;

      // Helper para verificar si cache entry está stale
      const isStale = (entry, ttl = STORE_CONFIG.pageCacheTTL) => {
        if (!entry || !entry.ts) return true;
        const age = Date.now() - entry.ts;
        return age > (ttl * STORE_CONFIG.staleThreshold);
      };

        // Helper para ejecutar con circuit breaker + timeout management mejorado
        const withCircuit = async (operation, operationName, timeoutMs = 30000) => {
          if (circuit.isOpen(get, set)) {
            record('circuit.blocked', { operation: operationName });
            throw new Error(getClientErrorMessage(CLIENT_API_ERRORS.SERVICE_UNAVAILABLE));
          }

          try {
            const result = await withTimeoutAndRetry(operation, timeoutMs, {
              ...STORE_CONFIG.retryConfig,
              op: operationName,
              telemetryRecord: record,
              onRetry: (attempt, error, delay, classification) => {
                record('retry.detailed', { 
                  attempt, 
                  operation: operationName, 
                  error: error.message,
                  classification,
                  delay,
                  timeoutMs
                });
              }
            });
            
            circuit.recordSuccess(get, set);
            record('circuit.success', { operation: operationName });
            return result;
          } catch (error) {
            circuit.recordFailure(get, set);
            
            // Clasificar y registrar error con detalles
            const errorType = classifyError(error.message);
            record('error.detailed', { 
              operation: operationName, 
              type: errorType.type, 
              category: errorType.category,
              severity: errorType.severity,
              retryable: errorType.retryable,
              action: errorType.action,
              message: error.message,
              timeoutMs
            });

            // Incrementar contador de errores por tipo
            const state = get();
            const newErrorCounters = { ...state.errorCounters };
            const errorKey = `${errorType.type}_${errorType.category}`;
            newErrorCounters[errorKey] = (newErrorCounters[errorKey] || 0) + 1;
            set({ errorCounters: newErrorCounters });

            // Activar modo offline si es error de red con datos disponibles
            if (errorType.type === 'NETWORK' && !state.isOffline && state.clients.length > 0) {
              offline.persist(state.clients);
              set({ isOffline: true, lastOfflineSnapshot: Date.now() });
              record('offline.activated', { 
                snapshotCount: state.clients.length,
                trigger: errorType.category,
                operation: operationName
              });
            }

            throw error;
          }
        };      return {
        // Estado base mejorado
        clients: [],
        loading: false,
        error: null,
        lastSearchTerm: '',
        currentPage: 1,
        totalPages: 1,
        totalClients: 0,
        pageSize: CLIENT_PAGINATION_DEFAULTS.PAGE_SIZE,

        // Estado de cache
        pageCache: {},
        cacheHits: 0,
        cacheMisses: 0,
        lastCacheCleanup: Date.now(),

        // Estado del circuit breaker
        ...circuit.init(STORE_CONFIG.circuitConfig),

        // Estado offline
        isOffline: false,
        lastOfflineSnapshot: null,

        // Métricas y debugging
        errorCounters: {},
        lastOperation: null,
        lastQuery: { page: 1, pageSize: CLIENT_PAGINATION_DEFAULTS.PAGE_SIZE, search: '' },

        /**
         * Acciones CRUD hardened
         */

        // Limpiar errores
        clearError: () => set({ error: null }),

        // Limpiar la lista de clientes
        clearClients: () => {
          set({ 
            clients: [], 
            totalClients: 0, 
            currentPage: 1, 
            totalPages: 1, 
            lastSearchTerm: '',
            pageCache: {},
            error: null
          });
          record('clear');
        },

        // Cambiar tamaño de página
        changePageSize: async (newPageSize) => {
          const validSize = Math.min(
            CLIENT_PAGINATION_DEFAULTS.MAX_PAGE_SIZE,
            Math.max(CLIENT_PAGINATION_DEFAULTS.MIN_PAGE_SIZE, newPageSize)
          );
          
          const { lastSearchTerm } = get();
          set({ pageSize: validSize, currentPage: 1, pageCache: {} }); // Limpiar cache al cambiar tamaño
          
          await get().searchClients(lastSearchTerm, 1, validSize);
          record('page_size_changed', { newSize: validSize });
        },

        // Cargar página específica con cache
        loadPage: async (page, pageSize = CLIENT_PAGINATION_DEFAULTS.PAGE_SIZE, search = '') => {
          const cacheKey = getCacheKey(search, page);
          const state = get();
          
          // Verificar cache hit
          const cached = state.pageCache[cacheKey];
          if (cached && !isStale(cached)) {
            set({ 
              clients: normalizeClientData(cached.clients),
              currentPage: cached.pagination?.current_page || page,
              totalPages: cached.pagination?.total_pages || 1,
              totalClients: cached.pagination?.total || 0,
              lastSearchTerm: search,
              cacheHits: state.cacheHits + 1,
              lastQuery: { page, pageSize, search }
            });
            
            record('cache.hit', { cacheKey, page, search });

            // Background revalidation si está stale pero aún válido
            if (isStale(cached, STORE_CONFIG.pageCacheTTL * 0.5)) {
              record('cache.stale_detected', { cacheKey, age: Date.now() - cached.ts });
              // Revalidar en background sin bloquear UI
              setTimeout(() => get().fetchClients(page, pageSize, search, true), 0);
            }

            // Prefetch siguiente página si está habilitado
            if (STORE_CONFIG.prefetchEnabled && cached.pagination?.has_next) {
              setTimeout(() => get().prefetchNextPage(search, page + 1, pageSize), 100);
            }

            return cached;
          }

          // Cache miss - fetch from API
          set({ cacheMisses: state.cacheMisses + 1 });
          record('cache.miss', { cacheKey, page, search });
          
          return await get().fetchClients(page, pageSize, search);
        },

        // Buscar clientes con cache inteligente
        searchClients: async (search = '', page = 1, pageSize = CLIENT_PAGINATION_DEFAULTS.PAGE_SIZE) => {
          const cleanSearch = (search || '').trim();
          set({ lastSearchTerm: cleanSearch, lastOperation: 'search' });
          
          return await get().loadPage(page, pageSize, cleanSearch);
        },

        // Fetch principal de clientes con timeout específico
        fetchClients: async (page = 1, pageSize = CLIENT_PAGINATION_DEFAULTS.PAGE_SIZE, search = '', isBackgroundRevalidation = false) => {
          const operationId = `fetchClients_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          if (!isBackgroundRevalidation) {
            set({ loading: true, error: null, lastOperation: 'fetchClients' });
          }

          record('fetch.start', { 
            page, 
            pageSize, 
            search, 
            isBackgroundRevalidation,
            operationId
          });

          try {
            const result = await withCircuit(async () => {
              const params = {
                page,
                per_page: pageSize,
                search: search || undefined
              };
              
              return await clientService.getClients(params);
            }, 'fetchClients', 30000); // 30s timeout for fetch operations

            // Normalizar respuesta
            const clientsData = Array.isArray(result) ? result : result.data || [];
            const paginationInfo = result.pagination || null;

            const normalizedClients = normalizeClientData(clientsData);

            // Actualizar cache
            const cacheKey = getCacheKey(search, page);
            const cacheEntry = {
              clients: normalizedClients,
              pagination: paginationInfo,
              ts: Date.now(),
              operationId
            };

            const state = get();
            const newPageCache = { ...state.pageCache, [cacheKey]: cacheEntry };

            // LRU trim si excede límite
            const { cache: trimmedCache, removed } = lruTrim(newPageCache, STORE_CONFIG.maxCacheEntries);
            if (removed.length > 0) {
              record('cache.evicted', { count: removed.length, keys: removed, operationId });
            }

            // Actualizar estado
            const updateData = {
              clients: normalizedClients,
              currentPage: paginationInfo?.current_page || page,
              totalPages: paginationInfo?.total_pages || 1,
              totalClients: paginationInfo?.total || normalizedClients.length,
              pageCache: trimmedCache,
              lastQuery: { page, pageSize, search, timestamp: Date.now(), operationId },
              isOffline: false, // Éxito API = no offline
              loading: false
            };

            set(updateData);

            record('fetch.success', { 
              count: normalizedClients.length, 
              page, 
              total: updateData.totalClients,
              isBackgroundRevalidation,
              operationId,
              duration: Date.now() - parseInt(operationId.split('_')[1])
            });

            return result;

          } catch (error) {
            if (!isBackgroundRevalidation) {
              set({ 
                error: error.message, 
                loading: false,
                lastOperation: 'fetchClients'
              });
            }

            record('fetch.error', { 
              page, 
              search, 
              error: error.message,
              isBackgroundRevalidation,
              operationId,
              duration: Date.now() - parseInt(operationId.split('_')[1])
            });

            throw error;
          }
        },

        // Prefetch página siguiente
        prefetchNextPage: async (search = '', page = 2, pageSize = CLIENT_PAGINATION_DEFAULTS.PAGE_SIZE) => {
          const cacheKey = getCacheKey(search, page);
          const state = get();

          // Skip si ya está en cache
          if (state.pageCache[cacheKey]) {
            record('prefetch.skip', { reason: 'cached', page });
            return;
          }

          // Skip si hay pocos elementos para justificar prefetch
          if (state.totalClients < STORE_CONFIG.prefetchThreshold) {
            record('prefetch.skip', { reason: 'insufficient_data', totalClients: state.totalClients });
            return;
          }

          try {
            await get().fetchClients(page, pageSize, search, true);
            record('prefetch.success', { page, search });
          } catch (error) {
            record('prefetch.failed', { page, search, error: error.message });
          }
        },

        // Crear cliente con timeout específico
        createClient: async (clientData) => {
          const operationId = `createClient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          set({ loading: true, error: null, lastOperation: 'createClient' });
          
          record('create.start', { 
            clientData: { name: clientData.name, email: clientData.email }, 
            operationId 
          });
          
          try {
            const newClient = await withCircuit(async () => {
              return await clientService.createClient(clientData);
            }, 'createClient', 20000); // 20s timeout for create operations

            // Invalidar cache de páginas relevantes
            const state = get();
            const { removed } = invalidatePages(state.pageCache, { 
              search: state.lastSearchTerm, 
              page: state.currentPage, 
              radius: 1 
            });
            
            if (removed.length > 0) {
              record('cache.invalidated', { reason: 'create', pages: removed, operationId });
            }

            set({ loading: false });
            record('create.success', { 
              id: newClient.id, 
              name: newClient.name, 
              operationId,
              duration: Date.now() - parseInt(operationId.split('_')[1])
            });

            // Refrescar datos actuales
            await get().searchClients(state.lastSearchTerm, state.currentPage, state.pageSize);

            return newClient;

          } catch (error) {
            set({ error: error.message, loading: false });
            record('create.error', { 
              error: error.message, 
              operationId,
              duration: Date.now() - parseInt(operationId.split('_')[1])
            });
            throw error;
          }
        },

        // Actualizar cliente con timeout específico
        updateClient: async (id, clientData) => {
          const operationId = `updateClient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          set({ loading: true, error: null, lastOperation: 'updateClient' });
          
          record('update.start', { 
            id, 
            clientData: { name: clientData.name, email: clientData.email }, 
            operationId 
          });
          
          try {
            const updatedClient = await withCircuit(async () => {
              return await clientService.updateClient(id, clientData);
            }, 'updateClient', 20000); // 20s timeout for update operations

            // Invalidar cache
            const state = get();
            const { removed } = invalidatePages(state.pageCache, { 
              search: state.lastSearchTerm, 
              page: state.currentPage, 
              radius: 2 
            });

            if (removed.length > 0) {
              record('cache.invalidated', { reason: 'update', pages: removed, operationId });
            }

            set({ loading: false });
            record('update.success', { 
              id, 
              name: updatedClient.name, 
              operationId,
              duration: Date.now() - parseInt(operationId.split('_')[1])
            });

            // Refrescar datos actuales
            await get().searchClients(state.lastSearchTerm, state.currentPage, state.pageSize);

            return updatedClient;

          } catch (error) {
            set({ error: error.message, loading: false });
            record('update.error', { 
              id, 
              error: error.message, 
              operationId,
              duration: Date.now() - parseInt(operationId.split('_')[1])
            });
            throw error;
          }
        },

        // Eliminar cliente con timeout específico
        deleteClient: async (id) => {
          const operationId = `deleteClient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          set({ loading: true, error: null, lastOperation: 'deleteClient' });
          
          record('delete.start', { id, operationId });
          
          try {
            await withCircuit(async () => {
              return await clientService.deleteClient(id);
            }, 'deleteClient', 15000); // 15s timeout for delete operations

            // Invalidar cache completamente para eliminaciones
            set({ pageCache: {}, loading: false });
            record('cache.cleared', { reason: 'delete', operationId });
            record('delete.success', { 
              id, 
              operationId,
              duration: Date.now() - parseInt(operationId.split('_')[1])
            });

            // Refrescar datos actuales
            await get().searchClients(get().lastSearchTerm, get().currentPage, get().pageSize);

          } catch (error) {
            set({ error: error.message, loading: false });
            record('delete.error', { 
              id, 
              error: error.message, 
              operationId,
              duration: Date.now() - parseInt(operationId.split('_')[1])
            });
            throw error;
          }
        },

        /**
         * Funciones de utilidad y mantenimiento Wave 2
         */

        // Validación exhaustiva de cliente
        validateClientData: (clientData) => {
          const errors = [];
          const warnings = [];

          // Validaciones obligatorias
          if (!clientData.name || !clientData.name.trim()) {
            errors.push('El nombre es obligatorio');
          } else if (clientData.name.length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
          } else if (clientData.name.length > 100) {
            errors.push('El nombre no puede exceder 100 caracteres');
          }

          if (!clientData.email || !clientData.email.trim()) {
            errors.push('El email es obligatorio');
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(clientData.email)) {
              errors.push('El formato del email no es válido');
            } else if (clientData.email.length > 255) {
              errors.push('El email no puede exceder 255 caracteres');
            }
          }

          // Validaciones opcionales con warnings
          if (clientData.phone && clientData.phone.trim()) {
            const phoneRegex = /^[\+]?[0-9\-\(\)\s]{7,20}$/;
            if (!phoneRegex.test(clientData.phone)) {
              warnings.push('El formato del teléfono podría no ser válido');
            }
          }

          if (clientData.address && clientData.address.length > 500) {
            warnings.push('La dirección es muy larga (máximo recomendado: 500 caracteres)');
          }

          const validation = {
            isValid: errors.length === 0,
            errors,
            warnings,
            summary: errors.length === 0 ? 'Válido' : `${errors.length} errores encontrados`
          };

          record('validation.performed', {
            isValid: validation.isValid,
            errorCount: errors.length,
            warningCount: warnings.length,
            fields: Object.keys(clientData)
          });

          return validation;
        },

        // Modo degradado para funcionar sin conexión
        enableGracefulMode: () => {
          const state = get();
          
          // Intentar hidratar desde snapshot offline
          const hydrated = get().hydrateFromStorage();
          
          if (hydrated) {
            set({ 
              isOffline: true, 
              error: null,
              loading: false 
            });
            record('graceful.enabled', { 
              reason: 'offline_data_available', 
              clientCount: state.clients.length 
            });
            return true;
          } else {
            // Modo degradado sin datos
            set({ 
              isOffline: true, 
              error: 'Funcionando sin conexión - algunos datos pueden no estar disponibles',
              loading: false,
              clients: []
            });
            record('graceful.enabled', { 
              reason: 'no_offline_data', 
              clientCount: 0 
            });
            return false;
          }
        },

        // Recovery automático de errores
        attemptRecovery: async () => {
          const state = get();
          record('recovery.start', { 
            isOffline: state.isOffline, 
            circuitOpen: state.circuitOpen, 
            errorCount: Object.values(state.errorCounters).reduce((sum, count) => sum + count, 0) 
          });

          try {
            // Reset circuit breaker si está abierto
            if (state.circuitOpen) {
              get().resetCircuit();
              record('recovery.circuit_reset');
            }

            // Intentar operación simple para verificar conectividad
            await withCircuit(async () => {
              return await clientService.getClients({ page: 1, per_page: 1 });
            }, 'recoveryTest', 10000);

            // Si llegamos aquí, la conectividad está restaurada
            set({ 
              isOffline: false, 
              error: null,
              errorCounters: {} // Reset error counters en recovery exitoso
            });

            record('recovery.success', { 
              previousErrorCount: Object.values(state.errorCounters).reduce((sum, count) => sum + count, 0)
            });

            // Recargar datos actuales
            if (state.lastSearchTerm !== undefined) {
              await get().searchClients(state.lastSearchTerm, state.currentPage, state.pageSize);
            }

            return true;

          } catch (error) {
            record('recovery.failed', { error: error.message });
            
            // Activar modo graceful como fallback
            get().enableGracefulMode();
            return false;
          }
        },

        // Hidratación desde storage offline
        hydrateFromStorage: () => {
          const stored = offline.hydrate();
          if (stored && Array.isArray(stored) && stored.length > 0) {
            const normalizedClients = normalizeClientData(stored);
            set({ 
              clients: normalizedClients,
              totalClients: normalizedClients.length,
              isOffline: true,
              lastOfflineSnapshot: Date.now()
            });
            record('offline.hydrated', { count: normalizedClients.length });
            return true;
          }
          return false;
        },

        // Reset circuit breaker manual
        resetCircuit: () => {
          circuit.close(get, set, 'manual');
          record('circuit.reset', { manual: true });
        },

        // Limpiar cache manualmente
        clearCache: () => {
          set({ 
            pageCache: {}, 
            cacheHits: 0, 
            cacheMisses: 0,
            lastCacheCleanup: Date.now()
          });
          record('cache.cleared', { reason: 'manual' });
        },

        // Obtener estadísticas completas del store Wave 2
        getStoreStats: () => {
          const state = get();
          const totalErrors = Object.values(state.errorCounters).reduce((sum, count) => sum + count, 0);
          const cacheEntries = Object.keys(state.pageCache).length;
          const totalOperations = state.cacheHits + state.cacheMisses;
          
          return {
            // Datos básicos
            clients: state.clients.length,
            totalClients: state.totalClients,
            currentPage: state.currentPage,
            totalPages: state.totalPages,
            
            // Cache performance
            cacheEntries,
            cacheHitRatio: totalOperations > 0 ? ((state.cacheHits / totalOperations) * 100).toFixed(1) : '0',
            cacheHits: state.cacheHits,
            cacheMisses: state.cacheMisses,
            
            // Reliability metrics
            isOffline: state.isOffline,
            circuitOpen: state.circuitOpen,
            circuitFailures: state.circuit?.failures || 0,
            circuitThreshold: state.circuit?.threshold || 0,
            
            // Error tracking
            errorCount: totalErrors,
            errorCounters: { ...state.errorCounters },
            lastError: state.error,
            
            // Operation tracking
            lastOperation: state.lastOperation,
            lastQuery: state.lastQuery,
            loading: state.loading,
            
            // Offline capabilities
            lastOfflineSnapshot: state.lastOfflineSnapshot ? new Date(state.lastOfflineSnapshot).toLocaleString() : null,
            offlineCapable: state.clients.length > 0 || !!state.lastOfflineSnapshot,
            
            // Performance indicators
            averageResponseTime: state.lastQuery?.duration || null,
            prefetchEnabled: STORE_CONFIG.prefetchEnabled,
            
            // Health score (0-100)
            healthScore: Math.max(0, 100 - (totalErrors * 5) - (state.circuitOpen ? 30 : 0) - (state.isOffline ? 20 : 0))
          };
        },

        // Obtener métricas detalladas para telemetría
        getTelemetrySnapshot: () => {
          const state = get();
          const stats = get().getStoreStats();
          
          const snapshot = {
            timestamp: Date.now(),
            stats,
            config: {
              pageCacheTTL: STORE_CONFIG.pageCacheTTL,
              maxCacheEntries: STORE_CONFIG.maxCacheEntries,
              circuitThreshold: state.circuit?.threshold,
              circuitCooldown: state.circuit?.cooldownMs,
              retryConfig: STORE_CONFIG.retryConfig
            },
            state: {
              hasData: state.clients.length > 0,
              hasError: !!state.error,
              isLoading: state.loading,
              cacheAge: Object.values(state.pageCache).map(entry => ({
                age: Date.now() - entry.ts,
                stale: isStale(entry)
              }))
            }
          };

          record('telemetry.snapshot', snapshot);
          return snapshot;
        },

        // Configuración para testing
        _testing: {
          overrideTTL: null,
          fastRetries: false,
          setTestConfig: (config) => {
            Object.assign(STORE_CONFIG, config);
          }
        }
      };
    },
    {
      name: 'client-store',
      version: 1
    }
  )
);

export default useClientStore;