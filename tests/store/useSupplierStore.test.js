import { describe, it, expect, vi, beforeEach } from 'vitest';
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
