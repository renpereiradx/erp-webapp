import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { waitFor, cleanup } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils.jsx';
import { MemoryRouter } from 'react-router-dom';

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

vi.mock('@/store/useSupplierDirectoryStore', () => ({
  __esModule: true,
  default: (fn) => {
    const state = {
      suppliers: [],
      searchResults: [],
      loading: false,
      error: 'Fallo en suppliers',
      searchSuppliers: vi.fn(),
      clearError: vi.fn(),
      deleteSupplier: vi.fn(),
      reactivateSupplier: vi.fn(),
      refreshAfterMutation: vi.fn(),
    };
    return typeof fn === 'function' ? fn(state) : state;
  },
}));

import SuppliersPage from '@/pages/Suppliers.jsx';

describe('SuppliersPage toasts y telemetría', () => {
  it('emite toast de error y telemetría cuando el store expone error', async () => {
    const { unmount } = renderWithTheme(
      <MemoryRouter>
        <SuppliersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(recordSpy).toHaveBeenCalledWith('suppliers.error.store', { message: 'Fallo en suppliers' });
    });

    unmount();
    cleanup();
  });
});
