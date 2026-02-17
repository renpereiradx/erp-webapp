import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils.jsx';

// Mock toast
const errorFrom = vi.fn();
const success = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toasts: [], errorFrom, success, error: vi.fn(), removeToast: vi.fn() })
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

// Mock modales lazy
vi.mock('@/components/ProductModal', () => ({ default: () => null }));
vi.mock('@/components/ProductDetailModal', () => ({ default: () => null }));
vi.mock('@/components/DeleteProductModal', () => ({ default: () => null }));

// Caso 1: error en store
const MOCK_STORE_STATE = {
  products: [],
  loading: false,
  error: 'Fallo controlado en productos',
  totalProducts: 0,
  currentPage: 1,
  totalPages: 0,
  pageSize: 10,
  categories: [],
  lastSearchTerm: '',
  fetchCategories: vi.fn(),
  searchProducts: vi.fn(),
  loadPage: vi.fn(),
  changePageSize: vi.fn(),
  clearProducts: vi.fn(),
  deleteProduct: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('@/store/useProductStore', () => ({
  __esModule: true,
  default: (sel) => (typeof sel === 'function' ? sel(MOCK_STORE_STATE) : MOCK_STORE_STATE)
}));

import Products from '@/pages/Products.jsx';

describe('Products telemetry', () => {
  it('registra products.error.store y muestra toast ante error de store', async () => {
  renderWithTheme(<Products />);
    await waitFor(() => {
      expect(recordSpy).toHaveBeenCalledWith('products.error.store', { message: 'Fallo controlado en productos' });
    });
    expect(errorFrom).toHaveBeenCalled();
  });
});
