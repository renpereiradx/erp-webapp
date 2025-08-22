import { describe, it, expect, vi, beforeEach } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';

vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn() } }));
vi.mock('@/services/supplierService', () => ({ supplierService: { getSuppliers: vi.fn(), createSupplier: vi.fn(), updateSupplier: vi.fn(), deleteSupplier: vi.fn() } }));

import { supplierService } from '@/services/supplierService';
import { telemetry } from '@/utils/telemetry';

const rec = () => telemetry.record;

function resetCore() {
  useSupplierStore.setState({
    suppliers: [],
    pageCache: {},
    cacheHits: 0,
    cacheMisses: 0,
    lastQuery: { page: 1, pageSize: 10, search: '' },
    circuit: { openUntil: 0, failures: 0, threshold: 4, cooldownMs: 30000 },
    circuitOpen: false
  });
  vi.clearAllMocks();
}

describe('useSupplierStore extra coverage paths', () => {
  beforeEach(() => resetCore());

  it('forceRefetch borra cache y vuelve a llamar API', async () => {
    supplierService.getSuppliers.mockResolvedValue({ success: true, data: { data: [{ id: 1 }], pagination: { current_page: 1, per_page: 10, total_pages: 1, total: 1 } } });
    await useSupplierStore.getState().fetchSuppliers(1,10,'');
    const calls1 = supplierService.getSuppliers.mock.calls.length;
    await useSupplierStore.getState().forceRefetch(1,10,'');
    expect(supplierService.getSuppliers.mock.calls.length).toBeGreaterThan(calls1);
  });

  it('_invalidatePages elimina claves y emite telemetry', async () => {
    // seed cache
    useSupplierStore.setState(s => ({ pageCache: { ...s.pageCache, '__|1': { suppliers: [], pagination: {}, ts: Date.now() }, '__|2': { suppliers: [], pagination: {}, ts: Date.now() } } }));
    const removed = useSupplierStore.getState()._invalidatePages('',1,1,'test');
    expect(removed.length).toBeGreaterThan(0);
    expect(rec().mock.calls.map(c=>c[0])).toContain('feature.suppliers.cache.invalidate');
  });

  it('_trimPageCache recorta y emite telemetry', () => {
    // older timestamps first
    const now = Date.now();
    const entries = {};
    for(let i=1;i<=5;i++) entries[`__|${i}`] = { suppliers: [], pagination: {}, ts: now - i }; // ensure order
    useSupplierStore.setState({ pageCache: entries });
    useSupplierStore.getState()._trimPageCache(3);
    expect(Object.keys(useSupplierStore.getState().pageCache).length).toBeLessThanOrEqual(3);
    expect(rec().mock.calls.map(c=>c[0])).toContain('feature.suppliers.cache.trim');
  });

  it('prefetch skip path when next page already cached', async () => {
    supplierService.getSuppliers.mockResolvedValue({ success: true, data: { data: [{ id: 1 }], pagination: { current_page: 1, per_page: 10, total_pages: 2, total: 2 } } });
    // seed next page
    useSupplierStore.setState(s => ({ pageCache: { ...s.pageCache, '__|2': { suppliers: [], pagination: {}, ts: Date.now() } } }));
    await useSupplierStore.getState().fetchSuppliers(1,10,'');
    expect(rec().mock.calls.map(c=>c[0])).toContain('feature.suppliers.prefetch.skip');
  });

  it('prefetch error path when next page fetch falla', async () => {
    let call = 0;
    supplierService.getSuppliers.mockImplementation(async () => {
      call++;
      if (call === 1) return { success: true, data: { data: [{ id: 1 }], pagination: { current_page: 1, per_page: 10, total_pages: 2, total: 20 } } };
      throw new Error('fail prefetch');
    });
    await useSupplierStore.getState().fetchSuppliers(1,10,'');
    // poll hasta que aparezca algún evento de prefetch (success/skip/error) o timeout
    const deadline = Date.now() + 300;
    let events;
    while (Date.now() < deadline) {
      events = rec().mock.calls.map(c=>c[0]);
      if (events.some(e => e.startsWith('feature.suppliers.prefetch.'))) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 15));
    }
    const prefetchEvents = events.filter(e => e.startsWith('feature.suppliers.prefetch.'));
    expect(prefetchEvents.length).toBeGreaterThan(0);
    // debe haber error o skip(failed)
    expect(prefetchEvents).toEqual(expect.arrayContaining(['feature.suppliers.prefetch.error']));
  });

  it('offline/online window events emiten telemetry y cambian estado', () => {
    window.dispatchEvent(new Event('offline'));
    expect(useSupplierStore.getState().isOffline).toBe(true);
    window.dispatchEvent(new Event('online'));
    expect(useSupplierStore.getState().isOffline).toBe(false);
    const evs = telemetry.record.mock.calls.map(c=>c[0]);
    expect(evs).toContain('app.offline');
    expect(evs).toContain('app.online');
  });
});
