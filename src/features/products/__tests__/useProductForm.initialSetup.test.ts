/**
 * Precio/stock inicial al crear producto (RF quick-setup /products):
 *  - validación zod de initial_price / initial_stock
 *  - tras el alta se emiten ajuste de precio + transacción INITIAL del ledger
 *  - un fallo en la emisión NO revierte el alta: warning con detalle
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const mockCategoryStore = {
  categories: [{ id: 1, name: 'Genéricos', is_active: true }],
  loading: false,
  error: null,
  fetchCategories: vi.fn(),
};

const mockProductStore = {
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
};

const registerMovement = vi.fn().mockResolvedValue({});

vi.mock('@/store/useCategoryStore', () => ({
  default: () => mockCategoryStore,
}));

vi.mock('@/store/useProductStore', () => ({
  default: () => mockProductStore,
}));

// El hook sólo usa useStockMovementsStore.getState() (imperativo, sin hook).
vi.mock('@/store/useStockMovementsStore', () => ({
  useStockMovementsStore: { getState: () => ({ registerMovement }) },
}));

const createPriceAdjustment = vi.fn();
vi.mock('@/services/priceAdjustmentService', () => ({
  priceAdjustmentService: { createPriceAdjustment: (...args: unknown[]) => createPriceAdjustment(...args) },
}));

vi.mock('@/utils/currentUserId', () => ({
  currentUserId: () => 'user-1',
}));

// i18n: mockeado globalmente en vitest.setup (spyOn useI18n con firma real).

const successToast = vi.fn();
const warningToast = vi.fn();
const errorFromToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: successToast, warning: warningToast, errorFrom: errorFromToast, error: vi.fn() }),
}));

import { productSchema, useProductForm } from '@/features/products/hooks/useProductForm';

const VALID_BASE = {
  name: 'Café 1kg',
  category: '1',
  productType: 'PHYSICAL' as const,
  description: 'Café torrado',
  base_unit: 'unit',
  is_variable_measure: false,
  is_bookable: false,
};

describe('productSchema — validación de valores iniciales', () => {
  it('acepta vacíos (campos opcionales) y valores positivos con decimales', () => {
    expect(productSchema.safeParse({ ...VALID_BASE }).success).toBe(true);
    expect(productSchema.safeParse({ ...VALID_BASE, initial_price: '', initial_stock: '' }).success).toBe(true);
    expect(productSchema.safeParse({ ...VALID_BASE, initial_price: '25000', initial_stock: '10' }).success).toBe(true);
    expect(productSchema.safeParse({ ...VALID_BASE, initial_price: '25000.5', initial_stock: '2.5' }).success).toBe(true);
  });

  it('rechaza precio/stock inicial en 0 o negativo', () => {
    const zero = productSchema.safeParse({ ...VALID_BASE, initial_price: '0', initial_stock: '0' });
    expect(zero.success).toBe(false);
    expect(zero.success === false && zero.error.errors.map((e) => e.path[0])).toEqual(
      expect.arrayContaining(['initial_price', 'initial_stock']),
    );

    const neg = productSchema.safeParse({ ...VALID_BASE, initial_price: '-5', initial_stock: '-1' });
    expect(neg.success).toBe(false);
  });
});

describe('useProductForm — emisión de precio/stock inicial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerMovement.mockResolvedValue({});
    createPriceAdjustment.mockResolvedValue({ success: true });
    mockProductStore.createProduct.mockResolvedValue({ id: 'NEW01PRODUCT' });
  });

  const submit = async (result: { current: ReturnType<typeof useProductForm> }) => {
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as unknown as React.FormEvent);
    });
  };

  it('emite ajuste de precio + transacción INITIAL tras el alta', async () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} }),
    );

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        name: 'Café 1kg',
        category: '1',
        description: 'Café torrado',
        initial_price: '25000',
        initial_stock: '10',
      }));
    });

    await submit(result);

    expect(mockProductStore.createProduct).toHaveBeenCalledTimes(1);
    expect(createPriceAdjustment).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 'NEW01PRODUCT',
        new_price: 25000,
        unit: 'unit',
        reason: 'Precio inicial definido al crear el producto',
      }),
    );
    expect(registerMovement).toHaveBeenCalledTimes(1);
    const payload = registerMovement.mock.calls[0][0];
    expect(payload).toMatchObject({
      product_id: 'NEW01PRODUCT',
      transaction_type: 'INITIAL',
      reference_type: 'initial_stock',
      quantity_change: 10,
    });
    expect(successToast).toHaveBeenCalledTimes(1);
    expect(warningToast).not.toHaveBeenCalled();
  });

  it('sin valores iniciales no emite nada', async () => {
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} }),
    );

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        name: 'Café 1kg',
        category: '1',
        description: 'Café torrado',
      }));
    });

    await submit(result);

    expect(createPriceAdjustment).not.toHaveBeenCalled();
    expect(registerMovement).not.toHaveBeenCalled();
    expect(successToast).toHaveBeenCalledTimes(1);
  });

  it('un fallo del ajuste de precio NO revierte el alta: warning con detalle', async () => {
    createPriceAdjustment.mockResolvedValue({ success: false, error: 'boom' });
    const { result } = renderHook(() =>
      useProductForm({ product: null, isOpen: true, onClose: () => {} }),
    );

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        name: 'Café 1kg',
        category: '1',
        description: 'Café torrado',
        initial_price: '25000',
      }));
    });

    await submit(result);

    expect(mockProductStore.createProduct).toHaveBeenCalledTimes(1);
    expect(warningToast).toHaveBeenCalledTimes(1);
    expect(successToast).not.toHaveBeenCalled();
  });
});
