import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductDetailsModal from '../ProductDetailsModal';

const biState = vi.hoisted(() => ({ enabled: true }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
  useBiPackEnabled: () => biState.enabled,
}));

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallbackOrVars?: unknown, vars?: Record<string, unknown>) => {
      let template = typeof fallbackOrVars === 'string' ? fallbackOrVars : key;
      const resolved = (fallbackOrVars && typeof fallbackOrVars === 'object' ? fallbackOrVars : vars) as
        | Record<string, unknown>
        | undefined;
      if (resolved) {
        for (const [k, v] of Object.entries(resolved)) {
          template = template.replace(new RegExp(`\\{+${k}\\}+`, 'g'), String(v));
        }
      }
      return template;
    },
  }),
}));

vi.mock('@/services/variantService', () => ({
  variantService: { getEnrichedVariants: vi.fn(() => Promise.resolve([])) },
}));

vi.mock('@/features/products/components/ProductHistoryModals', () => ({
  ProductPriceHistoryDialog: () => null,
  ProductCostHistoryDialog: () => null,
  ProductPriceAdjustmentDialog: () => null,
  ProductCostAdjustmentDialog: () => null,
}));

vi.mock('@/components/modals/VariantsManagerModal', () => ({
  VariantsManagerModal: () => null,
}));

const product = {
  product_id: 'Cc2y5JnvR',
  product_name: 'CAMISETA ADIDAS',
  base_unit: 'unit',
  stock_quantity: 20,
  unit_prices: [
    { id: 1, unit: 'doc', price_per_unit: 732200 },
    { id: 2, unit: 'unit', price_per_unit: 72800 },
  ],
  financial_health: { has_prices: true, has_costs: true, has_stock: true },
};

describe('ProductDetailsModal', () => {
  beforeEach(() => {
    biState.enabled = true;
  });

  it('muestra la card de Precio de Venta priorizando la unidad base', () => {
    render(<MemoryRouter><ProductDetailsModal isOpen onClose={() => {}} product={product} /></MemoryRouter>);

    const section = screen.getByText('Precio de Venta').closest('div.space-y-md') as HTMLElement;
    expect(section).not.toBeNull();
    // El precio destacado es el de la unidad base ('unit'), no el primero de la lista.
    expect(within(section).getByText('Gs. 72.800')).toBeTruthy();
    expect(within(section).getByText('por unit')).toBeTruthy();
    expect(within(section).queryByText('Gs. 732.200')).toBeNull();
  });

  it('centra el overlay sobre el área de contenido vía --erp-content-inset', () => {
    render(<MemoryRouter><ProductDetailsModal isOpen onClose={() => {}} product={product} /></MemoryRouter>);

    const overlay = document.querySelector(
      '[data-testid="product-details-modal-overlay"]',
    ) as HTMLElement;
    expect(overlay).not.toBeNull();
    // Cadena con fallback: sin --erp-overlay-inset (full-screen opt-in de los
    // modales apilados), el offset sigue viniendo de --erp-content-inset.
    expect(overlay.style.left).toBe('var(--erp-overlay-inset, var(--erp-content-inset, 0px))');
  });

  it('no muestra la card de precio sin precios registrados', () => {
    render(
      <MemoryRouter>
        <ProductDetailsModal
          isOpen
          onClose={() => {}}
          product={{ ...product, unit_prices: [] }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Precio de Venta')).toBeNull();
  });

  it('F3: los pivotes BI navegan al drill-down y cierran la ficha', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path='/'
            element={<ProductDetailsModal isOpen onClose={onClose} product={product} />}
          />
          <Route
            path='/sales-analytics/products/buyers'
            element={<div>RUTA_COMPRADORES</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('product-details-bi-buyers'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('RUTA_COMPRADORES')).toBeTruthy();
  });

  it('F3: sin pack BI los pivotes no se renderizan', () => {
    biState.enabled = false;
    render(
      <MemoryRouter>
        <ProductDetailsModal isOpen onClose={() => {}} product={product} />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('product-details-bi-buyers')).toBeNull();
    expect(screen.queryByTestId('product-details-bi-suppliers')).toBeNull();
  });
});
