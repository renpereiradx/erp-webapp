/**
 * PriceAdjustmentDetail — page tests (alineación DESIGN.md 2026-09-29).
 * Cubre: render del precio actual canónico, formateo dinámico de miles en
 * el input de precio (moneyInput §6.4: 6000 → 6.000), validación de precio
 * y envío del ajuste con el valor canónico parseado.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PriceAdjustmentDetail from '../PriceAdjustmentDetail';

// Mock en la frontera del módulo consumido (store Zustand)
const storeState = vi.hoisted(() => ({ current: null }));
vi.mock('@/store/usePriceAdjustmentNewStore', () => ({
  default: () => storeState.current,
}));

vi.mock('@/store/useAuthStore', () => ({
  default: () => ({ activeBranch: null }),
}));

vi.mock('@/services/priceAdjustmentService', () => ({
  priceAdjustmentService: {
    getByDateRange: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/services/variantService', () => ({
  variantService: {
    getEnrichedVariants: vi.fn().mockResolvedValue([]),
  },
}));

const productFixture = {
  product_id: 'p1',
  sku: 'COC-2L',
  product_name: 'Coca Cola 2L',
  base_unit: 'unit',
  current_price: 5000,
  unit_prices: [
    { unit: 'unit', price_per_unit: 5000, updated_at: '2026-09-01T10:00:00Z' },
  ],
};

const buildStore = (overrides = {}) => ({
  selectedProduct: productFixture,
  creating: false,
  error: null,
  clearError: vi.fn(),
  createPriceAdjustment: vi.fn().mockResolvedValue({ success: true }),
  resetState: vi.fn(),
  ...overrides,
});

const renderPage = async () => {
  const view = render(
    <MemoryRouter>
      <PriceAdjustmentDetail />
    </MemoryRouter>
  );
  // Flushea la promesa de loadHistory (efecto de montaje) dentro de act
  await act(async () => {});
  return view;
};

const getPriceInput = () => screen.getByLabelText('Nuevo Precio (PYG)');

describe('PriceAdjustmentDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.current = buildStore();
  });

  it('muestra el producto y el precio actual canónico es-PY', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { name: 'Coca Cola 2L' })).toBeInTheDocument();
    expect(screen.getByText('Gs. 5.000')).toBeInTheDocument();
    expect(screen.getByText('SKU: COC-2L')).toBeInTheDocument();
  });

  it('formatea miles dinámicamente mientras se escribe: 6000 → 6.000 (§6.4)', async () => {
    await renderPage();

    const input = getPriceInput();
    fireEvent.change(input, { target: { value: '6000' } });
    expect(input.value).toBe('6.000');

    // El valor ya formateado se re-parsea sin ambigüedad (punto = miles)
    fireEvent.change(input, { target: { value: '6.000' } });
    expect(input.value).toBe('6.000');

    // Coma = decimal en es-PY: 6000,5 → 6.000,5
    fireEvent.change(input, { target: { value: '6000,5' } });
    expect(input.value).toBe('6.000,5');
  });

  it('muestra error de validación con precio vacío', async () => {
    await renderPage();

    const form = getPriceInput().closest('form');
    fireEvent.submit(form);

    expect(screen.getByText('Precio inválido')).toBeInTheDocument();
  });

  it('envía el ajuste con el valor canónico parseado (6.000 → 6000)', async () => {
    await renderPage();

    fireEvent.change(getPriceInput(), { target: { value: '6000' } });
    fireEvent.change(screen.getByLabelText('Plantilla de Razón'), {
      target: { value: 'MARKET_UPDATE' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Registrar Cambio/ }));

    await waitFor(() => {
      expect(storeState.current.createPriceAdjustment).toHaveBeenCalledTimes(1);
    });
    expect(storeState.current.createPriceAdjustment).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 'p1',
        new_price: 6000,
        unit: 'unit',
      })
    );
  });
});
