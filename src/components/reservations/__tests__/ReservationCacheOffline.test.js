/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReservationStore } from '@/store/useReservationStore';

// Mock de localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock de IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  transaction: vi.fn(),
  objectStore: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn()
};

global.indexedDB = mockIndexedDB;

// Mock de API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

vi.mock('@/lib/api-client', () => ({
  apiClient: mockApiClient
}));

// Mock de service worker
const mockServiceWorker = {
  register: vi.fn(),
  unregister: vi.fn(),
  postMessage: vi.fn(),
  addEventListener: vi.fn()
};

global.navigator.serviceWorker = mockServiceWorker;

// Mock de telemetría
vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    track: vi.fn(),
    trackError: vi.fn(),
    trackPerformance: vi.fn(),
    trackCacheHit: vi.fn(),
    trackCacheMiss: vi.fn()
  })
}));

// Mock de notificaciones
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
};

vi.mock('@/lib/toast', () => ({
  toast: mockToast
}));

// Mock del cache service
const mockCacheService = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  getStats: vi.fn(),
  invalidate: vi.fn()
};

vi.mock('@/services/cache', () => ({
  cacheService: mockCacheService
}));

// Mock data
const mockReservations = [
  {
    id: 'reservation-1',
    client_name: 'Juan Pérez',
    product_name: 'Producto A',
    date: '2024-08-25',
    time: '14:30',
    duration: 120,
    status: 'confirmed',
    location: 'Sala A',
    notes: 'Reserva importante'
  },
  {
    id: 'reservation-2',
    client_name: 'María García',
    product_name: 'Producto B',
    date: '2024-08-26',
    time: '10:00',
    duration: 90,
    status: 'pending',
    location: 'Sala B',
    notes: ''
  }
];

