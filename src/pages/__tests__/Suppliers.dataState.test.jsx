import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock toast
const errorFrom = vi.fn();
const success = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toasts: [], errorFrom, success, error: vi.fn(), removeToast: vi.fn() })
}));

// telemetry stub
vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => ({})), endTimer: vi.fn(() => 0) } }));

// Provide a mutable store state used by mocked selector
let STORE_STATE = {};
vi.mock('@/store/useSupplierStore', () => ({
  __esModule: true,
  default: () => STORE_STATE
}));

// i18n simple
vi.mock('@/lib/i18n', () => ({ useI18n: () => ({ t: (k, vars) => {
  if (k === 'announce.results_for') return `Resultados: ${vars.total} para "${vars.term}"`;
  if (k === 'announce.total_results') return `Total resultados: ${vars.total}`;
  return k; } }) }));

import SuppliersPage from '@/pages/Suppliers.jsx';

describe('Suppliers DataState integrations', () => {
  afterEach(() => {
    STORE_STATE = {};
    vi.clearAllMocks();
  });

  test('shows loading DataState when store.loading is true', () => {
    STORE_STATE = {
      suppliers: [],
      loading: true,
      error: null,
      pagination: { current_page: 1, per_page: 10, total_pages: 0 },
      fetchSuppliers: vi.fn(),
      deleteSupplier: vi.fn(),
      clearSuppliers: vi.fn(),
    };
    render(<SuppliersPage />);
    const loadingState = screen.queryByTestId('suppliers-loading');
    expect(loadingState).toBeInTheDocument();
  });

  test('shows empty initial DataState when no suppliers and no searchTerm', () => {
    STORE_STATE = {
      suppliers: [],
      loading: false,
      error: null,
      pagination: { current_page: 1, per_page: 10, total_pages: 0 },
      fetchSuppliers: vi.fn(),
      deleteSupplier: vi.fn(),
      clearSuppliers: vi.fn(),
    };
    render(<SuppliersPage />);
    const emptyInitial = screen.queryByTestId('suppliers-empty-initial');
    expect(emptyInitial).toBeInTheDocument();
  });

  test('shows error DataState when store.error present', () => {
    STORE_STATE = {
      suppliers: [],
      loading: false,
      error: 'Fallo controlado en suppliers',
      pagination: { current_page: 1, per_page: 10, total_pages: 0 },
      fetchSuppliers: vi.fn(),
      deleteSupplier: vi.fn(),
      clearSuppliers: vi.fn(),
    };
    render(<SuppliersPage />);
    const err = screen.queryByTestId('suppliers-error');
    if (err) {
      expect(err).toBeInTheDocument();
    } else {
      expect(screen.getByText(/Fallo controlado en suppliers/)).toBeInTheDocument();
    }
  });
});
