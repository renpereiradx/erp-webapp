import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Category } from '../types';

const mockStore: {
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

vi.mock('@/store/useCategoryStore', () => ({
  default: () => mockStore,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useCategoryManagement } from '../hooks/useCategoryManagement';
import { toast } from 'sonner';

const SEED_CATEGORIES = [
  { id: 1, name: 'Electrónicos', description: 'Productos electrónicos', is_active: true },
  { id: 2, name: 'Lácteos', description: 'Productos lácteos', is_active: true },
  { id: 3, name: 'Bebidas', description: null, is_active: false },
];

describe('useCategoryManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.categories = [];
    mockStore.loading = false;
    mockStore.error = null;
    mockStore.fetchCategories.mockResolvedValue([]);
    mockStore.createCategory.mockImplementation(async (data) => ({ id: 99, ...data }));
    mockStore.updateCategory.mockImplementation(async (id, data) => ({ id, ...data }));
    mockStore.deleteCategory.mockResolvedValue(undefined);
  });

  it('llama a fetchCategories en mount cuando autoFetch=true', async () => {
    renderHook(() => useCategoryManagement());
    expect(mockStore.fetchCategories).toHaveBeenCalledTimes(1);
  });

  it('no llama a fetchCategories en mount cuando autoFetch=false', async () => {
    renderHook(() => useCategoryManagement({ autoFetch: false }));
    expect(mockStore.fetchCategories).not.toHaveBeenCalled();
  });

  it('muestra toast de error si fetchCategories falla', async () => {
    mockStore.fetchCategories.mockRejectedValueOnce(new Error('Network fail'));
    renderHook(() => useCategoryManagement());
    await act(async () => {
      await Promise.resolve();
    });
    expect(toast.error).toHaveBeenCalledWith('Network fail');
  });

  it('muestra toast genérico si el error no tiene mensaje', async () => {
    mockStore.fetchCategories.mockRejectedValueOnce({});
    renderHook(() => useCategoryManagement());
    await act(async () => {
      await Promise.resolve();
    });
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Error'));
  });

  it('filteredCategories refleja la lista del store', () => {
    mockStore.categories = SEED_CATEGORIES;
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));
    expect(result.current.filteredCategories).toEqual(SEED_CATEGORIES);
  });

  it('setSearchTerm filtra por nombre o descripción (case-insensitive)', () => {
    mockStore.categories = SEED_CATEGORIES;
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));

    act(() => result.current.setSearchTerm('lácte'));
    expect(result.current.filteredCategories).toEqual([SEED_CATEGORIES[1]]);

    act(() => result.current.setSearchTerm('ELECTR'));
    expect(result.current.filteredCategories).toEqual([SEED_CATEGORIES[0]]);

    act(() => result.current.setSearchTerm('no-match'));
    expect(result.current.filteredCategories).toEqual([]);
  });

  it('openCreate resetea selectedCategory y abre el drawer', () => {
    mockStore.categories = SEED_CATEGORIES;
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));

    act(() => result.current.openEdit(SEED_CATEGORIES[0]));
    expect(result.current.selectedCategory).toEqual(SEED_CATEGORIES[0]);
    expect(result.current.isDrawerOpen).toBe(true);

    act(() => result.current.openCreate());
    expect(result.current.selectedCategory).toBeNull();
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it('openEdit guarda la categoría seleccionada y abre el drawer', () => {
    mockStore.categories = SEED_CATEGORIES;
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));

    act(() => result.current.openEdit(SEED_CATEGORIES[1]));
    expect(result.current.selectedCategory).toEqual(SEED_CATEGORIES[1]);
    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.isDeleteDialogOpen).toBe(false);
  });

  it('openDelete guarda la categoría seleccionada y abre el AlertDialog', () => {
    mockStore.categories = SEED_CATEGORIES;
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));

    act(() => result.current.openDelete(SEED_CATEGORIES[2]));
    expect(result.current.selectedCategory).toEqual(SEED_CATEGORIES[2]);
    expect(result.current.isDeleteDialogOpen).toBe(true);
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it('handleSave en modo create llama a createCategory, cierra drawer, dispara onCreated', async () => {
    mockStore.categories = SEED_CATEGORIES;
    const onCreated = vi.fn();
    const { result } = renderHook(() =>
      useCategoryManagement({ autoFetch: false, onCreated })
    );

    act(() => result.current.openCreate());
    const created = { id: 99, name: 'Nueva', description: '', default_tax_rate_id: null, parent_id: null, is_active: true };
    await act(async () => {
      await result.current.handleSave(created);
    });

    expect(mockStore.createCategory).toHaveBeenCalledTimes(1);
    const callArg = mockStore.createCategory.mock.calls[0][0];
    expect(callArg).toMatchObject({
      name: 'Nueva',
      description: '',
      default_tax_rate_id: null,
      parent_id: null,
    });
    expect(callArg).not.toHaveProperty('is_active');
    expect(mockStore.updateCategory).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('cread'));
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 99 }));
    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.selectedCategory).toBeNull();
  });

  it('handleSave en modo create NO envía is_active al backend (la API lo rechaza en POST)', async () => {
    mockStore.categories = SEED_CATEGORIES;
    const { result } = renderHook(() =>
      useCategoryManagement({ autoFetch: false })
    );

    act(() => result.current.openCreate());
    await act(async () => {
      await result.current.handleSave({
        id: 0,
        name: 'Sin Activo',
        description: '',
        default_tax_rate_id: 1,
        parent_id: null,
        is_active: false,
      });
    });

    const callArg = mockStore.createCategory.mock.calls[0][0];
    expect(callArg.is_active).toBeUndefined();
  });

  it('handleSave en modo update llama a updateCategory y dispara onUpdated', async () => {
    mockStore.categories = SEED_CATEGORIES;
    const onUpdated = vi.fn();
    const { result } = renderHook(() =>
      useCategoryManagement({ autoFetch: false, onUpdated })
    );

    act(() => result.current.openEdit(SEED_CATEGORIES[0]));
    const values = { name: 'Renombrado', description: 'd', default_tax_rate_id: null, parent_id: null, is_active: true };

    await act(async () => {
      await result.current.handleSave(values);
    });

    expect(mockStore.updateCategory).toHaveBeenCalledWith(1, values);
    expect(mockStore.createCategory).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('actualizad'));
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Renombrado' }));
  });

  it('handleSave en modo update SÍ envía is_active (la API lo acepta en PUT)', async () => {
    mockStore.categories = SEED_CATEGORIES;
    const { result } = renderHook(() =>
      useCategoryManagement({ autoFetch: false })
    );

    act(() => result.current.openEdit(SEED_CATEGORIES[0]));
    await act(async () => {
      await result.current.handleSave({
        name: 'Cat',
        description: '',
        default_tax_rate_id: null,
        parent_id: null,
        is_active: false,
      });
    });

    const [, callArg] = mockStore.updateCategory.mock.calls[0];
    expect(callArg.is_active).toBe(false);
  });

  it('handleSave muestra toast de error si el store falla', async () => {
    mockStore.createCategory.mockRejectedValueOnce(new Error('Validation failed'));
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));

    act(() => result.current.openCreate());
    await act(async () => {
      await result.current.handleSave({ name: 'X', description: '', default_tax_rate_id: null, parent_id: null, is_active: true });
    });

    expect(toast.error).toHaveBeenCalledWith('Validation failed');
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it('confirmDelete llama a deleteCategory, dispara onDeleted y cierra el dialog', async () => {
    mockStore.categories = SEED_CATEGORIES;
    const onDeleted = vi.fn();
    const { result } = renderHook(() =>
      useCategoryManagement({ autoFetch: false, onDeleted })
    );

    act(() => result.current.openDelete(SEED_CATEGORIES[1]));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(mockStore.deleteCategory).toHaveBeenCalledWith(2);
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('eliminad'));
    expect(onDeleted).toHaveBeenCalledWith(2);
    expect(result.current.isDeleteDialogOpen).toBe(false);
    expect(result.current.selectedCategory).toBeNull();
  });

  it('confirmDelete retorna false si no hay categoría seleccionada', async () => {
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));
    let returned;
    await act(async () => {
      returned = await result.current.confirmDelete();
    });
    expect(returned).toBe(false);
    expect(mockStore.deleteCategory).not.toHaveBeenCalled();
  });

  it('confirmDelete muestra toast de error si el store falla', async () => {
    mockStore.deleteCategory.mockRejectedValueOnce(new Error('Cannot delete'));
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));

    act(() => result.current.openDelete(SEED_CATEGORIES[0]));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(toast.error).toHaveBeenCalledWith('Cannot delete');
    expect(result.current.isDeleteDialogOpen).toBe(true);
  });

  it('closeDrawer y closeDeleteDialog limpian el estado', () => {
    mockStore.categories = SEED_CATEGORIES;
    const { result } = renderHook(() => useCategoryManagement({ autoFetch: false }));

    act(() => {
      result.current.openEdit(SEED_CATEGORIES[0]);
      result.current.openDelete(SEED_CATEGORIES[1]);
    });
    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.isDeleteDialogOpen).toBe(true);
    expect(result.current.selectedCategory).not.toBeNull();

    act(() => result.current.closeDrawer());
    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.selectedCategory).toBeNull();

    act(() => {
      result.current.openDelete(SEED_CATEGORIES[0]);
      result.current.closeDeleteDialog();
    });
    expect(result.current.isDeleteDialogOpen).toBe(false);
    expect(result.current.selectedCategory).toBeNull();
  });
});
