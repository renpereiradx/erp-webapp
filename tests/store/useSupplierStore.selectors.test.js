import { describe, it, expect, vi, beforeEach } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';

// Mock telemetry
vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn() } }));
// Mock service minimal (not used here)
vi.mock('@/services/supplierService', () => ({ supplierService: { getSuppliers: vi.fn() } }));

const selectors = () => useSupplierStore.getState().selectors;

describe('useSupplierStore selectors & misc state branches', () => {
  beforeEach(() => {
    // reset core state fields we mutate
    useSupplierStore.setState({
      cacheHits: 0,
      cacheMisses: 0,
      pageCache: {},
      pageCacheTTL: 60000,
      lastQuery: { page: 1, pageSize: 10, search: '' },
      circuitOpenHistory: [],
      autoRefetchOnReconnect: true,
      isOffline: false,
      offlineBannerShown: false,
    });
  });

  it('selectCircuitOpenPctLastHr computes percentage including open & closed intervals', () => {
    const now = Date.now();
    // One closed event within last hour (1s duration)
    // One closed event partially outside window (older) should partially count
    // One currently open event (no closedAt)
    const hourAgoPlusBit = now - 3600000 + 5000; // started 5s after window
    useSupplierStore.setState({
      circuitOpenHistory: [
        { openedAt: now - 1000, closedAt: now - 500 },
        { openedAt: hourAgoPlusBit, closedAt: hourAgoPlusBit + 2000 },
        { openedAt: now - 2000 } // still open
      ]
    });
    const pct = selectors().selectCircuitOpenPctLastHr(useSupplierStore.getState());
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThanOrEqual(1);
  });

  it('selectCurrentCacheMeta returns null ts when no cache and real ts when present', () => {
    // no cache case
    const metaEmpty = selectors().selectCurrentCacheMeta(useSupplierStore.getState());
    expect(metaEmpty.ts).toBeNull();
    // add cache entry
    const key = `__|1`;
    useSupplierStore.setState(s => ({ pageCache: { ...s.pageCache, [key]: { suppliers: [], pagination: {}, ts: 123456 } } }));
    const meta = selectors().selectCurrentCacheMeta(useSupplierStore.getState());
    expect(meta.ts).toBe(123456);
    expect(meta.halfTTL).toBe(30000); // half of 60000
  });

  it('setAutoRefetchOnReconnect toggles flag & records telemetry', async () => {
    const { telemetry } = await import('@/utils/telemetry');
    useSupplierStore.getState().setAutoRefetchOnReconnect(false);
    expect(useSupplierStore.getState().autoRefetchOnReconnect).toBe(false);
    expect(telemetry.record).toHaveBeenCalledWith('feature.suppliers.offline.auto_refetch.toggle', { enabled: false });
  });

  it('setIsOffline handles banner show/hide branches', async () => {
    const { telemetry } = await import('@/utils/telemetry');
    // go offline
    useSupplierStore.getState().setIsOffline(true);
    expect(useSupplierStore.getState().isOffline).toBe(true);
    expect(useSupplierStore.getState().offlineBannerShown).toBe(true);
    // go online
    useSupplierStore.getState().setIsOffline(false);
    expect(useSupplierStore.getState().isOffline).toBe(false);
    // Telemetry should have been called at least twice
    expect(telemetry.record.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
