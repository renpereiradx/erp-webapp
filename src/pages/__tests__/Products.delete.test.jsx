import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';

// Mock toast
const success = vi.fn();
const errorFrom = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toasts: [], success, errorFrom, error: vi.fn(), removeToast: vi.fn() })
}));

// Spy de telemetry
const recordSpy = vi.fn();
vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: (...args) => recordSpy(...args),
    startTimer: vi.fn(() => ({ id: 't' })),
    endTimer: vi.fn(() => 0),
  },
}));

// Mock ProductGrid para exponer un botón que dispare onDelete
vi.mock('@/features/products/components/ProductGrid', () => ({
  __esModule: true,
  default: ({ products, onDelete }) => (
    <button onClick={() => onDelete(products[0])}>OPEN_DELETE</button>
  )
}));

// Mock DeleteProductModal: confirma automáticamente al abrirse
vi.mock('@/components/DeleteProductModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, product }) => {
    if (isOpen) {
      // Simular confirm inmediato al abrir
      onConfirm(product);
    }
    return null;
  }
}));

// Mock modales restantes para no interferir
vi.mock('@/components/ProductModal', () => ({ default: () => null }));
vi.mock('@/components/ProductDetailModal', () => ({ default: () => null }));

// Mock del store de productos
const deleteProduct = vi.fn(async () => true);
vi.mock('@/store/useProductStore', () => ({
  __esModule: true,
  default: (sel) => sel({
    products: [{ id: 'p1', name: 'Prod 1', is_active: true, category_id: 1 }],
    loading: false,
    error: null,
    totalProducts: 1,
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    categories: [{ id: 1, name: 'Cat' }],
    lastSearchTerm: '',
    fetchCategories: vi.fn(),
    searchProducts: vi.fn(),
    loadPage: vi.fn(),
    changePageSize: vi.fn(),
    clearProducts: vi.fn(),
    deleteProduct,
    clearError: vi.fn(),
  })
}));

import Products from '@/pages/Products.jsx';

describe('Products delete flow', () => {
  it('emite products.delete.success y muestra toast al eliminar', async () => {
    const { getByText } = render(<Products />);

  // Abrir el modal de eliminación a través del grid mockeado (el modal auto-confirma)
  fireEvent.click(getByText('OPEN_DELETE'));

  await waitFor(() => {
      expect(deleteProduct).toHaveBeenCalledWith('p1');
      expect(recordSpy).toHaveBeenCalledWith('products.delete.success', { id: 'p1' });
      expect(success).toHaveBeenCalled();
    });
  });
});
