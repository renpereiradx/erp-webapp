import { describe, test, expect, vi, beforeEach } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';
import { act } from '@testing-library/react';

vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => Date.now()), endTimer: vi.fn(() => 0) } }));

let callCount = 0;
vi.mock('@/services/supplierService', () => ({
  supplierService: {
    getSuppliers: vi.fn(async ({ page }) => {
      callCount += 1;
      // Fail only for page 2 first time to simulate prefetch failure path
      if (page === 2 && callCount === 2) { // first call page1, second attempt prefetch page2
        return { success: false, error: 'Prefetch simulated failure' };
      }
      return { success: true, data: { data: [{ id: `sup-${page}-1`, name: `Supplier ${page}` }], pagination: { current_page: page, per_page: 10, total_pages: 3, total: 30 } } };
    })
  }
}));

import { telemetry } from '@/utils/telemetry';
import { supplierService } from '@/services/supplierService';

describe('useSupplierStore prefetch skip reasons', () => {
  beforeEach(() => {
    callCount = 0;
    useSupplierStore.setState({ suppliers: [], pageCache: {}, cacheHits: 0, cacheMisses: 0, lastQuery: { page: 1, pageSize: 10, search: '' } });
    vi.clearAllMocks();
  });

  async function waitFor(predicate, timeout = 600, interval = 25) {
    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (predicate()) return true;
      if (Date.now() - start > timeout) return false;
      await new Promise(r => setTimeout(r, interval));
    }
  }

  test('records prefetch skip reason failed then cached', async () => {
    // First uncached load triggers fetch + background prefetch
    await act(async () => { await useSupplierStore.getState().loadPage(1, 10, ''); });
    const gotFailed = await waitFor(() => telemetry.record.mock.calls.some(c => c[0] === 'feature.suppliers.prefetch.skip' && c[1]?.reason === 'failed'));
    expect(gotFailed).toBe(true);

    // Manually add page 2 to cache to force cached skip next time prefetch runs
    const now = Date.now();
    useSupplierStore.setState(s => ({ pageCache: { ...s.pageCache, '__|2': { suppliers: [{ id: 'sup-2-1', name: 'Supplier 2' }], pagination: { current_page: 2, per_page: 10, total_pages: 3, total: 30 }, ts: now } } }));

    // Clear telemetry calls for second phase
    telemetry.record.mockClear();
    // Remove page1 from cache so that fetchSuppliers runs again (else loadPage would short-circuit and not prefetch)
    useSupplierStore.setState(s => { const pc = { ...s.pageCache }; delete pc['__|1']; return { pageCache: pc }; });

    // Trigger fetch again (can use loadPage or fetchSuppliers directly)
    await act(async () => { await useSupplierStore.getState().loadPage(1, 10, ''); });

    const gotCached = await waitFor(() => telemetry.record.mock.calls.some(c => c[0] === 'feature.suppliers.prefetch.skip' && c[1]?.reason === 'cached'));
    expect(gotCached).toBe(true);
  });
});
