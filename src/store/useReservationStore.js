/**
 * Store de Zustand para gestión de estado de reservas - Versión Hardened
 * Wave 8: API Integration & Backend Alignment
 * Implementa patrón establecido con helpers de resiliencia, cache, circuit breaker y offline
 * Siguiendo estructura exitosa de Suppliers/Products
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import reservationService from '@/services/reservationService';
import reservationServiceV2 from '@/services/reservationServiceV2';
import { telemetry } from '@/utils/telemetry';
import { classifyError, withRetry as baseWithRetry } from './helpers/reliability';
import { createCircuitHelpers } from './helpers/circuit';
import { lruTrim, invalidatePages as sharedInvalidatePages } from './helpers/cache';
import { createOfflineSnapshotHelpers } from './helpers/offline';
import { validateReserveRequest, validateReservationId } from '@/utils/reservationValidators';
import { RESERVATION_ACTIONS } from '@/types/reservationTypes';

/**
 * @typedef {Object} Reservation
 * @property {string|number} id
 * @property {string} product_id
 * @property {string} client_id
 * @property {string} start_time ISO 8601
 * @property {string} end_time ISO 8601
 * @property {number} duration horas
 * @property {number} total_amount
 * @property {string} status RESERVED|confirmed|completed|cancelled
 * @property {string} user_id
 * @property {string} [product_name] joined data
 * @property {string} [client_name] joined data
 * @property {Record<string,any>} [meta]
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
 * @property {Reservation[]} reservations
 * @property {Pagination} pagination
 * @property {number} ts timestamp ms
 *
 * @typedef {Object} CacheStats
 * @property {number} hits
 * @property {number} misses
 * @property {number} ratio 0..1
 *
 * @typedef {Object} CircuitStats
 * @property {number} failures
 * @property {boolean} open
 * @property {number} openUntil
 * @property {number} openCount
 * @property {number} avgOpenDurationMs
 *
 * @typedef {Object} CircuitHistoryEvent
 * @property {number} timestamp
 * @property {string} type 'opened'|'closed'|'reset'
 *
 * @typedef {Object} ReservationStoreSelectors
 * @property {(s: ReservationStoreState)=>CacheStats} selectCacheStats
 * @property {(s: ReservationStoreState)=>CircuitStats} selectCircuitStats
 * @property {(s: ReservationStoreState)=>{ts: number|null, halfTTL:number}} selectCurrentCacheMeta
 * @property {(s: ReservationStoreState)=>number} selectCircuitOpenPctLastHr
 *
 * @typedef {Object} ReservationStoreState
 * @property {Reservation[]} reservations
 * @property {boolean} loading
 * @property {string|null} error
 * @property {string|null} lastErrorCode
 * @property {string|null} lastErrorHintKey
 * @property {Pagination} pagination
 * @property {Record<string, PageCacheEntry>} pageCache
 * @property {number} pageCacheTTL
 * @property {number} cacheHits
 * @property {number} cacheMisses
 * @property {number} retryCount
 * @property {CircuitState} circuit
 * @property {boolean} circuitOpen
 * @property {any} circuitTimeoutId
 * @property {number} circuitOpenCount
 * @property {number} circuitTotalOpenDurationMs
 * @property {number|null} circuitLastOpenedAt
 * @property {CircuitHistoryEvent[]} circuitOpenHistory
 * @property {boolean} isOffline
 * @property {Reservation[]|null} lastOfflineSnapshot
 * @property {boolean} offlineBannerShown
 * @property {number|null} lastOfflineAt
 * @property {number|null} lastOnlineAt
 * @property {{page:number,pageSize:number,search:string}} lastQuery
 * @property {boolean} autoRefetchOnReconnect
 * @property {ReservationStoreSelectors} selectors
 * // Actions
 * @property {(value:boolean)=>void} setAutoRefetchOnReconnect
 * @property {(limit?:number)=>void} _trimPageCache
 * @property {(search:string,page:number,radius?:number,reason?:string)=>number[]} _invalidatePages
 * @property {()=>void} clearReservations
 * @property {()=>void} _recordFailure
 * @property {()=>void} _recordSuccess
 * @property {()=>boolean} _circuitOpen
 * @property {(reason?:string)=>void} _closeCircuit
 * @property {(snapshot:Reservation[])=>void} _persistOfflineSnapshot
 * @property {()=>Reservation[]|null} hydrateFromStorage
 * @property {(flag:boolean)=>void} setIsOffline
 * @property {(page:number,pageSize:number,search:string,filters?:object)=>Promise<void|{data:Reservation[],circuitOpen?:boolean}>} fetchReservations
 * @property {(page:number,pageSize:number,search:string,filters?:object)=>Promise<void|{data:Reservation[],circuitOpen?:boolean}>} loadPage
 * @property {(data:Partial<Reservation>)=>Promise<Reservation>} createReservation
 * @property {(id:Reservation['id'],data:Partial<Reservation>)=>Promise<Reservation>} updateReservation
 * @property {(id:Reservation['id'])=>Promise<boolean>} deleteReservation
 * @property {(id:Reservation['id'],data:{date:string,start_time:string,duration:number})=>Promise<Reservation>} rescheduleReservation
 */

