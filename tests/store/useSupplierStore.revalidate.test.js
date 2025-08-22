import { describe, test, expect, vi, beforeEach } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';
import { act } from '@testing-library/react';

vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => Date.now()), endTimer: vi.fn(() => 0) } }));
vi.mock('@/services/supplierService', () => ({
  supplierService: {
    getSuppliers: vi.fn(async ({ page }) => ({ success: true, data: { data: [{ id: `sup-${page}-1`, name: `Supplier ${page}` }], pagination: { current_page: page, per_page: 10, total_pages: 1, total: 10 } } }))
  }
}));

import { telemetry } from '@/utils/telemetry';
import { supplierService } from '@/services/supplierService';

// Helper to manipulate cache entry timestamp
function ageCacheEntry(key, ms) {
  const st = useSupplierStore.getState();
  if (st.pageCache[key]) st.pageCache[key].ts = Date.now() - ms;
}

describe('useSupplierStore background revalidation', () => {
  beforeEach(() => {
    useSupplierStore.setState({ suppliers: [], pageCache: {}, cacheHits: 0, cacheMisses: 0, pageCacheTTL: 60000, lastQuery: { page: 1, pageSize: 10, search: '' } });
    vi.clearAllMocks();
  });

  test('stale (>TTL/2) triggers background revalidate telemetry', async () => {
    await act(async () => { await useSupplierStore.getState().loadPage(1, 10, ''); });
    const key = '__|1';
    // Age entry to just over half TTL (TTL default 60000 -> >30000)
    ageCacheEntry(key, 31000);
    await act(async () => { await useSupplierStore.getState().loadPage(1, 10, ''); });
    // Expect a cache hit + stale detected + revalidate success (async may run after a tick)
    const events = telemetry.record.mock.calls.map(c => c[0]);
    expect(events).toContain('feature.suppliers.cache.hit');
    expect(events).toContain('feature.suppliers.cache.stale.detected');
    // Allow microtasks to flush prefetch / revalidate promise
    await new Promise(r => setTimeout(r, 10));
    const events2 = telemetry.record.mock.calls.map(c => c[0]);
    expect(events2).toContain('feature.suppliers.cache.revalidate.success');
  });
});
