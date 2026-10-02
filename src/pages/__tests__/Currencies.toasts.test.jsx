/**
 * CurrenciesPage — toasts y telemetría ante estados de la API.
 *
 * El mock del store debe ser ESTABLE entre renders (una única instancia del
 * estado y de sus vi.fn). Un mock que fabrica estado nuevo en cada llamada
 * cambia la identidad de las funciones del store en cada render, dispara
 * efectos en bucle y agota el heap del worker (OOM "Worker exited
 * unexpectedly"): los stores reales de Zustand devuelven referencias
 * estables y el mock debe imitarlas.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor, cleanup, screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils';
import { MemoryRouter } from 'react-router-dom';

const stableStoreState = vi.hoisted(() => ({
  currencies: [],
  loading: false,
  error: 'Fallo en monedas',
  searchTerm: '',
  setSearchTerm: vi.fn(),
  fetchCurrencies: vi.fn(() => Promise.reject(new Error('Fallo en monedas'))),
  createCurrency: vi.fn(() => Promise.resolve({ id: 1 })),
  updateCurrency: vi.fn(() => Promise.resolve({ id: 1 })),
  getFilteredCurrencies: vi.fn(() => []),
}));

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  errorFrom: vi.fn(),
  removeToast: vi.fn(),
}));

vi.mock('@/store/useCurrencyStore', () => ({
  __esModule: true,
  default: () => stableStoreState,
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    success: toastSpies.success,
    error: toastSpies.error,
    warning: toastSpies.warning,
    errorFrom: toastSpies.errorFrom,
    removeToast: toastSpies.removeToast,
  }),
}));

const recordSpy = vi.fn();
vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: (...args) => recordSpy(...args),
    startTimer: vi.fn(() => ({ id: 't' })),
    endTimer: vi.fn(() => 0),
  },
}));

import CurrenciesPage from '@/pages/Currencies';

const renderPage = () =>
  renderWithTheme(
    <MemoryRouter>
      <CurrenciesPage />
    </MemoryRouter>
  );

describe('CurrenciesPage toasts y telemetría', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('emite toast de error y telemetría cuando el store expone error', async () => {
    stableStoreState.error = 'Fallo en monedas';
    stableStoreState.fetchCurrencies.mockImplementation(() =>
      Promise.reject(new Error('Fallo en monedas'))
    );

    const { unmount } = renderPage();

    await waitFor(() => {
      expect(toastSpies.errorFrom).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(recordSpy).toHaveBeenCalledWith('currencies.error.store', { message: 'Fallo en monedas' });
    });

    unmount();
    cleanup();
  });

  it('emite toast de éxito al crear una moneda', async () => {
    stableStoreState.error = null;
    stableStoreState.fetchCurrencies.mockImplementation(() => Promise.resolve([]));

    const { unmount } = renderPage();

    // El texto existe en toolbar y en el empty-state: usar el primero (toolbar).
    const createButtons = screen.getAllByRole('button', { name: /agregar nueva moneda/i });
    fireEvent.click(createButtons[0]);
    fireEvent.change(document.getElementById('currency_name'), {
      target: { value: 'Dólar Estadounidense' },
    });
    fireEvent.change(document.getElementById('currency_code'), {
      target: { value: 'USD' },
    });
    fireEvent.submit(document.getElementById('currency-form'));

    await waitFor(() => {
      expect(stableStoreState.createCurrency).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toastSpies.success).toHaveBeenCalledWith('Moneda creada exitosamente');
    });

    unmount();
    cleanup();
  });
});
