/**
 * PLAN_RESERVAS_V2 F4 — gate del paso Pago con carrito vacío.
 *
 * El wizard puede ABRIRSE sin ítems (walk-in: cliente + reserva desde el paso
 * Reservas), pero el paso Pago no avanza sin ítems y muestra la guía. Los
 * pasos hijos se stubbean por módulo (regla de tests: mock en la frontera).
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SaleCheckoutWizard } from '../components/SaleCheckoutWizard';

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      let out = fallback ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
      }
      return out;
    },
  }),
}));

vi.mock('@/store/useBusinessConfigStore', () => ({
  useReservationsEnabled: () => true,
}));

vi.mock('@/contexts/BranchContext', () => ({
  useBranch: () => ({ currentBranchId: 1 }),
}));

vi.mock('@/services/saleService', () => ({
  saleService: {
    calculateLocalTotals: () => ({ subtotal: 0, discount_total: 0, tax_amount: 0, total: 0 }),
  },
}));

vi.mock('@/features/sales/hooks/useCheckoutShortcuts', () => ({
  useCheckoutShortcuts: () => 'F12',
}));

// Los factories de vi.mock se hoistean: los stubs deben construirse DENTRO
// de cada factory (regla de un solo objeto por mock, sin referencias a
// constantes externas).
vi.mock('../components/steps/ClientStep', () => {
  const ClientStep = () => <div data-testid="step-client" />;
  return { ClientStep };
});
vi.mock('../components/steps/PendingSalesStep', () => {
  const PendingSalesStep = () => <div data-testid="step-pending" />;
  return { PendingSalesStep };
});
vi.mock('../components/steps/ReservationsStep', () => {
  const ReservationsStep = () => <div data-testid="step-reservations" />;
  return { ReservationsStep };
});
vi.mock('../components/steps/PaymentStep', () => {
  const PaymentStep = () => <div data-testid="step-payment" />;
  return { PaymentStep };
});
vi.mock('../components/steps/CollectionStep', () => {
  const CollectionStep = () => <div data-testid="step-collection" />;
  return { CollectionStep };
});

const noop = () => {};
const baseProps = {
  isOpen: true,
  onClose: noop,
  items: [] as unknown[],
  getItemLineTotal: () => 0,
  client: { id: 'c1', name: 'Cliente' },
  onClientSelect: noop,
  onClearClient: noop,
  activeSales: [],
  onContinueSale: noop,
  onNewSale: noop,
  counterOrders: [],
  onContinueOrder: async () => true,
  pendingReservations: [],
  selectedResIds: new Set<number>(),
  onToggleReservation: noop,
  onAddReservations: noop,
  formatDateTime: () => '—',
  blockedProductIds: new Set<string>(),
  onRegisterWalkIn: async () => true,
  paymentMethods: [{ id: 1, name: 'Efectivo' }],
  paymentMethodId: 1,
  setPaymentMethodId: noop,
  currencies: [{ id: 1, code: 'PYG', is_base: true }],
  currencyId: 1,
  setCurrencyId: noop,
  onConfirm: async () => {},
  onLeavePending: async () => {},
  isProcessingSale: false,
};

const getPrimary = () => screen.getByTestId('wizard-primary-action') as HTMLButtonElement;

// Cliente → Reservas → Pago (dos Avanzar).
const advanceToPayment = () => {
  fireEvent.click(getPrimary()); // client → reservations
  fireEvent.click(getPrimary()); // reservations → payment
};

describe('SaleCheckoutWizard — gate del paso Pago (PLAN_RESERVAS_V2 F4)', () => {
  it('sin ítems, el paso Pago bloquea Avanzar y muestra la guía', () => {
    render(<SaleCheckoutWizard {...baseProps} />);
    advanceToPayment();

    expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    expect(getPrimary().disabled).toBe(true);
    expect(screen.getByText(/No hay ítems para cobrar/i)).toBeInTheDocument();
  });

  it('con ítems (p. ej. la reserva walk-in registrada), el paso Pago avanza', () => {
    render(
      <SaleCheckoutWizard
        {...baseProps}
        items={[{ id: 'RES-1', name: 'Cancha 01 — 1h', quantity: 1, price: 50000 }]}
      />,
    );
    advanceToPayment();

    expect(screen.getByTestId('step-payment')).toBeInTheDocument();
    expect(getPrimary().disabled).toBe(false);
    expect(screen.queryByText(/No hay ítems para cobrar/i)).not.toBeInTheDocument();
  });
});
