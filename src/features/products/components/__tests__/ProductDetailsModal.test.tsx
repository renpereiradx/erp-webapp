import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ProductDetailsModal from '../ProductDetailsModal';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: () => true }),
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
  it('muestra la card de Precio de Venta priorizando la unidad base', () => {
    render(<ProductDetailsModal isOpen onClose={() => {}} product={product} />);

    const section = screen.getByText('Precio de Venta').closest('div.space-y-md') as HTMLElement;
    expect(section).not.toBeNull();
    // El precio destacado es el de la unidad base ('unit'), no el primero de la lista.
    expect(within(section).getByText('Gs. 72.800')).toBeTruthy();
    expect(within(section).getByText('por unit')).toBeTruthy();
    expect(within(section).queryByText('Gs. 732.200')).toBeNull();
  });

  it('centra el overlay sobre el área de contenido vía --erp-content-inset', () => {
    render(<ProductDetailsModal isOpen onClose={() => {}} product={product} />);

    const overlay = document.querySelector(
      '[data-testid="product-details-modal-overlay"]',
    ) as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.left).toBe('var(--erp-content-inset, 0px)');
  });

  it('no muestra la card de precio sin precios registrados', () => {
    render(
      <ProductDetailsModal
        isOpen
        onClose={() => {}}
        product={{ ...product, unit_prices: [] }}
      />,
    );

    expect(screen.queryByText('Precio de Venta')).toBeNull();
  });
});
