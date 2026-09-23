// src/features/products/__tests__/useProductsLogic.branch.test.tsx
// El stock es por sucursal: al cambiar la sucursal activa (switcher del
// header) el hook debe refethear la vista vigente en la nueva sucursal.
// Mocks en la frontera: store Zustand, productService y BranchContext.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductsLogic } from '../hooks/useProductsLogic';

const fetchProductsPaginated = vi.fn(() => Promise.resolve());
const fetchProducts = vi.fn(() => Promise.resolve());
const fetchCategories = vi.fn(() => Promise.resolve());

vi.mock('@/store/useProductStore', () => ({
  default: () => ({
    products: [],
    productsById: {},
    loading: false,
    error: null,
    totalProducts: 0,
    currentPage: 1,
    totalPages: 1,
    categories: [],
    fetchProducts,
    fetchProductsPaginated,
    fetchCategories,
    setFilters: vi.fn(),
    setCurrentPage: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('@/services/productService', () => ({
  productService: {
    getSearchFacets: vi.fn(() => Promise.resolve({ facets: [] })),
    searchAdvanced: vi.fn(() => Promise.resolve({ products: [], total_count: 0 })),
    getById: vi.fn(),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ errorFrom: vi.fn(), success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/hooks/useSearchFocusShortcut', () => ({
  useSearchFocusShortcut: vi.fn(),
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}));

const branchState = { currentBranchId: 1 as number | null };

vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ ...branchState, allowedBranches: [1, 3], isGlobalView: branchState.currentBranchId === null, changeBranch: vi.fn(), canViewGlobal: true }),
}));

describe('useProductsLogic — refetch al cambiar de sucursal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    branchState.currentBranchId = 1;
  });

  it('refethea la página 1 cuando cambia la sucursal activa', () => {
    const { rerender } = renderHook(() => useProductsLogic());

    // Mount inicial: 1 fetch.
    expect(fetchProductsPaginated).toHaveBeenCalledTimes(1);
    expect(fetchProductsPaginated).toHaveBeenCalledWith(1, 10);

    act(() => {
      branchState.currentBranchId = 3;
    });
    rerender();

    expect(fetchProductsPaginated).toHaveBeenCalledTimes(2);
    expect(fetchProductsPaginated).toHaveBeenLastCalledWith(1, 10);
  });

  it('no refethea si la sucursal no cambia entre renders', () => {
    const { rerender } = renderHook(() => useProductsLogic());
    expect(fetchProductsPaginated).toHaveBeenCalledTimes(1);

    rerender();
    rerender();

    expect(fetchProductsPaginated).toHaveBeenCalledTimes(1);
  });

  it('refethea también al pasar a la vista global (null)', () => {
    const { rerender } = renderHook(() => useProductsLogic());
    expect(fetchProductsPaginated).toHaveBeenCalledTimes(1);

    act(() => {
      branchState.currentBranchId = null;
    });
    rerender();

    expect(fetchProductsPaginated).toHaveBeenCalledTimes(2);
  });
});
