/**
 * NewCashRegister (/caja-registradora) — page tests.
 * Matches the current feature-sliced implementation: thin shell over
 * @/features/cash-register with Precision Air token classes.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewCashRegister from '../pages/NewCashRegister';

// Mock del store (Zustand compatible con React 19 y selectors)
const mockStoreState = {
  activeCashRegister: null,
  activeCashRegisterError: null,
  isActiveCashRegisterLoading: false,
  isOpeningCashRegister: false,
  isClosingCashRegister: false,
  openCashRegister: vi.fn(),
  closeCashRegister: vi.fn(),
  getActiveCashRegister: vi.fn(),
  getCashRegisters: vi.fn(),
  getMovements: vi.fn(),
  getAudits: vi.fn(),
};

vi.mock('@/store/useCashRegisterStore', () => ({
  useCashRegisterStore: (sel) => (typeof sel === 'function' ? sel(mockStoreState) : mockStoreState),
}));

vi.mock('@/store/useDashboardStore', () => ({
  default: (sel) =>
    typeof sel === 'function'
      ? sel({ fetchDashboardData: vi.fn() })
      : { fetchDashboardData: vi.fn() },
}));

// El componente usa los fallbacks en español de t(key, fallback)
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <NewCashRegister />
    </MemoryRouter>
  );
}

describe('NewCashRegister Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page header and tabs without crashing', () => {
    renderPage();

    expect(screen.getByText('Caja')).toBeInTheDocument();
    expect(screen.getByText('Jornada de caja')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Apertura de caja' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cierre de caja' })).toBeInTheDocument();
  });

  it('should render opening form fields by default', () => {
    renderPage();

    expect(screen.getByText(/Nombre identificador/)).toBeInTheDocument();
    expect(screen.getByText(/Ubicación/)).toBeInTheDocument();
    expect(screen.getByText(/Fondo inicial de maniobra/)).toBeInTheDocument();
    expect(screen.getByText(/Notas de auditoría/)).toBeInTheDocument();
  });

  it('should render action buttons in opening form', () => {
    renderPage();

    expect(screen.getByText('Abrir Caja', { selector: 'button' })).toBeInTheDocument();
    expect(screen.getByText('Limpiar', { selector: 'button' })).toBeInTheDocument();
  });

  it('should render informative empty state in the status card when no session is active', () => {
    renderPage();

    expect(screen.getByText('Sin terminal activa')).toBeInTheDocument();
  });

  it('should switch to the close panel and show the no-terminal empty state', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('tab', { name: 'Cierre de caja' }));

    expect(screen.getByText('No hay terminal activa')).toBeInTheDocument();
    expect(screen.getByText('Ir a Apertura', { selector: 'button' })).toBeInTheDocument();
  });

  it('should use Precision Air layout tokens (bg-background canvas, surface card, tablist role)', () => {
    const { container } = renderPage();

    expect(container.querySelector('.bg-background')).toBeInTheDocument();
    expect(container.querySelector('.bg-surface.rounded-md.shadow-whisper')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Apertura de caja' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
