/**
 * Products — instancia única de toast y mensajes reales de la API.
 *
 * Cubre la corrección del defecto "toasts invisibles": la página posee una
 * sola instancia de useToast() y la inyecta en el hook y los modales, porque
 * useToast() es estado local por instancia y solo la renderizada en el
 * ToastContainer de Products.tsx es visible.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------- Mocks de frontera ----------
const mockProductStoreState: Record<string, any> = {
  products: [],
  loading: false,
  error: null,
  lastErrorCode: null,
  totalProducts: 0,
  currentPage: 1,
  totalPages: 1,
  categories: [],
  fetchProducts: vi.fn(() => Promise.resolve()),
  fetchProductsPaginated: vi.fn(() => Promise.resolve()),
  fetchCategories: vi.fn(() => Promise.resolve()),
  setFilters: vi.fn(),
  setCurrentPage: vi.fn(),
  clearError: vi.fn(),
  createProduct: vi.fn(() => Promise.resolve({ id: 'new' })),
  updateProduct: vi.fn(() => Promise.resolve({ id: 'updated' })),
  deleteProduct: vi.fn(() => Promise.resolve()),
};

vi.mock('@/store/useProductStore', () => ({
  default: () => mockProductStoreState,
}));

// Los mocks de store deben ser ESTABLES entre renders (una única instancia).
// Un mock que fabrica estado nuevo en cada llamada cambia la identidad de
// las funciones en cada render, dispara efectos en bucle y agota el heap
// del worker (OOM "Worker exited unexpectedly").
const mockCategoryStoreState = vi.hoisted(() => ({
  categories: [{ id: 1, name: 'General', is_active: true }],
  loading: false,
  fetchCategories: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/store/useCategoryStore', () => ({
  default: () => mockCategoryStoreState,
}));

vi.mock('@/services/productService', () => ({
  productService: {
    getSearchFacets: vi.fn(() => Promise.resolve({ facets: [] })),
    searchAdvanced: vi.fn(() => Promise.resolve({ products: [], total_count: 0 })),
    getById: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('@/services/taxRateService', () => ({
  taxRateService: { getPaginated: vi.fn(() => Promise.resolve([])) },
}));

vi.mock('@/services/brandService', () => ({
  brandService: { getAll: vi.fn(() => Promise.resolve([])) },
}));

vi.mock('@/hooks/useToast', () => ({
  // Instancia interna por defecto (cuando no se inyecta la de la página).
  useToast: () => ({
    toasts: [],
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    errorFrom: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSearchFocusShortcut', () => ({
  useSearchFocusShortcut: vi.fn(),
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}));

vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ currentBranchId: 1 }),
}));

import { useProductsLogic } from '../hooks/useProductsLogic';
import { useProductForm } from '../hooks/useProductForm';

const makeInjectedToast = () => ({
  toasts: [],
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  errorFrom: vi.fn(),
  removeToast: vi.fn(),
});

const fakeSubmit = () =>
  ({ preventDefault: vi.fn() }) as unknown as React.FormEvent;

describe('Products — instancia única de toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductStoreState.error = null;
    mockProductStoreState.lastErrorCode = null;
    mockProductStoreState.createProduct.mockResolvedValue({ id: 'new' });
    mockProductStoreState.updateProduct.mockResolvedValue({ id: 'updated' });
  });

  it('useProductsLogic devuelve la instancia inyectada (la que renderiza la página)', () => {
    const injected = makeInjectedToast();
    const { result } = renderHook(() => useProductsLogic(injected as any));
    expect(result.current.toast).toBe(injected);
  });

  it('el toast de error del store conserva mensaje real y código', () => {
    mockProductStoreState.error = 'Fallo API';
    mockProductStoreState.lastErrorCode = 'NETWORK';
    const injected = makeInjectedToast();

    renderHook(() => useProductsLogic(injected as any));

    expect(injected.errorFrom).toHaveBeenCalledWith(
      { message: 'Fallo API', code: 'NETWORK' },
      { fallback: 'Fallo API' },
    );
  });

  it('crear producto emite success en la instancia inyectada (visible en la página)', async () => {
    const injected = makeInjectedToast();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose, toast: injected as any })
    );

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        name: 'Yerba Mate',
        category: '1',
        description: 'Yerba mate elaborada',
      }));
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmit());
    });

    expect(mockProductStoreState.createProduct).toHaveBeenCalled();
    expect(injected.success).toHaveBeenCalledWith('Producto creado exitosamente');
    expect(onClose).toHaveBeenCalled();
  });

  it('fallo al guardar emite errorFrom en la instancia inyectada', async () => {
    mockProductStoreState.createProduct.mockRejectedValue(new Error('duplicate sku'));
    const injected = makeInjectedToast();
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {}, toast: injected as any })
    );

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        name: 'Yerba Mate',
        category: '1',
        description: 'Yerba mate elaborada',
      }));
    });
    await act(async () => {
      await result.current.handleSubmit(fakeSubmit());
    });

    expect(injected.errorFrom).toHaveBeenCalled();
    expect(injected.success).not.toHaveBeenCalled();
  });
});
