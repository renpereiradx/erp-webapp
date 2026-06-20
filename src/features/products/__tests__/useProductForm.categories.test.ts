import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Category } from '@/features/categories';

const mockCategoryStore: {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: ReturnType<typeof vi.fn>;
  createCategory: ReturnType<typeof vi.fn>;
  updateCategory: ReturnType<typeof vi.fn>;
  deleteCategory: ReturnType<typeof vi.fn>;
} = {
  categories: [],
  loading: false,
  error: null,
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
};

const mockProductStore = {
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
};

vi.mock('@/store/useCategoryStore', () => ({
  default: () => mockCategoryStore,
}));

vi.mock('@/store/useProductStore', () => ({
  default: () => mockProductStore,
}));

const successToast = vi.fn();
const errorToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: successToast, error: errorToast }),
}));

import { useProductForm } from '@/features/products/hooks/useProductForm';

const SEED: Category[] = [
  { id: 1, name: 'Electrónicos', is_active: true },
  { id: 2, name: 'Lácteos', is_active: true },
];

describe('useProductForm — integración con categorías', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryStore.categories = [];
    mockCategoryStore.loading = false;
    mockCategoryStore.error = null;
    mockCategoryStore.fetchCategories.mockImplementation(async () => {
      mockCategoryStore.categories = SEED;
      return SEED;
    });
    mockProductStore.createProduct.mockResolvedValue({ id: 'new' });
    mockProductStore.updateProduct.mockResolvedValue({ id: 'updated' });
    mockProductStore.deleteProduct.mockResolvedValue(undefined);
  });

  it('expone categories, loadingCategories y handlers del modal desde el store', () => {
    mockCategoryStore.categories = SEED;
    mockCategoryStore.loading = false;

    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    expect(result.current.categories).toEqual(SEED);
    expect(result.current.loadingCategories).toBe(false);
    expect(typeof result.current.openCategoryManager).toBe('function');
    expect(typeof result.current.closeCategoryManager).toBe('function');
    expect(result.current.isCategoryManagerOpen).toBe(false);
  });

  it('llama a fetchCategories solo si la lista está vacía al abrir el modal', async () => {
    const { rerender } = renderHook(
      ({ isOpen }) => useProductForm({ product: null, isOpen, onClose: () => {} }),
      { initialProps: { isOpen: false } }
    );

    expect(mockCategoryStore.fetchCategories).not.toHaveBeenCalled();

    rerender({ isOpen: true });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockCategoryStore.fetchCategories).toHaveBeenCalledTimes(1);
    expect(mockCategoryStore.categories).toEqual(SEED);

    rerender({ isOpen: false });
    rerender({ isOpen: true });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockCategoryStore.fetchCategories).toHaveBeenCalledTimes(1);
  });

  it('NO llama a fetchCategories si la lista ya tiene datos', () => {
    mockCategoryStore.categories = SEED;
    renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );
    expect(mockCategoryStore.fetchCategories).not.toHaveBeenCalled();
  });

  it('openCategoryManager abre el modal y closeCategoryManager lo cierra', () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    expect(result.current.isCategoryManagerOpen).toBe(false);
    act(() => result.current.openCategoryManager());
    expect(result.current.isCategoryManagerOpen).toBe(true);
    act(() => result.current.closeCategoryManager());
    expect(result.current.isCategoryManagerOpen).toBe(false);
  });

  it('handleCategoryCreated auto-selecciona la nueva categoría y limpia el error', () => {
    mockCategoryStore.categories = SEED;
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    act(() => result.current.setFormData(prev => ({ ...prev, name: 'Prod', description: 'd' })));
    act(() => result.current.setErrors({ category: 'requerido' }));

    act(() => result.current.handleCategoryCreated({ id: 99 }));

    expect(result.current.formData.category).toBe('99');
    expect(result.current.errors.category).toBeUndefined();
  });

  it('handleCategoryCreated respeta el shape {id: number}', () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    act(() => result.current.handleCategoryCreated({ id: 42 }));
    expect(result.current.formData.category).toBe('42');
  });

  it('handleCategoryCreated acepta respuesta envuelta {category: {id}}', () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    act(() => result.current.handleCategoryCreated({ category: { id: 7 } }));
    expect(result.current.formData.category).toBe('7');
  });

  it('handleCategoryCreated acepta respuesta envuelta {data: {id}}', () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    act(() => result.current.handleCategoryCreated({ data: { id: 11 } }));
    expect(result.current.formData.category).toBe('11');
  });

  it('handleCategoryCreated ignora payloads sin id', () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    act(() => result.current.setFormData(prev => ({ ...prev, category: '3' })));
    act(() => result.current.handleCategoryCreated({}));
    expect(result.current.formData.category).toBe('3');
  });

  it('handleCategoryDeleted limpia el campo si la categoría borrada estaba seleccionada', () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    act(() => result.current.setFormData(prev => ({ ...prev, category: '5' })));
    expect(result.current.formData.category).toBe('5');

    act(() => result.current.handleCategoryDeleted(5));
    expect(result.current.formData.category).toBe('');

    act(() => result.current.setFormData(prev => ({ ...prev, category: '3' })));
    act(() => result.current.handleCategoryDeleted(99));
    expect(result.current.formData.category).toBe('3');
  });

  it('mantiene la categoría seleccionada si la borrada no coincide', () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} })
    );

    act(() => result.current.setFormData(prev => ({ ...prev, category: '3' })));
    act(() => result.current.handleCategoryDeleted(7));
    expect(result.current.formData.category).toBe('3');
  });
});
