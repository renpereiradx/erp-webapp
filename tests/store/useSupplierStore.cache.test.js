import { describe, test, expect, beforeEach, vi } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';
import { act } from '@testing-library/react';
import { telemetry } from '@/utils/telemetry';

// Mock telemetry to avoid errors
vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => Date.now()), endTimer: vi.fn(() => 0) } }));
// Mock service
vi.mock('@/services/supplierService', () => ({ supplierService: { getSuppliers: vi.fn(async ({ page }) => ({ success: true, data: { data: [{ id: `sup-${page}-1`, name: `Supplier ${page}` }], pagination: { current_page: page, per_page: 10, total_pages: 3, total: 30 } } })) } }));

describe('useSupplierStore cache + retry metrics', () => {
  beforeEach(() => {
    // Reset store state between tests
    const { getState, setState } = useSupplierStore;
    const initial = getState();
    setState({
      suppliers: [],
      pageCache: {},
      cacheHits: 0,
      cacheMisses: 0,
      retryCount: 0,
      pagination: {},
      lastQuery: { page: 1, pageSize: 10, search: '' }
    });
    vi.clearAllMocks();
  });

  test('records cache miss then hit on subsequent loadPage with telemetry', async () => {
    const state = useSupplierStore.getState();
    await act(async () => { await state.loadPage(1, 10, ''); });
    expect(useSupplierStore.getState().cacheMisses).toBe(1);
    await act(async () => { await state.loadPage(1, 10, ''); });
    expect(useSupplierStore.getState().cacheHits).toBe(1);
    const events = telemetry.record.mock.calls.map(c => c[0]);
    expect(events).toContain('feature.suppliers.cache.miss');
    expect(events).toContain('feature.suppliers.cache.hit');
  });

  test('prefetch sets next page in cache', async () => {
    const st = useSupplierStore.getState();
    await act(async () => { await st.loadPage(1, 10, ''); });
    const nextKey = `__|2`;
    expect(useSupplierStore.getState().pageCache[nextKey]).toBeTruthy();
  });
});
