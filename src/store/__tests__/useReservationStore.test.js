/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useReservationStore from '../useReservationStore';

// Mock de telemetry
const mockTelemetry = {
  record: vi.fn(),
  startTimer: vi.fn(() => ({ id: 'test-timer' })),
  endTimer: vi.fn(() => 100)
};

vi.mock('@/utils/telemetry', () => ({
  telemetry: mockTelemetry
}));

// Mock de i18n
vi.mock('@/lib/i18n', () => ({
  t: vi.fn((key) => key)
}));

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

describe('useReservationStore - Unit Tests', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useReservationStore.getState().resetState();
    });
    
    // Clear all mocks
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Estado inicial', () => {
    test('debe tener estado inicial correcto', () => {
      const store = useReservationStore.getState();
      
      expect(store.reservations).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(null);
      expect(store.currentPage).toBe(1);
      expect(store.totalPages).toBe(0);
      expect(store.totalReservations).toBe(0);
      expect(store.pageSize).toBe(10);
      expect(store.isOffline).toBe(false);
      expect(store.lastErrorHintKey).toBe(null);
    });

    test('debe tener filtros iniciales correctos', () => {
      const store = useReservationStore.getState();
      
      expect(store.filters).toEqual({
        searchTerm: '',
        selectedClient: 'all',
        selectedProduct: 'all', 
        selectedStatus: 'all',
        dateRange: null,
        sortBy: 'date',
        sortOrder: 'desc'
      });
    });

    test('debe tener métricas de cache iniciales', () => {
      const store = useReservationStore.getState();
      
      expect(store.cacheMetrics.hits).toBe(0);
      expect(store.cacheMetrics.misses).toBe(0);
      expect(store.cacheMetrics.evictions).toBe(0);
      expect(store.circuitMetrics.failures).toBe(0);
      expect(store.circuitMetrics.isOpen).toBe(false);
    });
  });

  describe('Gestión de filtros', () => {
    test('setSearchTerm debe actualizar término de búsqueda', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.setSearchTerm('test search');
      });

      expect(result.current.filters.searchTerm).toBe('test search');
    });

    test('setSelectedClient debe actualizar cliente seleccionado', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.setSelectedClient('client-123');
      });

      expect(result.current.filters.selectedClient).toBe('client-123');
    });

    test('setDateRange debe actualizar rango de fechas', () => {
      const { result } = renderHook(() => useReservationStore());
      const dateRange = { from: new Date('2024-01-01'), to: new Date('2024-01-31') };

      act(() => {
        result.current.setDateRange(dateRange);
      });

      expect(result.current.filters.dateRange).toEqual(dateRange);
    });

    test('clearFilters debe resetear todos los filtros', () => {
      const { result } = renderHook(() => useReservationStore());

      // Establecer algunos filtros
      act(() => {
        result.current.setSearchTerm('test');
        result.current.setSelectedClient('client-123');
        result.current.setSelectedStatus('confirmed');
      });

      // Limpiar filtros
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({
        searchTerm: '',
        selectedClient: 'all',
        selectedProduct: 'all',
        selectedStatus: 'all',
        dateRange: null,
        sortBy: 'date',
        sortOrder: 'desc'
      });
    });
  });

  describe('Gestión de paginación', () => {
    test('setCurrentPage debe actualizar página actual', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.setCurrentPage(3);
      });

      expect(result.current.currentPage).toBe(3);
    });

    test('setPageSize debe actualizar tamaño de página', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.pageSize).toBe(25);
    });

    test('resetPagination debe resetear paginación a valores iniciales', () => {
      const { result } = renderHook(() => useReservationStore());

      // Cambiar valores
      act(() => {
        result.current.setCurrentPage(5);
        result.current.setPageSize(50);
      });

      // Reset
      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
    });
  });

  describe('Gestión de estado offline', () => {
    test('setOfflineStatus debe actualizar estado offline', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.setOfflineStatus(true);
      });

      expect(result.current.isOffline).toBe(true);
      expect(mockTelemetry.record).toHaveBeenCalledWith(
        'feature.reservations.offline.detected'
      );
    });

    test('setOfflineStatus debe registrar telemetría al volver online', () => {
      const { result } = renderHook(() => useReservationStore());

      // Ir offline primero
      act(() => {
        result.current.setOfflineStatus(true);
      });

      vi.clearAllMocks();

      // Volver online
      act(() => {
        result.current.setOfflineStatus(false);
      });

      expect(result.current.isOffline).toBe(false);
      expect(mockTelemetry.record).toHaveBeenCalledWith(
        'feature.reservations.offline.restored'
      );
    });
  });

  describe('Gestión de snapshots offline', () => {
    test('createCriticalSnapshot debe crear snapshot filtrado', () => {
      const { result } = renderHook(() => useReservationStore());
      
      const mockReservations = [
        {
          id: '1',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
          status: 'confirmed'
        },
        {
          id: '2', 
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // +10 días
          status: 'reserved'
        }
      ];

      // Establecer reservas en el store
      act(() => {
        result.current.setReservations(mockReservations);
      });

      act(() => {
        result.current.createCriticalSnapshot();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'reservations_critical_snapshot',
        expect.stringContaining('"id":"1"')
      );
      expect(mockTelemetry.record).toHaveBeenCalledWith(
        'feature.reservations.offline.snapshot.created',
        expect.objectContaining({ count: 2 })
      );
    });

    test('hydrateFromOfflineSnapshot debe restaurar datos desde localStorage', () => {
      const { result } = renderHook(() => useReservationStore());
      
      const snapshotData = {
        reservations: [
          { id: '1', date: '2024-08-23', status: 'confirmed' },
          { id: '2', date: '2024-08-24', status: 'reserved' }
        ],
        timestamp: Date.now() - 60000 // 1 minuto atrás
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(snapshotData));

      act(() => {
        result.current.hydrateFromOfflineSnapshot();
      });

      expect(result.current.reservations).toEqual(snapshotData.reservations);
      expect(result.current.totalReservations).toBe(2);
      expect(mockTelemetry.record).toHaveBeenCalledWith(
        'feature.reservations.offline.snapshot.hydrated',
        expect.objectContaining({ count: 2 })
      );
    });

    test('hydrateFromOfflineSnapshot debe manejar snapshot corrupto', () => {
      const { result } = renderHook(() => useReservationStore());
      
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      act(() => {
        result.current.hydrateFromOfflineSnapshot();
      });

      // No debe cambiar el estado si el snapshot está corrupto
      expect(result.current.reservations).toEqual([]);
      expect(result.current.totalReservations).toBe(0);
    });
  });

  describe('Circuit breaker', () => {
    test('resetCircuitBreaker debe resetear métricas y registrar telemetría', () => {
      const { result } = renderHook(() => useReservationStore());

      // Simular estado de circuit abierto
      act(() => {
        result.current.circuitMetrics.failures = 5;
        result.current.circuitMetrics.isOpen = true;
      });

      act(() => {
        result.current.resetCircuitBreaker();
      });

      expect(result.current.circuitMetrics.failures).toBe(0);
      expect(result.current.circuitMetrics.isOpen).toBe(false);
      expect(mockTelemetry.record).toHaveBeenCalledWith(
        'feature.reservations.circuit.manual_reset'
      );
    });
  });

  describe('Gestión de errores', () => {
    test('setError debe establecer error y hint key', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.setError('Test error message', 'error.network');
      });

      expect(result.current.error).toBe('Test error message');
      expect(result.current.lastErrorHintKey).toBe('error.network');
    });

    test('clearError debe limpiar error y hint key', () => {
      const { result } = renderHook(() => useReservationStore());

      // Establecer error primero
      act(() => {
        result.current.setError('Test error', 'error.test');
      });

      // Limpiar error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.lastErrorHintKey).toBe(null);
    });
  });

  describe('Métricas de cache', () => {
    test('debe actualizar métricas de hit de cache', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.incrementCacheHit();
      });

      expect(result.current.cacheMetrics.hits).toBe(1);
    });

    test('debe actualizar métricas de miss de cache', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.incrementCacheMiss();
      });

      expect(result.current.cacheMetrics.misses).toBe(1);
    });

    test('debe actualizar métricas de eviction de cache', () => {
      const { result } = renderHook(() => useReservationStore());

      act(() => {
        result.current.incrementCacheEviction();
      });

      expect(result.current.cacheMetrics.evictions).toBe(1);
    });
  });

  describe('Normalización de datos', () => {
    test('setReservations debe normalizar diferentes formatos de respuesta', () => {
      const { result } = renderHook(() => useReservationStore());

      // Formato con data y pagination
      const response1 = {
        data: [{ id: '1', status: 'confirmed' }],
        pagination: { total: 1, pages: 1 }
      };

      act(() => {
        result.current.setReservations(response1.data, response1.pagination);
      });

      expect(result.current.reservations).toEqual([{ id: '1', status: 'confirmed' }]);
      expect(result.current.totalReservations).toBe(1);
      expect(result.current.totalPages).toBe(1);
    });

    test('setReservations debe manejar array plano', () => {
      const { result } = renderHook(() => useReservationStore());

      const reservations = [
        { id: '1', status: 'confirmed' },
        { id: '2', status: 'reserved' }
      ];

      act(() => {
        result.current.setReservations(reservations);
      });

      expect(result.current.reservations).toEqual(reservations);
      expect(result.current.totalReservations).toBe(2);
    });
  });

  describe('Validaciones', () => {
    test('debe validar datos de reserva antes de establecer', () => {
      const { result } = renderHook(() => useReservationStore());

      // Datos inválidos (null/undefined)
      act(() => {
        result.current.setReservations(null);
      });

      expect(result.current.reservations).toEqual([]);
      expect(result.current.totalReservations).toBe(0);
    });

    test('debe filtrar reservas con datos incompletos', () => {
      const { result } = renderHook(() => useReservationStore());

      const reservations = [
        { id: '1', status: 'confirmed', date: '2024-08-23' }, // Válida
        { id: null, status: 'reserved' }, // Inválida - sin ID
        { status: 'pending' }, // Inválida - sin ID
        { id: '2', status: 'confirmed', date: '2024-08-24' } // Válida
      ];

      act(() => {
        result.current.setReservations(reservations);
      });

      expect(result.current.reservations).toHaveLength(2);
      expect(result.current.reservations.every(r => r.id)).toBe(true);
    });
  });
});
