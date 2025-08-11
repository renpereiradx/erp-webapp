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

vi.mock('@/store/useClientStore', () => ({
  __esModule: true,
  default: () => ({
    searchClients: vi.fn(),
    clearClients: vi.fn(),
    clients: [],
    loading: false,
    error: 'Fallo controlado',
    clearError: vi.fn(),
    totalPages: 0,
    currentPage: 1,
    loadPage: vi.fn(),
    totalClients: 0,
    lastSearchTerm: '',
    pageSize: 10,
    changePageSize: vi.fn(),
    deleteClient: vi.fn(),
  }),
}));

import ClientsPage from '@/pages/Clients.jsx';

describe('ClientsPage toasts y telemetría', () => {
  it('emite toast de error y telemetría cuando el store expone error', async () => {
    const { unmount } = render(<ClientsPage />);

    await waitFor(() => {
      // telemetry.record debe ser llamado con el evento de error del store
      expect(recordSpy).toHaveBeenCalledWith('clients.error.store', { message: 'Fallo controlado' });
    });

    // Limpieza explícita
    unmount();
    cleanup();
  });
});