// Environment configuration
const pageCacheTTL = parseInt(import.meta.env?.VITE_RESERVATIONS_CACHE_TTL_MS || '60000');

// Helper instances
const circuitHelpers = createCircuitHelpers('reservations', telemetry);
const offlineHelpers = createOfflineSnapshotHelpers('reservations_last_offline_snapshot', 'reservations', telemetry);

// Local retry wrapper with telemetry
const withRetry = (fn, op) => baseWithRetry(fn, {
  retries: 2,
  baseDelay: 180,
  op,
  telemetryRecord: (event, payload) => telemetry.record(event, payload),
  onRetry: (attempt, error) => {
    telemetry.record('feature.reservations.retry', { attempt, op, error: error.message });
  }
});

// Normalizar respuesta de API (defensivo)
const normalizeReservationsResponse = (response) => {
  if (!response) return { reservations: [], pagination: null };
  
  // Formato {data, pagination}
  if (response.data && Array.isArray(response.data)) {
    return {
      reservations: response.data,
      pagination: response.pagination || null
    };
  }
  
  // Formato {results}
  if (response.results && Array.isArray(response.results)) {
    return {
      reservations: response.results,
      pagination: response.pagination || null
    };
  }
  
  // Array directo
  if (Array.isArray(response)) {
    return {
      reservations: response,
      pagination: null
    };
  }
  
  // Objeto individual
  if (response.id) {
    return {
      reservations: [response],
      pagination: null
    };
  }
  
  return { reservations: [], pagination: null };
};

