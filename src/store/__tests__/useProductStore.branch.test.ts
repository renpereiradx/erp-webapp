// src/store/__tests__/useProductStore.branch.test.ts
// El stock es por sucursal: pageCache/searchCache anclan resultados a la
// sucursal con la que se fetcheó. BranchContext.changeBranch emite
// 'branch:changed' y el store debe vaciar ambas cachés — sin esto, cambiar
// de sucursal en el header seguiría mostrando el stock de la anterior
// durante el TTL (120s) o hasta un refetch forzado.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useProductStore from '@/store/useProductStore';

vi.mock('@/services/productService', () => ({
  productService: { searchAdvanced: vi.fn(), getById: vi.fn(), getProducts: vi.fn() },
}));

vi.mock('@/services/categoryCacheService', () => ({
  categoryCacheService: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
}));

vi.mock('@/services/api', () => ({
  apiService: { get: vi.fn(), post: vi.fn() },
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('useProductStore — invalidación por cambio de sucursal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProductStore.setState({
      pageCache: {
        1: { ts: Date.now(), products: [{ id: 'p1', stock_quantity: 10 }] },
      },
      searchCache: {
        '"coca"|10|all|all': { ts: Date.now(), data: { products: [{ id: 'p1' }], total: 1 } },
      },
    });
  });

  it("vacía pageCache y searchCache al recibir el evento 'branch:changed'", () => {
    expect(Object.keys(useProductStore.getState().pageCache)).toHaveLength(1);
    expect(Object.keys(useProductStore.getState().searchCache)).toHaveLength(1);

    window.dispatchEvent(new CustomEvent('branch:changed', { detail: { branchId: 3 } }));

    expect(useProductStore.getState().pageCache).toEqual({});
    expect(useProductStore.getState().searchCache).toEqual({});
  });
});
