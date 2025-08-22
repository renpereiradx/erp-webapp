import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toasts: [], errorFrom: vi.fn(), success: vi.fn(), error: vi.fn(), removeToast: vi.fn() }) }));
vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => ({})), endTimer: vi.fn(() => 0) } }));
vi.mock('@/lib/i18n', () => ({ useI18n: () => ({ t: (k) => k === 'errors.hint.NETWORK' ? 'Verifica tu conexión a internet.' : k }) }));

let STORE_STATE = {};
vi.mock('@/store/useSupplierStore', () => ({ __esModule: true, default: (sel) => {
  const base = STORE_STATE;
  return typeof sel === 'function' ? sel(base) : base; } }));

import SuppliersPage from '@/pages/Suppliers.jsx';

describe('Suppliers error hint integration', () => {
  it('muestra hint traducido junto al error cuando lastErrorHintKey presente', async () => {
    STORE_STATE = {
      suppliers: [],
      loading: false,
      error: 'Fallo de red suppliers',
      pagination: {},
      lastErrorHintKey: 'errors.hint.NETWORK',
      fetchSuppliers: vi.fn(),
      deleteSupplier: vi.fn(),
      clearSuppliers: vi.fn(),
      selectors: { selectCurrentCacheMeta: () => ({ ageMs: null, stale: false }), selectCircuitOpenPctLastHr: () => 0 },
      lastQuery: { page: 1, pageSize: 10, search: '' },
      forceRefetch: vi.fn(),
      isOffline: false,
      offlineBannerShown: false,
      autoRefetchOnReconnect: true,
      setAutoRefetchOnReconnect: vi.fn(),
      cacheHits: 0,
      cacheMisses: 0,
      retryCount: 0,
      circuit: { failures: 0, openUntil: 0 },
      circuitOpen: false,
      circuitOpenCount: 0,
      circuitTotalOpenDurationMs: 0,
      pageCacheTTL: 60000,
      pageCache: {}
    };
    await act(async () => { render(<SuppliersPage />); });
    await waitFor(() => {
      const err = screen.getByTestId('suppliers-error');
      expect(err.textContent).toMatch(/Fallo de red suppliers/);
      expect(err.textContent).toMatch(/Verifica tu conexión a internet\./);
    });
  });
});
