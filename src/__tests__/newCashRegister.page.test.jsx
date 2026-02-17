/**
 * New Cash Register Page - MVP Tests
 * Tests corregidos para coincidir con la implementación real del componente.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewCashRegister from '../pages/NewCashRegister';

// Mock del store (Zustand compatible con React 19)
const mockStoreState = {
  activeCashRegister: null,
  isActiveCashRegisterLoading: false,
  activeCashRegisterError: null,
  isOpeningCashRegister: false,
  isClosingCashRegister: false,
  openCashRegister: vi.fn(),
  closeCashRegister: vi.fn(),
  getActiveCashRegister: vi.fn(),
};

vi.mock('@/store/useCashRegisterStore', () => ({
  useCashRegisterStore: (sel) => (typeof sel === 'function' ? sel(mockStoreState) : mockStoreState),
}));

vi.mock('@/store/useDashboardStore', () => ({
  default: () => ({
    fetchDashboardData: vi.fn(),
  }),
}));

// Mock de i18n con textos esperados por el componente real
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => {
      const trans = {
        'cashRegister.title': 'Gestión de Cajas Registradoras',
        'cashRegister.subtitle': 'Abre o cierra una caja para registrar los movimientos de efectivo.',
        'cashRegister.open.initialBalance': 'Saldo Inicial',
        'cashRegister.open.openingNotes': 'Notas de Apertura',
        'cashRegister.open.action': 'Abrir Caja',
        'action.cancel': 'Cancelar',
      };
      return trans[key] || fallback || key;
    },
  }),
}));

// Mock de hooks adicionales
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock de componentes UI para evitar problemas de Radix
vi.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} />
}));
vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props) => <textarea {...props} />
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>
}));

describe('NewCashRegister Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<NewCashRegister />);

    expect(screen.getByText('Gestión de Cajas Registradoras')).toBeInTheDocument();
    expect(screen.getByText('Abre o cierra una caja para registrar los movimientos de efectivo.')).toBeInTheDocument();
  });

  it('should render opening form fields by default', () => {
    render(<NewCashRegister />);

    // Verificamos campos clave del formulario de apertura
    expect(screen.getByText('Saldo Inicial')).toBeInTheDocument();
    expect(screen.getByText('Notas de Apertura')).toBeInTheDocument();
  });

  it('should render action buttons in opening form', () => {
    render(<NewCashRegister />);

    const openButton = screen.getByText('Abrir Caja', { selector: 'button' });
    const cancelButton = screen.getByText('Cancelar', { selector: 'button' });

    expect(openButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('should have correct CSS classes for BEM methodology', () => {
    const { container } = render(<NewCashRegister />);

    expect(container.querySelector('.new-cash-register-page')).toBeInTheDocument();
    expect(container.querySelector('.new-cash-register-page__header')).toBeInTheDocument();
    expect(container.querySelector('.new-cash-register-page__title')).toBeInTheDocument();
  });
});
