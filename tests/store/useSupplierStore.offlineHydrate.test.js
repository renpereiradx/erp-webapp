import { describe, test, expect, vi, beforeEach } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';
import { act } from '@testing-library/react';

vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => Date.now()), endTimer: vi.fn(() => 0) } }));

// Mock service to first succeed then fail (simulate offline after first fetch)
let call = 0;
vi.mock('@/services/supplierService', () => ({
  supplierService: {
    getSuppliers: vi.fn(async () => {
      call += 1;
      if (call === 1) return { success: true, data: [{ id: 's1', name: 'Supplier One' }] };
      return { success: false, error: 'Network fail simulated' };
    })
  }
}));

import { supplierService } from '@/services/supplierService';

describe('useSupplierStore offline hydrate flow', () => {
  beforeEach(() => {
    call = 0;
    window.localStorage.clear();
    useSupplierStore.setState({ suppliers: [], pageCache: {}, isOffline: false, lastOfflineSnapshot: null });
  });

  test('persists snapshot then hydrates from storage when hydrateFromStorage called', async () => {
    // Initial online fetch
    await act(async () => { await useSupplierStore.getState().fetchSuppliers(1, 10, ''); });
    expect(useSupplierStore.getState().suppliers.length).toBe(1);

    // Next call fails -> triggers offline snapshot persistence
    await act(async () => { await useSupplierStore.getState().fetchSuppliers(1, 10, ''); });
    expect(useSupplierStore.getState().isOffline).toBe(true);
    const raw = window.localStorage.getItem('suppliers_last_offline_snapshot');
    expect(raw).toBeTruthy();

    // Clear live suppliers to simulate reload scenario
    useSupplierStore.setState({ suppliers: [] });
    // Hydrate
    const hydrated = useSupplierStore.getState().hydrateFromStorage();
    expect(hydrated).toBeTruthy();
    expect(useSupplierStore.getState().suppliers.length).toBe(1);
  });
});
