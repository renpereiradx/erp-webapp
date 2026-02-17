import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils.jsx';
import { vi } from 'vitest';

// Mock toast
const errorFrom = vi.fn();
const success = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toasts: [], errorFrom, success, error: vi.fn(), removeToast: vi.fn() })
}));

// Mock feature flag hook to hide metrics panel
vi.mock('@/hooks/useFeatureFlag', () => ({
  useFeatureFlag: () => [false]
}));

// Mock lazy modals to avoid rendering
vi.mock('@/components/ProductModal', () => ({ default: () => null }));
vi.mock('@/components/ProductDetailModal', () => ({ default: () => null }));
vi.mock('@/components/DeleteProductModal', () => ({ default: () => null }));

// telemetry stub
vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => ({})), endTimer: vi.fn(() => 0) } }));

// Provide a mutable store state used by mocked selector
let STORE_STATE = {};
vi.mock('@/store/useProductStore', () => ({
  __esModule: true,
  default: (sel) => (typeof sel === 'function' ? sel(STORE_STATE) : STORE_STATE)
}));

import Products from '@/pages/Products.jsx';

describe('Products DataState integrations', () => {
  afterEach(() => {
    STORE_STATE = {};
    vi.clearAllMocks();
  });

  test('shows loading DataState when store.loading is true', () => {
    STORE_STATE = {
      products: [],
      loading: true,
      error: null,
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

  renderWithTheme(<Products />);
    const loadingById = screen.queryByTestId('products-loading');
    if (loadingById) {
      expect(loadingById).toBeInTheDocument();
    } else {
      // Fallback to legacy loading markup
      expect(screen.getByText(/Cargando productos\.|Loading products\.{0,1}/i)).toBeInTheDocument();
    }
  });

  test('shows empty initial DataState when no products and no lastSearchTerm', () => {
    STORE_STATE = {
      products: [],
      loading: false,
      error: null,
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

  renderWithTheme(<Products />);
    const emptyInitial = screen.queryByTestId('products-empty-initial') || screen.queryByTestId('empty-initial');
    expect(emptyInitial).toBeInTheDocument();
  });

  test('shows empty search DataState when no products but lastSearchTerm present', () => {
    STORE_STATE = {
      products: [],
      loading: false,
      error: null,
      totalProducts: 0,
      currentPage: 1,
      totalPages: 0,
      pageSize: 10,
      categories: [],
      lastSearchTerm: 'abc',
      fetchCategories: vi.fn(),
      searchProducts: vi.fn(),
      loadPage: vi.fn(),
      changePageSize: vi.fn(),
      clearProducts: vi.fn(),
      deleteProduct: vi.fn(),
      clearError: vi.fn(),
    };

  renderWithTheme(<Products />);
    const emptySearch = screen.queryByTestId('products-empty-search') || screen.queryByTestId('empty-search');
    expect(emptySearch).toBeInTheDocument();
  });

  test('shows error DataState when store.error is present', () => {
    STORE_STATE = {
      products: [],
      loading: false,
      error: 'Fallo controlado en productos',
      totalProducts: 0,
      currentPage: 1,
      totalPages: 0,
      pageSize: 10,
      categories: [],
      lastSearchTerm: '',
      lastErrorCode: 'NETWORK',
      lastErrorHintKey: null,
      fetchCategories: vi.fn(),
      searchProducts: vi.fn(),
      loadPage: vi.fn(),
      changePageSize: vi.fn(),
      clearProducts: vi.fn(),
      deleteProduct: vi.fn(),
      clearError: vi.fn(),
    };

  renderWithTheme(<Products />);
    const err = screen.queryByTestId('error-main');
    if (err) {
      expect(err).toBeInTheDocument();
    } else {
      // fallback: the component may announce the error via aria-live region
      expect(screen.getByText(/Fallo controlado en productos/)).toBeInTheDocument();
    }
  });
});
