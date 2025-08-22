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
  default: (sel) => {
    const base = STORE_STATE;
    return typeof sel === 'function' ? sel(base) : base;
  }
}));

// i18n simple
vi.mock('@/lib/i18n', () => ({ useI18n: () => ({ t: (k, vars) => {
  if (k === 'announce.results_for') return `Resultados: ${vars.total} para "${vars.term}"`;
  if (k === 'announce.total_results') return `Total resultados: ${vars.total}`;
  return k; } }) }));

import SuppliersPage from '@/pages/Suppliers.jsx';

function baseState(overrides) {
  return {
    suppliers: [],
    loading: false,
    error: null,
    pagination: { current_page: 1, per_page: 10, total_pages: 0 },
    fetchSuppliers: vi.fn(),
    deleteSupplier: vi.fn(),
    clearSuppliers: vi.fn(),
    cacheHits: 0,
    cacheMisses: 0,
    retryCount: 0,
    circuit: { failures: 0, openUntil: 0 },
    circuitOpen: false,
    circuitOpenCount: 0,
    circuitTotalOpenDurationMs: 0,
    lastQuery: { page: 1, pageSize: 10, search: '' },
    pageCacheTTL: 60000,
    pageCache: {},
    selectors: { selectCurrentCacheMeta: () => ({ ageMs: null, stale: false }), selectCircuitOpenPctLastHr: () => 0 },
    forceRefetch: vi.fn(),
    isOffline: false,
    offlineBannerShown: false,
    autoRefetchOnReconnect: true,
    setAutoRefetchOnReconnect: vi.fn(),
    ...overrides
  };
}

describe('Suppliers DataState integrations', () => {
  afterEach(() => {
    STORE_STATE = {};
    vi.clearAllMocks();
  });

  test('shows loading DataState when store.loading is true', () => {
    STORE_STATE = baseState({ loading: true });
    render(<SuppliersPage />);
    const loadingState = screen.queryByTestId('suppliers-loading');
    expect(loadingState).toBeInTheDocument();
  });

  test('shows empty initial DataState when no suppliers and no searchTerm', () => {
    STORE_STATE = baseState();
    render(<SuppliersPage />);
    const emptyInitial = screen.queryByTestId('suppliers-empty-initial');
    expect(emptyInitial).toBeInTheDocument();
  });

  test('shows error DataState when store.error present', () => {
    STORE_STATE = baseState({ error: 'Fallo controlado en suppliers' });
    render(<SuppliersPage />);
    const err = screen.queryByTestId('suppliers-error');
    if (err) {
      expect(err).toBeInTheDocument();
    } else {
      expect(screen.getByText(/Fallo controlado en suppliers/)).toBeInTheDocument();
    }
  });
});
