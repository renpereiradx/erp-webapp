import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, cleanup, act } from '@testing-library/react';

vi.mock('@/hooks/useToast', () => {
  const errorFrom = vi.fn();
  const success = vi.fn();
  return {
    useToast: () => ({
      toasts: [],
      success,
      error: vi.fn(),
      errorFrom,
      removeToast: vi.fn(),
    }),
  };
});

const recordSpy = vi.fn();
vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: (...args) => recordSpy(...args),
    startTimer: vi.fn(() => ({ id: 't' })),
    endTimer: vi.fn(() => 0),
  },
}));

let STORE_STATE;
vi.mock('@/store/useSupplierStore', () => ({
  __esModule: true,
  default: (sel) => {
    if (!STORE_STATE) {
      STORE_STATE = {
        suppliers: [],
        loading: false,
        error: 'Fallo en suppliers',
        pagination: { current_page: 1, per_page: 10, total_pages: 0 },
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
    }
    return typeof sel === 'function' ? sel(STORE_STATE) : STORE_STATE;
  }
}));

import SuppliersPage from '@/pages/Suppliers.jsx';

describe('SuppliersPage toasts y telemetría', () => {
  it('emite toast de error y telemetría feature.suppliers.error cuando el store expone error', async () => {
    let unmount;
    await act(async () => { ({ unmount } = render(<SuppliersPage />)); });
    await waitFor(() => {
      const match = recordSpy.mock.calls.find(c => c[0] === 'feature.suppliers.error' && c[1]?.op === 'store');
      expect(match).toBeTruthy();
      expect(match[1]).toEqual(expect.objectContaining({ message: 'Fallo en suppliers', hint: 'errors.hint.NETWORK' }));
    });
    unmount();
    cleanup();
  });
});
