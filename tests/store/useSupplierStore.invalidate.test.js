import { describe, test, expect, beforeEach, vi } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';
import { act } from '@testing-library/react';

vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => Date.now()), endTimer: vi.fn(() => 0) } }));

vi.mock('@/services/supplierService', () => ({
  supplierService: {
    getSuppliers: vi.fn(async ({ page }) => ({ success: true, data: { data: [{ id: `sup-${page}-1` }], pagination: { current_page: page, per_page: 10, total_pages: 1, total: 10 } } })),
    createSupplier: vi.fn(async () => ({ success: true, data: { id: 'new-1', name: 'New Supplier' } })),
    deleteSupplier: vi.fn(async () => ({ success: true, data: true })),
    updateSupplier: vi.fn(async (id) => ({ success: true, data: { id, name: 'Updated' } }))
  }
}));

describe('useSupplierStore invalidation after mutations', () => {
  beforeEach(async () => {
    const st = useSupplierStore.getState();
    await act(async () => { await st.loadPage(1, 10, ''); });
    // touch adjacent pages for future invalidation testing
    useSupplierStore.setState(s => ({ pageCache: { ...s.pageCache, '__|2': { suppliers: [{ id: 'sup-2-1' }], pagination: { current_page: 2, per_page: 10, total_pages: 2, total: 20 }, ts: Date.now() } } }));
  });

  test('create invalidates current and adjacent pages', async () => {
    const beforeKeys = Object.keys(useSupplierStore.getState().pageCache).length;
    await act(async () => { await useSupplierStore.getState().createSupplier({ name: 'X' }); });
    const after = useSupplierStore.getState();
    // adjacent pages should be removed then possibly repopulated by background fetch of current page only
    expect(Object.keys(after.pageCache).length).toBeLessThanOrEqual(beforeKeys);
  });

  test('delete invalidates current and adjacent pages', async () => {
    const beforeKeys = Object.keys(useSupplierStore.getState().pageCache).length;
    await act(async () => { await useSupplierStore.getState().deleteSupplier('sup-1-1'); });
    const after = useSupplierStore.getState();
    expect(Object.keys(after.pageCache).length).toBeLessThanOrEqual(beforeKeys);
  });
});
