/**
 * New Cash Register Page - MVP Tests
 * Tests básicos siguiendo guía MVP
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewCashRegister from '../pages/NewCashRegister';

// Mock del store
vi.mock('@/store/useCashRegisterStore', () => ({
  useCashRegisterStore: () => ({
    activeCashRegister: null,
    isActiveCashRegisterLoading: false,
    activeCashRegisterError: null,
    isOpeningCashRegister: false,
    isClosingCashRegister: false,
    openCashRegister: vi.fn(),
    closeCashRegister: vi.fn(),
    getActiveCashRegister: vi.fn(),
  }),
}));

// Mock de i18n
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// Mock de componentes UI
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }) => <div data-testid="tabs" data-value={value}>{children}</div>,
  TabsList: ({ children }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }) => <button data-testid={`tab-trigger-${value}`}>{children}</button>,
  TabsContent: ({ children, value }) => <div data-testid={`tab-content-${value}`}>{children}</div>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ ...props }) => <input {...props} data-testid="input" />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ children }) => <div>{children}</div>,
  SelectTrigger: ({ children }) => <button>{children}</button>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ ...props }) => <textarea {...props} data-testid="textarea" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/DataState', () => ({
  default: ({ variant, title, message }) => (
    <div data-testid={`data-state-${variant}`}>
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
    </div>
  ),
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

  it('should render tabs for opening and closing cash register', () => {
    render(<NewCashRegister />);

    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByText('Abrir Caja')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Caja')).toBeInTheDocument();
  });

  it('should render opening form by default', () => {
    render(<NewCashRegister />);

    expect(screen.getByText('Abrir Nueva Caja Registradora')).toBeInTheDocument();
    expect(screen.getByText('Saldo Inicial')).toBeInTheDocument();
    expect(screen.getByText('Notas de Apertura')).toBeInTheDocument();
  });

  it('should render action buttons in opening form', () => {
    render(<NewCashRegister />);

    const openButton = screen.getByRole('button', { name: /Abrir Caja/i });
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });

    expect(openButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('should have correct CSS classes for BEM methodology', () => {
    const { container } = render(<NewCashRegister />);

    expect(container.querySelector('.new-cash-register-page')).toBeInTheDocument();
    expect(container.querySelector('.new-cash-register-page__header')).toBeInTheDocument();
    expect(container.querySelector('.new-cash-register-page__title')).toBeInTheDocument();
    expect(container.querySelector('.new-cash-register-page__subtitle')).toBeInTheDocument();
  });
});
