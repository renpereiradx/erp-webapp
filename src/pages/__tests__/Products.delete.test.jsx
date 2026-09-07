import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, waitFor, screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils';

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

// Mock react-router-dom
const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

// Barrel real de la feature con ProductFormModal stub funcional (desde él se
// dispara la baja) y ProductDetailsModal stub (llama useAuth en render).
vi.mock('@/features/products', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    ProductDetailsModal: () => null,
    ProductFormModal: ({ isOpen, onClose, product }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="mock-product-form">
          <button
            onClick={async () => {
              // Simula lo que hace el ProductFormModal real: llama al store,
              // registra telemetría y cierra el modal.
              const store = (await import('@/store/useProductStore')).default;
              const state = typeof store === 'function' ? store() : store.getState?.() || {};
              await state.deleteProduct(product.product_id || product.id);

              const { telemetry } = await import('@/utils/telemetry');
              telemetry.record('products.delete.success', { id: product.product_id || product.id });

              onClose();
            }}
            data-testid="delete-btn"
          >
            DELETE_PRODUCT
          </button>
        </div>
      );
    },
  };
});

// Mock del store de productos
const deleteProduct = vi.fn(async () => true);
const fetchProductsPaginated = vi.fn();
const fetchCategories = vi.fn();

const MOCK_STORE = {
  products: [{ id: 'p1', product_id: 'p1', name: 'Prod 1', product_name: 'Prod 1', is_active: true, category_id: 1 }],
  loading: false,
  error: null,
  totalProducts: 1,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  categories: [{ id: 1, name: 'Cat' }],
  filters: { category: 'all', status: 'all' },
  lastSearchTerm: '',
  fetchCategories,
  fetchProductsPaginated,
  fetchProducts: vi.fn(),
  searchProducts: vi.fn(),
  setCurrentPage: vi.fn(),
  setFilters: vi.fn(),
  clearError: vi.fn(),
  deleteProduct,
};

vi.mock('@/store/useProductStore', () => ({
  __esModule: true,
  default: (sel) => (typeof sel === 'function' ? sel(MOCK_STORE) : MOCK_STORE)
}));

import Products from '@/pages/Products';

// PLAN_CATALOGO_VENDEDOR 3.4: ProductsHeader/ProductDetailsModal/ProductsTable
// consumen useAuth (gates products:write / products:cost).
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true, hasAnyPermission: () => true })
}));

describe('Products delete flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre el modal de edición y permite eliminar', async () => {
    renderWithTheme(<Products />);

    // Abrir modal de edición
    const editBtn = screen.getByTestId('edit-product-p1');
    fireEvent.click(editBtn);

    // Click en borrar (dentro del modal mockeado)
    const deleteBtn = screen.getByTestId('delete-btn');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteProduct).toHaveBeenCalledWith('p1');
      expect(recordSpy).toHaveBeenCalledWith('products.delete.success', { id: 'p1' });
      // El refresh debe ser llamado al cerrar el modal
      expect(fetchProductsPaginated).toHaveBeenCalled();
    });
  });
});