describe('Cache and Offline Behavior Tests', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5 * 60 * 1000, // 5 minutos
          cacheTime: 10 * 60 * 1000, // 10 minutos
        },
        mutations: { retry: false }
      }
    });

    vi.clearAllMocks();
    
    // Reset network status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Cache Hit/Miss Tests', () => {
    test('debe registrar cache hit cuando los datos están en cache', async () => {
      // Configurar cache hit
      mockCacheService.get.mockResolvedValueOnce(mockReservations);
      mockApiClient.get.mockResolvedValueOnce({ data: mockReservations });

      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Llamar fetchReservations
      await result.current.fetchReservations();

      await waitFor(() => {
        expect(result.current.reservations).toEqual(mockReservations);
      });

      // Verificar que se registra cache hit
      const telemetry = vi.mocked(require('@/hooks/useTelemetry').useTelemetry());
      expect(telemetry.trackCacheHit).toHaveBeenCalledWith('reservations', {
        cacheKey: 'reservations-list',
        hitTime: expect.any(Number)
      });
    });

    test('debe registrar cache miss cuando los datos no están en cache', async () => {
      // Configurar cache miss
      mockCacheService.get.mockResolvedValueOnce(null);
      mockApiClient.get.mockResolvedValueOnce({ data: mockReservations });

      const { result } = renderHook(() => useReservationStore(), { wrapper });

      await result.current.fetchReservations();

      await waitFor(() => {
        expect(result.current.reservations).toEqual(mockReservations);
      });

      // Verificar que se registra cache miss y se almacena en cache
      const telemetry = vi.mocked(require('@/hooks/useTelemetry').useTelemetry());
      expect(telemetry.trackCacheMiss).toHaveBeenCalledWith('reservations', {
        cacheKey: 'reservations-list',
        fetchTime: expect.any(Number)
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'reservations-list',
        mockReservations,
        expect.any(Number)
      );
    });

    test('debe manejar cache expirado correctamente', async () => {
      // Configurar cache expirado
      const expiredData = {
        data: mockReservations,
        timestamp: Date.now() - (6 * 60 * 1000), // Expirado hace 6 minutos
        ttl: 5 * 60 * 1000 // TTL de 5 minutos
      };

      mockCacheService.get.mockResolvedValueOnce(expiredData);
      mockApiClient.get.mockResolvedValueOnce({ data: mockReservations });

      const { result } = renderHook(() => useReservationStore(), { wrapper });

      await result.current.fetchReservations();

      // Debe hacer nueva llamada API porque cache expiró
      expect(mockApiClient.get).toHaveBeenCalled();
      
      // Debe actualizar cache con nuevos datos
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'reservations-list',
        mockReservations,
        expect.any(Number)
      );
    });

    test('debe invalidar cache al modificar datos', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Crear nueva reserva
      const newReservation = {
        client_name: 'Nuevo Cliente',
        product_name: 'Nuevo Producto',
        date: '2024-08-27',
        time: '12:00',
        duration: 60,
        status: 'pending'
      };

      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'reservation-new', ...newReservation }
      });

      await result.current.createReservation(newReservation);

      // Verificar que se invalida el cache
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('reservations-');
      
      // Verificar que se actualiza React Query cache
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith(['reservations']);
    });
  });

  describe('Cache Revalidation Tests', () => {
    test('debe revalidar cache en background', async () => {
      // Configurar stale data en cache
      const staleData = {
        data: mockReservations,
        timestamp: Date.now() - (3 * 60 * 1000), // 3 minutos atrás
        ttl: 5 * 60 * 1000,
        stale: true
      };

      mockCacheService.get.mockResolvedValueOnce(staleData);
      mockApiClient.get.mockResolvedValueOnce({ data: mockReservations });

      const { result } = renderHook(() => useReservationStore(), { wrapper });

      await result.current.fetchReservations();

      // Debe servir datos stale inmediatamente
      expect(result.current.reservations).toEqual(mockReservations);

      // Debe hacer revalidación en background
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalled();
      });
    });

    test('debe manejar errores durante revalidación', async () => {
      mockCacheService.get.mockResolvedValueOnce({
        data: mockReservations,
        timestamp: Date.now() - (6 * 60 * 1000),
        ttl: 5 * 60 * 1000
      });

      // Simular error en API
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useReservationStore(), { wrapper });

      await result.current.fetchReservations();

      // Debe servir datos del cache aunque estén expirados
      expect(result.current.reservations).toEqual(mockReservations);
      
      // Debe mostrar indicador de datos obsoletos
      expect(result.current.isStale).toBe(true);
    });

    test('debe implementar estrategia stale-while-revalidate', async () => {
      const staleReservations = [mockReservations[0]];
      const freshReservations = mockReservations;

      // Primera llamada - datos stale del cache
      mockCacheService.get.mockResolvedValueOnce({
        data: staleReservations,
        timestamp: Date.now() - (4 * 60 * 1000),
        ttl: 5 * 60 * 1000,
        stale: true
      });

      // Revalidación - datos frescos de API
      mockApiClient.get.mockResolvedValueOnce({ data: freshReservations });

      const { result } = renderHook(() => useReservationStore(), { wrapper });

      await result.current.fetchReservations();

      // Primero debe mostrar datos stale
      expect(result.current.reservations).toEqual(staleReservations);

      // Luego debe actualizar con datos frescos
      await waitFor(() => {
        expect(result.current.reservations).toEqual(freshReservations);
      });
    });
  });

  describe('Prefetch Tests', () => {
    test('debe hacer prefetch de datos relacionados', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Mock API responses para prefetch
      mockApiClient.get.mockImplementation((url) => {
        if (url.includes('/reservations')) {
          return Promise.resolve({ data: mockReservations });
        }
        if (url.includes('/products')) {
          return Promise.resolve({ data: [{ id: '1', name: 'Producto A' }] });
        }
        if (url.includes('/clients')) {
          return Promise.resolve({ data: [{ id: '1', name: 'Cliente A' }] });
        }
      });

      await result.current.fetchReservations();

      // Verificar que se hace prefetch de datos relacionados
      expect(mockApiClient.get).toHaveBeenCalledWith('/products');
      expect(mockApiClient.get).toHaveBeenCalledWith('/clients');
    });

    test('debe prefetch basado en interacciones del usuario', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Simular hover sobre una reserva
      await result.current.prefetchReservationDetails('reservation-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/reservations/reservation-1');
      
      // Datos deben estar en cache para acceso rápido
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'reservation-details-reservation-1',
        expect.any(Object),
        expect.any(Number)
      );
    });

    test('debe limitar prefetch para evitar sobrecarga', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Intentar prefetch múltiple rápidamente
      const prefetchPromises = [];
      for (let i = 0; i < 10; i++) {
        prefetchPromises.push(result.current.prefetchReservationDetails(`reservation-${i}`));
      }

      await Promise.all(prefetchPromises);

      // Solo debe hacer máximo 3 prefetch concurrentes
      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Offline Snapshot Persistence Tests', () => {
    test('debe persistir snapshot cuando se va offline', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Configurar estado inicial
      result.current.reservations = mockReservations;

      // Simular pérdida de conexión
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        // Debe guardar snapshot en IndexedDB
        expect(mockIndexedDB.put).toHaveBeenCalledWith(
          'offline-snapshots',
          {
            timestamp: expect.any(Number),
            data: {
              reservations: mockReservations,
              filters: expect.any(Object),
              pagination: expect.any(Object)
            }
          }
        );
      });
    });

    test('debe hidratar desde snapshot al volver online', async () => {
      // Configurar snapshot en IndexedDB
      const offlineSnapshot = {
        timestamp: Date.now() - (2 * 60 * 1000),
        data: {
          reservations: mockReservations,
          filters: { search: 'test', status: 'confirmed' },
          pagination: { page: 1, limit: 20 }
        }
      };

      mockIndexedDB.get.mockResolvedValueOnce(offlineSnapshot);

      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Simular recuperación de conexión
      Object.defineProperty(navigator, 'onLine', { value: true });
      await result.current.hydrateFromSnapshot();

      // Debe restaurar estado desde snapshot
      expect(result.current.reservations).toEqual(mockReservations);
      expect(result.current.filters.search).toBe('test');
      expect(result.current.filters.status).toBe('confirmed');
    });

    test('debe limpiar snapshots antiguos', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Mock snapshots antiguos
      const oldSnapshots = [
        { id: 1, timestamp: Date.now() - (25 * 60 * 60 * 1000) }, // 25 horas
        { id: 2, timestamp: Date.now() - (30 * 60 * 60 * 1000) }, // 30 horas
        { id: 3, timestamp: Date.now() - (1 * 60 * 60 * 1000) } // 1 hora
      ];

      mockIndexedDB.getAll.mockResolvedValueOnce(oldSnapshots);

      await result.current.cleanupOldSnapshots();

      // Debe eliminar snapshots mayores a 24 horas
      expect(mockIndexedDB.delete).toHaveBeenCalledWith('offline-snapshots', 1);
      expect(mockIndexedDB.delete).toHaveBeenCalledWith('offline-snapshots', 2);
      expect(mockIndexedDB.delete).not.toHaveBeenCalledWith('offline-snapshots', 3);
    });

    test('debe manejar conflictos al sincronizar snapshots', async () => {
      const localReservation = {
        ...mockReservations[0],
        client_name: 'Modificado Offline',
        _locallyModified: true,
        _lastModified: Date.now() - (5 * 60 * 1000)
      };

      const serverReservation = {
        ...mockReservations[0],
        client_name: 'Modificado en Servidor',
        updated_at: new Date(Date.now() - (3 * 60 * 1000)).toISOString()
      };

      const { result } = renderHook(() => useReservationStore(), { wrapper });
      
      result.current.reservations = [localReservation];

      // Simular sincronización
      mockApiClient.get.mockResolvedValueOnce({ data: [serverReservation] });

      await result.current.syncOfflineChanges();

      // Debe detectar conflicto y mostrar resolución
      expect(result.current.conflicts).toHaveLength(1);
      expect(result.current.conflicts[0]).toMatchObject({
        id: mockReservations[0].id,
        local: localReservation,
        server: serverReservation,
        type: 'update_conflict'
      });
    });
  });

  describe('Offline Banner Behavior Tests', () => {
    test('debe mostrar banner cuando se pierde conexión', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Simular pérdida de conexión
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
        expect(result.current.offlineBanner.visible).toBe(true);
        expect(result.current.offlineBanner.message).toContain('Sin conexión');
      });
    });

    test('debe ocultar banner cuando se recupera conexión', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Primero ir offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      // Luego volver online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
        expect(result.current.offlineBanner.visible).toBe(false);
      });
    });

    test('debe mostrar indicador de sincronización', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Simular sincronización en progreso
      await result.current.startSync();

      expect(result.current.syncStatus.isActive).toBe(true);
      expect(result.current.syncStatus.message).toContain('Sincronizando');

      // Simular finalización de sincronización
      await result.current.finishSync();

      expect(result.current.syncStatus.isActive).toBe(false);
      expect(result.current.syncStatus.message).toContain('Sincronizado');
    });

    test('debe persistir banner hasta que usuario lo cierre', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Mostrar banner de error
      result.current.showBanner('error', 'Error de sincronización', { persistent: true });

      expect(result.current.offlineBanner.visible).toBe(true);
      expect(result.current.offlineBanner.type).toBe('error');
      expect(result.current.offlineBanner.persistent).toBe(true);

      // Banner no debe desaparecer automáticamente
      await new Promise(resolve => setTimeout(resolve, 6000));
      expect(result.current.offlineBanner.visible).toBe(true);

      // Solo se oculta cuando usuario lo cierra
      result.current.hideBanner();
      expect(result.current.offlineBanner.visible).toBe(false);
    });

    test('debe manejar múltiples mensajes de banner', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Agregar múltiples mensajes
      result.current.showBanner('info', 'Sincronizando datos...');
      result.current.showBanner('warning', 'Algunos datos no se pudieron sincronizar');
      result.current.showBanner('success', 'Sincronización completada');

      // Debe mostrar el más reciente
      expect(result.current.offlineBanner.type).toBe('success');
      expect(result.current.offlineBanner.message).toContain('completada');

      // Debe mantener queue de mensajes
      expect(result.current.bannerQueue).toHaveLength(2);
    });
  });

  describe('Service Worker Integration Tests', () => {
    test('debe registrar service worker para cache offline', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      await result.current.initializeOfflineSupport();

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    test('debe comunicarse con service worker para cache', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      await result.current.cacheForOffline(mockReservations);

      expect(mockServiceWorker.postMessage).toHaveBeenCalledWith({
        type: 'CACHE_RESERVATIONS',
        data: mockReservations
      });
    });

    test('debe recibir actualizaciones del service worker', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Simular mensaje del service worker
      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'CACHE_UPDATED',
          cacheKey: 'reservations',
          timestamp: Date.now()
        }
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(result.current.cacheStatus.lastUpdate).toBeDefined();
      });
    });
  });

  describe('Performance Optimization Tests', () => {
    test('debe implementar debouncing para operaciones de cache', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Hacer múltiples llamadas rápidas
      result.current.updateCache('key1', 'data1');
      result.current.updateCache('key2', 'data2');
      result.current.updateCache('key3', 'data3');

      // Solo debe hacer una operación de cache después del debounce
      await waitFor(() => {
        expect(mockCacheService.set).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    test('debe comprimir datos antes de almacenar en cache', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      const largeData = new Array(1000).fill(mockReservations[0]);

      await result.current.setCacheData('large-dataset', largeData);

      // Verificar que los datos se comprimen
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'large-dataset',
        expect.objectContaining({
          compressed: true,
          originalSize: expect.any(Number),
          compressedSize: expect.any(Number)
        }),
        expect.any(Number)
      );
    });

    test('debe implementar LRU para gestión de memoria', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      // Llenar cache hasta el límite
      for (let i = 0; i < 15; i++) {
        await result.current.setCacheData(`key-${i}`, `data-${i}`);
      }

      // Verificar que se eliminan entradas más antiguas
      expect(mockCacheService.delete).toHaveBeenCalledWith('key-0');
      expect(mockCacheService.delete).toHaveBeenCalledWith('key-1');
    });

    test('debe monitorear uso de memoria del cache', async () => {
      const { result } = renderHook(() => useReservationStore(), { wrapper });

      mockCacheService.getStats.mockResolvedValueOnce({
        entries: 25,
        memoryUsage: 1024 * 1024 * 5, // 5MB
        hitRate: 0.85,
        missRate: 0.15
      });

      const stats = await result.current.getCacheStats();

      expect(stats.memoryUsage).toBe(1024 * 1024 * 5);
      expect(stats.hitRate).toBe(0.85);

      // Debe alertar si memoria excede límite
      if (stats.memoryUsage > 1024 * 1024 * 10) { // 10MB
        expect(result.current.cacheWarnings).toContain('memory_limit_exceeded');
      }
    });
  });
});
