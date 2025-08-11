import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';

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

vi.mock('@/store/useSupplierStore', () => ({
  __esModule: true,
  default: () => ({
    suppliers: [],
    loading: false,
    error: 'Fallo en suppliers',
    pagination: { current_page: 1, per_page: 10, total_pages: 0 },
    fetchSuppliers: vi.fn(),
    deleteSupplier: vi.fn(),
    clearSuppliers: vi.fn(),
  }),
}));

import SuppliersPage from '@/pages/Suppliers.jsx';

describe('SuppliersPage toasts y telemetría', () => {
  it('emite toast de error y telemetría cuando el store expone error', async () => {
    const { unmount } = render(<SuppliersPage />);

    await waitFor(() => {
      expect(recordSpy).toHaveBeenCalledWith('suppliers.error.store', { message: 'Fallo en suppliers' });
    });

    unmount();
    cleanup();
  });
});
