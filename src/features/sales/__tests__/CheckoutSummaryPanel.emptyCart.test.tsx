/**
 * PLAN_RESERVAS_V2 F4 — el botón Cobrar con carrito vacío.
 *
 * Con el módulo de reservas activo (allowEmptyCart) el POS permite abrir el
 * wizard sin ítems (para elegir cliente y registrar un walk-in); con el módulo
 * apagado, el botón queda deshabilitado como siempre.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutSummaryPanel } from '../components/CheckoutSummaryPanel';

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

const baseProps = {
  subtotal: 0,
  taxBuckets: [],
  exento: 0,
  lineDiscounts: 0,
  generalDiscount: 0,
  total: 0,
  pendingTotal: null,
  newTotal: 0,
  branchMismatchWarning: false,
  finalPriceValue: 0,
  onFinalPriceChange: () => {},
  canEditFinalPrice: true,
  onCheckout: () => {},
  onClearCart: () => {},
  isProcessingSale: false,
  canWrite: true,
  mergeSaleId: null,
};

const getCheckoutButton = () =>
  screen.getByTestId('sales-checkout-button') as HTMLButtonElement;

describe('CheckoutSummaryPanel — carrito vacío (PLAN_RESERVAS_V2 F4)', () => {
  it('sin módulo de reservas, Cobrar queda deshabilitado con carrito vacío', () => {
    render(<CheckoutSummaryPanel {...baseProps} itemsCount={0} />);
    expect(getCheckoutButton().disabled).toBe(true);
  });

  it('con allowEmptyCart (módulo activo), Cobrar habilita y el banner guía al wizard', () => {
    render(<CheckoutSummaryPanel {...baseProps} itemsCount={0} allowEmptyCart />);
    expect(getCheckoutButton().disabled).toBe(false);
    expect(
      screen.getByText(/presioná Cobrar para elegir cliente/i),
    ).toBeInTheDocument();
  });

  it('con ítems en el carrito, Cobrar habilita sin importar el módulo', () => {
    render(<CheckoutSummaryPanel {...baseProps} itemsCount={2} />);
    expect(getCheckoutButton().disabled).toBe(false);
  });
});
