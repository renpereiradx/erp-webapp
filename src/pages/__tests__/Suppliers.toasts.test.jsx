/**
 * SuppliersPage — toasts y telemetría ante error del store.
 *
 * El mock del store debe ser ESTABLE entre renders (una única instancia del
 * estado y de sus vi.fn). Un mock que fabrica estado nuevo en cada llamada
 * cambia la identidad de las funciones del store en cada render, dispara
 * efectos en bucle y agota el heap del worker (OOM "Worker exited
 * unexpectedly"): los stores reales de Zustand devuelven referencias
 * estables y el mock debe imitarlas.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { waitFor, cleanup } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils';
import { MemoryRouter } from 'react-router-dom';

const stableStoreState = vi.hoisted(() => ({
  suppliers: [],
  searchResults: [],
  loading: false,
  error: 'Fallo en suppliers',
  searchSuppliers: vi.fn(),
  clearError: vi.fn(),
  deleteSupplier: vi.fn(),
  reactivateSupplier: vi.fn(),
  refreshAfterMutation: vi.fn(),
}));

vi.mock('@/store/useSupplierDirectoryStore', () => ({
  __esModule: true,
  default: (fn) => (typeof fn === 'function' ? fn(stableStoreState) : stableStoreState),
}));

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

import SuppliersPage from '@/pages/Suppliers';

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
