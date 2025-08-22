import { describe, test, expect, beforeEach, vi } from 'vitest';
import useSupplierStore from '@/store/useSupplierStore';
import { act } from '@testing-library/react';

vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(() => Date.now()), endTimer: vi.fn(() => 0) } }));

vi.mock('@/services/supplierService', () => ({
  supplierService: {
    getSuppliers: vi.fn(async () => ({ success: false, error: 'Network error simulated' })),
  }
}));

describe('useSupplierStore offline snapshot + flags', () => {
  beforeEach(() => {
    // jsdom localStorage already available
    const { setState } = useSupplierStore;
    setState({ suppliers: [{ id: 'a', name: 'Cached Supplier' }], lastOfflineSnapshot: null, isOffline: false });
  });

  test('sets isOffline and persists snapshot on network failure', async () => {
    const st = useSupplierStore.getState();
    await act(async () => { await st.fetchSuppliers(1, 10, ''); });
    const ns = useSupplierStore.getState();
    expect(ns.isOffline).toBe(true);
    const raw = window.localStorage.getItem('suppliers_last_offline_snapshot');
    expect(raw).toBeTruthy();
  });
});
