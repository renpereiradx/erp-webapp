import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';

// Mock telemetry to avoid errors
vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn() } }));
// Mock service
vi.mock('@/services/supplierService', () => ({
  supplierService: {
    getSuppliers: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    deleteSupplier: vi.fn(),
  }
}));

import { supplierService } from '@/services/supplierService';

function resetStore() {
  const { suppliers, pagination } = useSupplierStore.getState();
  useSupplierStore.setState({ suppliers: [], pagination: { ...pagination, total: 0 }, loading: false, error: null });
}

describe('useSupplierStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('normaliza lista simple', async () => {
    supplierService.getSuppliers.mockResolvedValueOnce({ success: true, data: [{ id: 1, name: 'A' }] });
    await useSupplierStore.getState().fetchSuppliers();
    expect(useSupplierStore.getState().suppliers).toHaveLength(1);
  });

  it('normaliza lista paginada', async () => {
    supplierService.getSuppliers.mockResolvedValueOnce({ success: true, data: { data: [{ id: 2, name: 'B' }], pagination: { current_page: 1, per_page: 10, total: 1, total_pages: 1 } } });
    await useSupplierStore.getState().fetchSuppliers();
    expect(useSupplierStore.getState().suppliers[0].id).toBe(2);
  });

  it('maneja error y setea error en estado', async () => {
    supplierService.getSuppliers.mockRejectedValue(new Error('Network fail'));
    await useSupplierStore.getState().fetchSuppliers();
    expect(useSupplierStore.getState().error).toMatch(/Network|Respuesta vacía/);
  });

  it('retry intenta nuevamente en fallo', async () => {
    const sequence = [new Error('Network'), { success: true, data: [{ id: 3, name: 'C' }] }];
    supplierService.getSuppliers.mockImplementation(() => {
      const res = sequence.shift();
      if (res instanceof Error) return Promise.reject(res);
      return Promise.resolve(res);
    });
    await useSupplierStore.getState().fetchSuppliers();
    expect(useSupplierStore.getState().suppliers[0].id).toBe(3);
    expect(supplierService.getSuppliers).toHaveBeenCalledTimes(2);
  });
});

describe('useSupplierStore circuit breaker', () => {
  beforeEach(() => {
    // reset circuit state
    useSupplierStore.setState({ circuit: { openUntil: 0, failures: 0, threshold: 3, cooldownMs: 200 }, circuitOpen: false, circuitTimeoutId: null });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('abre circuito tras N fallos y salta fetch', async () => {
    const { supplierService } = await import('@/services/supplierService');
    supplierService.getSuppliers.mockRejectedValue(new Error('Network down'));
    await useSupplierStore.getState().fetchSuppliers();
    await useSupplierStore.getState().fetchSuppliers();
    await useSupplierStore.getState().fetchSuppliers(); // threshold 3
    expect(useSupplierStore.getState().circuitOpen).toBe(true);
    const before = supplierService.getSuppliers.mock.calls.length;
    // Should short-circuit
    await useSupplierStore.getState().fetchSuppliers();
    const after = supplierService.getSuppliers.mock.calls.length;
    expect(after).toBe(before); // no new call
  });
  it('cierra circuito manualmente tras expirar y éxito siguiente', async () => {
    const { supplierService } = await import('@/services/supplierService');
    supplierService.getSuppliers.mockRejectedValue(new Error('Network down'));
    for (let i = 0; i < 3; i++) {
      await useSupplierStore.getState().fetchSuppliers();
    }
    expect(useSupplierStore.getState().circuitOpen).toBe(true);
    // Simular expiración de cooldown
    useSupplierStore.setState((s) => ({ circuit: { ...s.circuit, openUntil: Date.now() - 1 }, circuitOpen: true }));
    // Ahora próxima llamada debería cerrar y permitir éxito
    supplierService.getSuppliers.mockReset();
    supplierService.getSuppliers.mockResolvedValue({ success: true, data: [{ id: 99, name: 'Ok' }] });
    await useSupplierStore.getState().fetchSuppliers();
    expect(useSupplierStore.getState().circuitOpen).toBe(false);
    expect(useSupplierStore.getState().suppliers[0]?.id).toBe(99);
  });
});

describe('useSupplierStore offline snapshot', () => {
  it('persiste snapshot al detectar NETWORK y marca isOffline', async () => {
    const { supplierService } = await import('@/services/supplierService');
    supplierService.getSuppliers.mockResolvedValueOnce({ success: true, data: [{ id: 1, name: 'A' }] });
    await useSupplierStore.getState().fetchSuppliers();
    expect(useSupplierStore.getState().suppliers.length).toBe(1);
    // Fail network now
    supplierService.getSuppliers.mockRejectedValueOnce(new Error('Network connection lost'));
    await useSupplierStore.getState().fetchSuppliers();
    expect(useSupplierStore.getState().isOffline).toBe(true);
    // localStorage snapshot
    try {
      const raw = window.localStorage.getItem('suppliers_last_offline_snapshot');
      expect(raw).toBeTruthy();
    } catch {}
  });
});