const useReservationStore = create(
  devtools(
    (set, get) => ({
      // Estado inicial con patrón hardened
      reservations: [],
      loading: false,
      error: null,
      lastErrorCode: null,
      lastErrorHintKey: null,
      pagination: {
        current_page: 1,
        per_page: 20,
        total: 0,
        total_pages: 0
      },
      
      // Cache y performance
      pageCache: {},
      pageCacheTTL,
      cacheHits: 0,
      cacheMisses: 0,
      
      // Circuit breaker
      ...circuitHelpers.init({ threshold: 4, cooldownMs: 30000 }),
      circuitOpenCount: 0,
      circuitTotalOpenDurationMs: 0,
      circuitLastOpenedAt: null,
      circuitOpenHistory: [],
      
      // Offline support
      isOffline: false,
      lastOfflineSnapshot: null,
      offlineBannerShown: false,
      lastOfflineAt: null,
      lastOnlineAt: null,
      autoRefetchOnReconnect: true,
      hasStaleData: false,
      staleDataCount: 0,
      
      // Schedule Management - Gestión de horarios
      schedules: [],
      scheduleManagement: {
        selectedProduct: null,
        dateRange: { start: null, end: null },
        generatingSchedules: false,
        lastGeneration: null,
        availabilityUpdating: false
      },
      scheduleCache: {},
      scheduleStats: {
        totalSchedules: 0,
        availableSchedules: 0,
        occupiedSchedules: 0,
        availabilityRate: 0
      },
      
      // Filtros y búsqueda
      lastQuery: { page: 1, pageSize: 20, search: '' },
      
      // Estadísticas
      stats: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      },

      // Selectores para métricas
      selectors: {
        selectCacheStats: (state) => ({
          hits: state.cacheHits,
          misses: state.cacheMisses,
          ratio: state.cacheHits + state.cacheMisses > 0 ? 
            state.cacheHits / (state.cacheHits + state.cacheMisses) : 0
        }),
        
        selectCircuitStats: (state) => ({
          failures: state.circuit?.failures || 0,
          open: !!state.circuitOpen,
          openUntil: state.circuit?.openUntil || 0,
          openCount: state.circuitOpenCount,
          avgOpenDurationMs: state.circuitOpenCount > 0 ? 
            state.circuitTotalOpenDurationMs / state.circuitOpenCount : 0
        }),
        
        selectCurrentCacheMeta: (state) => {
          const query = `${state.lastQuery.search || ''}|${state.lastQuery.page}`;
          const entry = state.pageCache[query];
          return {
            ts: entry?.ts || null,
            halfTTL: state.pageCacheTTL / 2
          };
        },
        
        selectCircuitOpenPctLastHr: (state) => {
          const now = Date.now();
          const oneHourAgo = now - 3600000;
          const recentEvents = state.circuitOpenHistory.filter(e => e.openedAt >= oneHourAgo);
          
          if (recentEvents.length === 0) return 0;
          
          const totalOpenTime = recentEvents.reduce((sum, event) => {
            const closedAt = event.closedAt || now;
            return sum + (closedAt - event.openedAt);
          }, 0);
          
          return (totalOpenTime / 3600000) * 100;
        }
      },

      // Helper methods
      _withRetry: (fn, op) => withRetry(fn, op),
      
      _recordFailure: () => {
        const state = get();
        circuitHelpers.recordFailure(get, set);
        
        // Tracking de circuit breaker aperturas
        if (state.circuitOpen !== get().circuitOpen && get().circuitOpen) {
          const now = Date.now();
          set(s => ({
            circuitOpenCount: s.circuitOpenCount + 1,
            circuitLastOpenedAt: now,
            circuitOpenHistory: [...s.circuitOpenHistory, { openedAt: now }]
          }));
          telemetry.record('feature.reservations.circuit.open', { 
            failures: state.circuit?.failures || 0 
          });
        }
      },
      
      _recordSuccess: () => {
        // Marcar cierre de circuit si estaba abierto
        const wasOpen = get().circuitOpen;
        circuitHelpers.recordSuccess(get, set);
        
        if (wasOpen && !get().circuitOpen) {
          const state = get();
          const duration = state.circuitLastOpenedAt ? 
            Date.now() - state.circuitLastOpenedAt : 0;
          
          set(s => ({
            circuitTotalOpenDurationMs: s.circuitTotalOpenDurationMs + duration,
            circuitOpenHistory: s.circuitOpenHistory.map(event => 
              event.openedAt === s.circuitLastOpenedAt && !event.closedAt 
                ? { ...event, closedAt: Date.now() }
                : event
            )
          }));
          
          telemetry.record('feature.reservations.circuit.close', { duration });
        }
      },
      
      _circuitOpen: () => circuitHelpers.isOpen(get, set),
      
      _closeCircuit: (reason = 'manual') => {
        circuitHelpers.close(get, set, reason);
        telemetry.record('feature.reservations.circuit.reset', { reason });
      },
      
      _trimPageCache: (limit = 30) => {
        const state = get();
        const trimmed = lruTrim(state.pageCache, limit);
        
        if (trimmed.removedCount > 0) {
          set({ pageCache: trimmed.cache });
          telemetry.record('feature.reservations.cache.trim', {
            removedCount: trimmed.removedCount,
            remainingCount: Object.keys(trimmed.cache).length
          });
        }
        
        return trimmed.removedKeys;
      },
      
      _invalidatePages: (search, page, radius = 2, reason = 'mutation') => {
        const state = get();
        const result = sharedInvalidatePages(state.pageCache, search, page, radius);
        
        if (result.removedCount > 0) {
          set({ pageCache: result.cache });
          telemetry.record('feature.reservations.cache.invalidate', {
            removedCount: result.removedCount,
            pages: result.removedKeys,
            reason
          });
        }
        
        return result.removedKeys;
      },
      
      _persistOfflineSnapshot: (snapshot) => {
        offlineHelpers.persist(snapshot);
        set({ lastOfflineSnapshot: snapshot });
        telemetry.record('feature.reservations.offline.snapshot.persist', {
          count: snapshot?.length || 0
        });
      },

      // Actions principales
      loadPage: async (page = 1, pageSize = 20, search = '') => {
        const start = performance.now();
        const cacheKey = `${search}|${page}`;
        const state = get();
        
        // Check circuit breaker
        if (state._circuitOpen()) {
          telemetry.record('feature.reservations.circuit.skip', { op: 'loadPage' });
          return { data: state.reservations, circuitOpen: true };
        }
        
        // Check cache
        const cached = state.pageCache[cacheKey];
        const now = Date.now();
        
        if (cached && (now - cached.ts) < state.pageCacheTTL) {
          set(s => ({ cacheHits: s.cacheHits + 1 }));
          telemetry.record('feature.reservations.cache.hit', { 
            page, search, age: now - cached.ts 
          });
          
          // Background revalidation si supera 50% TTL
          if ((now - cached.ts) > (state.pageCacheTTL / 2)) {
            setTimeout(() => {
              get().loadPage(page, pageSize, search, { revalidate: true });
            }, 100);
          }
          
          set({
            reservations: cached.reservations,
            pagination: cached.pagination,
            loading: false,
            error: null,
            lastQuery: { page, pageSize, search }
          });
          
          return { data: cached.reservations };
        }
        
        set(s => ({ cacheMisses: s.cacheMisses + 1 }));
        telemetry.record('feature.reservations.cache.miss', { page, search });
        
        // Fetch data
        set({ loading: true, error: null });
        
        try {
          const response = await state._withRetry(async () => {
            return await reservationService.getReservations({
              page,
              limit: pageSize,
              search: search || undefined
            });
          }, 'loadPage');
          
          const { reservations, pagination } = normalizeReservationsResponse(response);
          
          // Cache result
          set(s => ({
            pageCache: {
              ...s.pageCache,
              [cacheKey]: { reservations, pagination, ts: now }
            }
          }));
          
          set({
            reservations,
            pagination: pagination || state.pagination,
            loading: false,
            lastQuery: { page, pageSize, search }
          });
          
          state._recordSuccess();
          
          const duration = performance.now() - start;
          telemetry.record('feature.reservations.load', {
            page,
            count: reservations.length,
            latencyMs: Math.round(duration),
            search: search || undefined
          });
          
          // Prefetch next page if available
          if (pagination?.current_page < pagination?.total_pages) {
            const nextKey = `${search}|${page + 1}`;
            if (!state.pageCache[nextKey]) {
              setTimeout(() => {
                get().loadPage(page + 1, pageSize, search, { prefetch: true });
              }, 500);
            }
          }

          // Wave 5: Auto-snapshot en éxito para datos críticos offline
          setTimeout(() => {
            get().createCriticalSnapshot();
          }, 100);
          
          return { data: reservations };
          
        } catch (error) {
          const code = classifyError(error.message);
          const hintKey = `reservations.error.${code.toLowerCase()}`;
          
          set({ 
            loading: false, 
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: hintKey
          });
          
          state._recordFailure();
          
          telemetry.record('feature.reservations.error', {
            op: 'loadPage',
            code,
            latencyMs: Math.round(performance.now() - start),
            page,
            search
          });
          
          // Wave 5: Offline snapshot para errores de red - mejorado
          if (code === 'NETWORK') {
            console.log('🔴 Network error detected, creating critical snapshot...');
            get().createCriticalSnapshot();
          }
          
          throw error;
        }
      },
      
      fetchReservations: async (params = {}) => {
        const { page = 1, limit = 20, search = '', ...otherParams } = params;
        return get().loadPage(page, limit, search);
      },

      createReservation: async (reservationData) => {
        const start = performance.now();
        
        set({ loading: true, error: null });
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.createReservation(reservationData);
          }, 'createReservation');
          
          // Invalidar cache y refrescar
          const state = get();
          state._invalidatePages(state.lastQuery.search, state.lastQuery.page, 3, 'create');
          
          set({ loading: false });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.create.success', {
            latencyMs: Math.round(performance.now() - start)
          });
          
          // Background refetch
          setTimeout(() => {
            get().loadPage(1, state.lastQuery.pageSize, state.lastQuery.search);
          }, 100);
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set({ 
            loading: false, 
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.create_${code.toLowerCase()}`
          });
          
          get()._recordFailure();
          
          telemetry.record('feature.reservations.error', {
            op: 'createReservation',
            code,
            latencyMs: Math.round(performance.now() - start)
          });
          
          throw error;
        }
      },

      updateReservation: async (id, updates) => {
        const start = performance.now();
        
        set({ loading: true, error: null });
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.updateReservation(id, updates);
          }, 'updateReservation');
          
          // Invalidar cache
          const state = get();
          state._invalidatePages(state.lastQuery.search, state.lastQuery.page, 2, 'update');
          
          set({ loading: false });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.update.success', {
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set({ 
            loading: false, 
            error: error.message,
            lastErrorCode: code
          });
          
          get()._recordFailure();
          
          telemetry.record('feature.reservations.error', {
            op: 'updateReservation',
            code,
            latencyMs: Math.round(performance.now() - start)
          });
          
          throw error;
        }
      },

      cancelReservation: async (id) => {
        const start = performance.now();
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.cancelReservation(id);
          }, 'cancelReservation');
          
          // Actualizar reserva local
          set(state => ({
            reservations: state.reservations.map(r => 
              r.id === id ? { ...r, status: 'cancelled' } : r
            )
          }));
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.cancel.success', {
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          telemetry.record('feature.reservations.error', {
            op: 'cancelReservation',
            code,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      confirmReservation: async (id) => {
        const start = performance.now();
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.confirmReservation(id);
          }, 'confirmReservation');
          
          // Actualizar reserva local
          set(state => ({
            reservations: state.reservations.map(r => 
              r.id === id ? { ...r, status: 'confirmed' } : r
            )
          }));
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.confirm.success', {
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          telemetry.record('feature.reservations.error', {
            op: 'confirmReservation',
            code,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // =================================
      // SCHEDULE MANAGEMENT METHODS
      // =================================

      // Obtener horario por ID
      getScheduleById: async (id) => {
        const start = performance.now();
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.getScheduleById(id);
          }, 'getScheduleById');
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.get.success', {
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          telemetry.record('feature.reservations.error', {
            op: 'getScheduleById',
            code,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Obtener horarios disponibles para producto/fecha
      getAvailableSchedulesForDate: async (productId, date) => {
        const start = performance.now();
        const cacheKey = `schedules_${productId}_${date}`;
        
        // Check cache first
        const cached = get().scheduleCache[cacheKey];
        if (cached && (Date.now() - cached.ts) < get().pageCacheTTL) {
          set(state => ({ cacheHits: state.cacheHits + 1 }));
          telemetry.record('feature.reservations.schedule.cache.hit', { key: cacheKey });
          return cached.data;
        }
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.getAvailableSchedulesForDate(productId, date);
          }, 'getAvailableSchedulesForDate');
          
          // Cache result
          set(state => ({
            scheduleCache: {
              ...state.scheduleCache,
              [cacheKey]: { data: response, ts: Date.now() }
            },
            cacheMisses: state.cacheMisses + 1
          }));
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.available.success', {
            productId,
            date,
            count: response?.length || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          telemetry.record('feature.reservations.error', {
            op: 'getAvailableSchedulesForDate',
            code,
            productId,
            date,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Obtener horarios por rango de fechas
      getSchedulesByDateRange: async (startDate, endDate, params = {}) => {
        const start = performance.now();
        
        set({ loading: true, error: null });
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.getSchedulesByDateRange(startDate, endDate, params);
          }, 'getSchedulesByDateRange');
          
          set({ 
            schedules: response || [], 
            loading: false 
          });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.range.success', {
            startDate,
            endDate,
            count: response?.length || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set({ 
            loading: false, 
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.schedule_range_${code.toLowerCase()}`
          });
          
          telemetry.record('feature.reservations.error', {
            op: 'getSchedulesByDateRange',
            code,
            startDate,
            endDate,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Obtener horarios por producto
      getSchedulesByProduct: async (productId, params = {}) => {
        const start = performance.now();
        
        set({ loading: true, error: null });
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.getSchedulesByProduct(productId, params);
          }, 'getSchedulesByProduct');
          
          set({ 
            schedules: response || [], 
            loading: false 
          });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.product.success', {
            productId,
            count: response?.length || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set({ 
            loading: false, 
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.schedule_product_${code.toLowerCase()}`
          });
          
          telemetry.record('feature.reservations.error', {
            op: 'getSchedulesByProduct',
            code,
            productId,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Actualizar disponibilidad de horario
      updateScheduleAvailability: async (id, isAvailable) => {
        const start = performance.now();
        
        set(state => ({
          scheduleManagement: { 
            ...state.scheduleManagement, 
            availabilityUpdating: true 
          }
        }));
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.updateScheduleAvailability(id, isAvailable);
          }, 'updateScheduleAvailability');
          
          // Actualizar horario local
          set(state => ({
            schedules: state.schedules.map(s => 
              s.id === id ? { ...s, is_available: isAvailable } : s
            ),
            scheduleManagement: { 
              ...state.scheduleManagement, 
              availabilityUpdating: false 
            }
          }));
          
          // Invalidar cache relevante
          const state = get();
          const keysToInvalidate = Object.keys(state.scheduleCache).filter(key => 
            key.includes(`_${id}_`) || key.includes(`schedules_`)
          );
          
          const newCache = { ...state.scheduleCache };
          keysToInvalidate.forEach(key => delete newCache[key]);
          set({ scheduleCache: newCache });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.availability.update.success', {
            id,
            isAvailable,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set(state => ({
            scheduleManagement: { 
              ...state.scheduleManagement, 
              availabilityUpdating: false 
            },
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.schedule_availability_${code.toLowerCase()}`
          }));
          
          telemetry.record('feature.reservations.error', {
            op: 'updateScheduleAvailability',
            code,
            id,
            isAvailable,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Generar horarios diarios
      generateDailySchedules: async () => {
        const start = performance.now();
        
        set(state => ({
          scheduleManagement: { 
            ...state.scheduleManagement, 
            generatingSchedules: true 
          }
        }));
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.generateDailySchedules();
          }, 'generateDailySchedules');
          
          set(state => ({
            scheduleManagement: { 
              ...state.scheduleManagement, 
              generatingSchedules: false,
              lastGeneration: {
                type: 'daily',
                timestamp: Date.now(),
                result: response
              }
            }
          }));
          
          // Invalidar todo el cache de schedules
          set({ scheduleCache: {} });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.generate.daily.success', {
            generatedCount: response?.generated_count || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set(state => ({
            scheduleManagement: { 
              ...state.scheduleManagement, 
              generatingSchedules: false 
            },
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.schedule_generate_daily_${code.toLowerCase()}`
          }));
          
          telemetry.record('feature.reservations.error', {
            op: 'generateDailySchedules',
            code,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Generar horarios para fecha específica
      generateSchedulesForDate: async (targetDate) => {
        const start = performance.now();
        
        set(state => ({
          scheduleManagement: { 
            ...state.scheduleManagement, 
            generatingSchedules: true 
          }
        }));
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.generateSchedulesForDate(targetDate);
          }, 'generateSchedulesForDate');
          
          set(state => ({
            scheduleManagement: { 
              ...state.scheduleManagement, 
              generatingSchedules: false,
              lastGeneration: {
                type: 'date',
                timestamp: Date.now(),
                targetDate,
                result: response
              }
            }
          }));
          
          // Invalidar cache relacionado con esa fecha
          const state = get();
          const keysToInvalidate = Object.keys(state.scheduleCache).filter(key => 
            key.includes(targetDate)
          );
          
          const newCache = { ...state.scheduleCache };
          keysToInvalidate.forEach(key => delete newCache[key]);
          set({ scheduleCache: newCache });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.generate.date.success', {
            targetDate,
            generatedCount: response?.generated_count || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set(state => ({
            scheduleManagement: { 
              ...state.scheduleManagement, 
              generatingSchedules: false 
            },
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.schedule_generate_date_${code.toLowerCase()}`
          }));
          
          telemetry.record('feature.reservations.error', {
            op: 'generateSchedulesForDate',
            code,
            targetDate,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Generar horarios para próximos N días
      generateSchedulesForNextDays: async (days) => {
        const start = performance.now();
        
        set(state => ({
          scheduleManagement: { 
            ...state.scheduleManagement, 
            generatingSchedules: true 
          }
        }));
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.generateSchedulesForNextDays(days);
          }, 'generateSchedulesForNextDays');
          
          set(state => ({
            scheduleManagement: { 
              ...state.scheduleManagement, 
              generatingSchedules: false,
              lastGeneration: {
                type: 'next-days',
                timestamp: Date.now(),
                days,
                result: response
              }
            }
          }));
          
          // Invalidar todo el cache de schedules
          set({ scheduleCache: {} });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.generate.next-days.success', {
            days,
            generatedCount: response?.generated_count || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set(state => ({
            scheduleManagement: { 
              ...state.scheduleManagement, 
              generatingSchedules: false 
            },
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.schedule_generate_days_${code.toLowerCase()}`
          }));
          
          telemetry.record('feature.reservations.error', {
            op: 'generateSchedulesForNextDays',
            code,
            days,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Actualización masiva de disponibilidad
      bulkUpdateScheduleAvailability: async (scheduleIds, isAvailable) => {
        const start = performance.now();
        const results = [];
        
        set(state => ({
          scheduleManagement: { 
            ...state.scheduleManagement, 
            availabilityUpdating: true 
          }
        }));
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationService.bulkUpdateScheduleAvailability(scheduleIds, isAvailable);
          }, 'bulkUpdateScheduleAvailability');
          
          // Actualizar horarios locales
          set(state => ({
            schedules: state.schedules.map(s => 
              scheduleIds.includes(s.id) ? { ...s, is_available: isAvailable } : s
            ),
            scheduleManagement: { 
              ...state.scheduleManagement, 
              availabilityUpdating: false 
            }
          }));
          
          // Invalidar cache
          set({ scheduleCache: {} });
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.bulk.availability.success', {
            count: scheduleIds.length,
            isAvailable,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set(state => ({
            scheduleManagement: { 
              ...state.scheduleManagement, 
              availabilityUpdating: false 
            },
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.schedule_bulk_${code.toLowerCase()}`
          }));
          
          telemetry.record('feature.reservations.error', {
            op: 'bulkUpdateScheduleAvailability',
            code,
            count: scheduleIds.length,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      // Schedule Management Utilities
      setScheduleProduct: (product) => {
        set(state => ({
          scheduleManagement: { 
            ...state.scheduleManagement, 
            selectedProduct: product 
          }
        }));
      },

      setScheduleDateRange: (range) => {
        set(state => ({
          scheduleManagement: { 
            ...state.scheduleManagement, 
            dateRange: range 
          }
        }));
      },

      getScheduleStats: () => {
        const state = get();
        const total = state.schedules.length;
        const available = state.schedules.filter(s => s.is_available).length;
        const occupied = total - available;
        
        return {
          totalSchedules: total,
          availableSchedules: available,
          occupiedSchedules: occupied,
          availabilityRate: total > 0 ? Math.round((available / total) * 100) : 0
        };
      },

      clearScheduleCache: () => {
        set({ scheduleCache: {} });
        telemetry.record('feature.reservations.schedule.cache.clear');
      },

      // Utility methods
      setFilters: (newFilters) => {
        set(state => ({
          lastQuery: { ...state.lastQuery, ...newFilters }
        }));
      },

      clearError: () => {
        set({ error: null, lastErrorCode: null, lastErrorHintKey: null });
      },

      setIsOffline: (offline) => {
        set({ isOffline: offline });
        if (offline) {
          set({ lastOfflineAt: Date.now() });
        } else {
          set({ lastOnlineAt: Date.now() });
        }
      },

      setAutoRefetchOnReconnect: (enabled) => {
        set({ autoRefetchOnReconnect: enabled });
      },

      hydrateFromStorage: () => {
        const data = offlineHelpers.hydrate();
        if (data && data.length > 0) {
          set({ reservations: data, loading: false });
          telemetry.record('feature.reservations.offline.snapshot.hydrate', {
            count: data.length
          });
          return data;
        }
        return null;
      },

      // === WAVE 5: OFFLINE SUPPORT & CIRCUIT BREAKER ===
      
      setOfflineStatus: (isOffline) => {
        const now = Date.now();
        const state = get();
        
        set({ 
          isOffline,
          [isOffline ? 'lastOfflineAt' : 'lastOnlineAt']: now,
          offlineBannerShown: isOffline
        });
        
        telemetry.record(`feature.reservations.offline.${isOffline ? 'detected' : 'restored'}`, {
          timestamp: now,
          wasOfflineMs: isOffline ? 0 : (now - (state.lastOfflineAt || now))
        });

        // Auto-snapshot al ir offline si hay datos
        if (isOffline && state.reservations.length > 0) {
          get().createCriticalSnapshot();
        }

        // Auto-refetch al volver online si está habilitado
        if (!isOffline && state.autoRefetchOnReconnect) {
          setTimeout(() => {
            get().hydrateAndRefresh();
          }, 1000);
        }
      },

      createCriticalSnapshot: () => {
        const state = get();
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        // Filtrar reservas críticas (próximos 7 días)
        const criticalReservations = state.reservations.filter(reservation => {
          const startTime = new Date(reservation.start_time);
          return startTime >= today && startTime <= nextWeek;
        });

        const snapshot = {
          reservations: criticalReservations,
          pagination: state.pagination,
          timestamp: Date.now(),
          searchTerm: state.searchTerm,
          filters: state.filters || {}
        };

        state._persistOfflineSnapshot(snapshot);
        
        telemetry.record('feature.reservations.offline.snapshot.created', {
          reservationsCount: criticalReservations.length,
          totalReservations: state.reservations.length,
          timestamp: snapshot.timestamp
        });

        return snapshot;
      },

      hydrateFromOfflineSnapshot: () => {
        const snapshot = offlineHelpers.hydrate();
        if (!snapshot) {
          console.log('📭 No offline snapshot available');
          return false;
        }

        const age = Date.now() - snapshot.timestamp;
        const isStale = age > (24 * 60 * 60 * 1000); // 24h stale

        set({
          reservations: snapshot.reservations || [],
          pagination: snapshot.pagination || { current_page: 1, per_page: 20, total: 0, total_pages: 0 },
          searchTerm: snapshot.searchTerm || '',
          filters: snapshot.filters || {},
          dataState: isStale ? 'stale' : 'success',
          lastOfflineSnapshot: snapshot,
          loading: false
        });

        telemetry.record('feature.reservations.offline.snapshot.hydrated', {
          reservationsCount: snapshot.reservations?.length || 0,
          ageMs: age,
          isStale,
          hadPreviousData: get().reservations.length > 0
        });

        console.log(`📦 Hydrated ${snapshot.reservations?.length || 0} reservations from offline snapshot (age: ${Math.round(age / 1000)}s, stale: ${isStale})`);
        return true;
      },

      hydrateAndRefresh: async () => {
        const hydrated = get().hydrateFromOfflineSnapshot();
        
        if (hydrated) {
          console.log('🔄 Hydration successful, scheduling background refresh...');
          // Refrescar datos en background sin afectar UI
          setTimeout(async () => {
            try {
              await get().loadPage(get().pagination?.current_page || 1, 20, get().searchTerm, { revalidate: true });
              console.log('✅ Background refresh completed after hydration');
            } catch (error) {
              console.warn('⚠️ Background refresh failed after hydration:', error);
            }
          }, 2000);
        }
        
        return hydrated;
      },

      resetCircuitBreaker: () => {
        const state = get();
        circuitHelpers.reset();
        
        set({ 
          circuitOpenCount: state.circuitOpenCount + 1,
          circuitLastOpenedAt: Date.now()
        });
        
        telemetry.record('feature.reservations.circuit.manual_reset', {
          timestamp: Date.now(),
          previousFailures: state.circuit?.failures || 0,
          wasOpenFor: state.circuit?.openUntil ? Date.now() - (state.circuit.openUntil - 30000) : 0
        });

        console.log('🔧 Circuit breaker manually reset');
      },

      checkStaleData: () => {
        const state = get();
        const now = Date.now();
        const staleThreshold = state.pageCacheTTL / 2; // 50% del TTL
        
        const stalePages = Object.entries(state.pageCache).filter(([key, entry]) => {
          return (now - entry.ts) > staleThreshold;
        });

        if (stalePages.length > 0) {
          set({ hasStaleData: true, staleDataCount: stalePages.length });
          
          telemetry.record('feature.reservations.cache.stale_detected', {
            stalePagesCount: stalePages.length,
            oldestAge: Math.max(...stalePages.map(([_, entry]) => now - entry.ts)),
            threshold: staleThreshold
          });

          console.log(`⚠️ Detected ${stalePages.length} stale cache pages`);
          return true;
        }

        set({ hasStaleData: false, staleDataCount: 0 });
        return false;
      },

      dismissOfflineBanner: () => {
        set({ offlineBannerShown: false });
        telemetry.record('feature.reservations.offline.banner.dismissed');
      },

      // =================================
      // WAVE 8: NEW API V2 METHODS
      // =================================

      /**
       * Gestionar reserva usando la nueva API unificada
       * @param {string} action - create, update, cancel
       * @param {Object} data - Datos de la reserva
       */
      manageReservationV2: async (action, data) => {
        const start = performance.now();
        
        // Validar entrada
        const validation = validateReserveRequest({ action, ...data });
        if (!validation.isValid) {
          const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
          telemetry.record('feature.reservations.error', {
            op: `manageReservation.${action}`,
            code: 'VALIDATION_ERROR',
            errors: validation.errors
          });
          throw error;
        }

        set({ loading: true, error: null });
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationServiceV2.manageReservation(action, data);
          }, `manageReservation.${action}`);
          
          // Invalidar cache según la acción
          const state = get();
          const invalidateScope = action === RESERVATION_ACTIONS.CREATE ? 3 : 2;
          state._invalidatePages(state.lastQuery.search, state.lastQuery.page, invalidateScope, action);
          
          set({ loading: false });
          get()._recordSuccess();
          
          telemetry.record(`feature.reservations.${action}.success`, {
            latencyMs: Math.round(performance.now() - start)
          });
          
          // Background refetch para create
          if (action === RESERVATION_ACTIONS.CREATE) {
            setTimeout(() => {
              get().loadPage(1, state.lastQuery.pageSize, state.lastQuery.search);
            }, 100);
          }
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          set({ 
            loading: false, 
            error: error.message,
            lastErrorCode: code,
            lastErrorHintKey: `reservations.error.${action}_${code.toLowerCase()}`
          });
          
          get()._recordFailure();
          
          telemetry.record('feature.reservations.error', {
            op: `manageReservation.${action}`,
            code,
            latencyMs: Math.round(performance.now() - start)
          });
          
          throw error;
        }
      },

      /**
       * Obtener reservas por producto usando API v2
       * @param {string} productId - ID del producto
       */
      getReservationsByProductV2: async (productId) => {
        const start = performance.now();
        
        if (!productId) {
          throw new Error('Product ID is required');
        }

        try {
          const response = await get()._withRetry(async () => {
            return await reservationServiceV2.getReservationsByProduct(productId);
          }, 'getReservationsByProduct');
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.by_product.success', {
            productId,
            count: response?.length || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          telemetry.record('feature.reservations.error', {
            op: 'getReservationsByProduct',
            code,
            productId,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      /**
       * Obtener reservas por cliente usando API v2
       * @param {string} clientId - ID del cliente
       */
      getReservationsByClientV2: async (clientId) => {
        const start = performance.now();
        
        if (!clientId) {
          throw new Error('Client ID is required');
        }

        try {
          const response = await get()._withRetry(async () => {
            return await reservationServiceV2.getReservationsByClient(clientId);
          }, 'getReservationsByClient');
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.by_client.success', {
            clientId,
            count: response?.length || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          telemetry.record('feature.reservations.error', {
            op: 'getReservationsByClient',
            code,
            clientId,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      /**
       * Verificar consistencia reservas-ventas usando API v2
       */
      checkConsistencyV2: async () => {
        const start = performance.now();
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationServiceV2.checkConsistency();
          }, 'checkConsistency');
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.consistency.check.success', {
            issuesFound: response?.length || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          telemetry.record('feature.reservations.error', {
            op: 'checkConsistency',
            code,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      /**
       * Obtener horarios disponibles usando API v2
       * @param {string} productId - ID del producto
       * @param {string} date - Fecha en formato YYYY-MM-DD
       * @param {number} durationHours - Duración en horas
       */
      getAvailableSchedulesV2: async (productId, date, durationHours = 1) => {
        const start = performance.now();
        const cacheKey = `schedules_v2_${productId}_${date}_${durationHours}`;
        
        // Verificar caché primero
        const cached = get().scheduleCache[cacheKey];
        if (cached && (Date.now() - cached.ts) < get().pageCacheTTL) {
          set(state => ({ cacheHits: state.cacheHits + 1 }));
          telemetry.record('feature.reservations.schedule.cache.hit', { key: cacheKey });
          return cached.data;
        }
        
        try {
          const response = await get()._withRetry(async () => {
            return await reservationServiceV2.getAvailableSchedules(productId, date, durationHours);
          }, 'getAvailableSchedules');
          
          // Cachear resultado
          set(state => ({
            scheduleCache: {
              ...state.scheduleCache,
              [cacheKey]: { data: response, ts: Date.now() }
            },
            cacheMisses: state.cacheMisses + 1
          }));
          
          get()._recordSuccess();
          
          telemetry.record('feature.reservations.schedule.available.success', {
            productId,
            date,
            durationHours,
            count: response?.length || 0,
            latencyMs: Math.round(performance.now() - start)
          });
          
          return response;
          
        } catch (error) {
          const code = classifyError(error.message);
          
          telemetry.record('feature.reservations.error', {
            op: 'getAvailableSchedules',
            code,
            productId,
            date,
            durationHours,
            latencyMs: Math.round(performance.now() - start)
          });
          
          get()._recordFailure();
          throw error;
        }
      },

      forceRevalidateOffline: async () => {
        const state = get();
        if (state.isOffline) {
          console.log('⚠️ Cannot revalidate while offline');
          return false;
        }

        set({ loading: true });
        
        try {
          await get().loadPage(state.pagination?.current_page || 1, 20, state.searchTerm, { force: true });
          console.log('✅ Force revalidation completed');
          return true;
        } catch (error) {
          console.error('❌ Force revalidation failed:', error);
          return false;
        } finally {
          set({ loading: false });
        }
      }
    }),
    { name: 'reservation-store' }
  )
);

export default useReservationStore;
