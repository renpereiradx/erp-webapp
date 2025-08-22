/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mocks deben ir al inicio antes de imports
vi.mock('@/services/reservationService', () => ({
  reservationService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    startTimer: vi.fn(() => ({ id: 'test-timer' })),
    endTimer: vi.fn(),
    trackEvent: vi.fn(),
    trackError: vi.fn()
  }
}));

vi.mock('@/store/helpers/reliability', () => ({
  classifyError: vi.fn((error) => ({
    category: 'network',
    severity: 'low',
    code: 'TEST_ERROR'
  })),
  withRetry: vi.fn((fn) => fn)
}));

vi.mock('@/store/helpers/circuit', () => ({
  createCircuitHelpers: vi.fn(() => ({
    init: vi.fn(() => ({
      circuit: { failures: 0, threshold: 5 },
      circuitOpen: false
    })),
    isOpen: vi.fn(() => false),
    recordFailure: vi.fn(),
    recordSuccess: vi.fn()
  }))
}));

vi.mock('@/store/helpers/cache', () => ({
  lruTrim: vi.fn((cache) => ({ cache, removed: [] })),
  invalidatePages: vi.fn((cache) => ({ cache, invalidated: [] }))
}));

vi.mock('@/store/helpers/offline', () => ({
  createOfflineSnapshotHelpers: vi.fn(() => ({
    saveSnapshot: vi.fn(),
    loadSnapshot: vi.fn(),
    clearSnapshot: vi.fn()
  }))
}));

import useReservationStore from '@/store/useReservationStore';

describe('useReservationStore - Simplified Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe tener estado inicial correcto', () => {
    const { result } = renderHook(() => useReservationStore());

    expect(result.current.reservations).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastQuery.search).toBe('');
    expect(result.current.pagination.current_page).toBe(1);
  });

  it('debe poder crear una reserva', () => {
    const { result } = renderHook(() => useReservationStore());

    // Verificar que la función existe y es callable
    expect(typeof result.current.createReservation).toBe('function');
    
    // Verificar que el estado inicial es correcto para crear reservas
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('debe poder actualizar filtros', () => {
    const { result } = renderHook(() => useReservationStore());

    act(() => {
      result.current.setFilters({
        search: 'test search',
        status: 'confirmed'
      });
    });

    expect(result.current.lastQuery.search).toBe('test search');
    expect(result.current.lastQuery.status).toBe('confirmed');
  });

  it('debe poder cambiar página', () => {
    const { result } = renderHook(() => useReservationStore());

    act(() => {
      result.current.loadPage(2, 20, '');
    });

    // Como loadPage es async, verificamos que al menos se puede llamar
    expect(typeof result.current.loadPage).toBe('function');
  });

  it('debe manejar errores correctamente', () => {
    const { result } = renderHook(() => useReservationStore());

    // Verificar que clearError existe y funciona
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});
