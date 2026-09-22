/**
 * Tests de página: ProductSuppliersPage (#4 RF-BIPACK-024 — comparar
 * proveedores de un producto). Cobertura clave del contrato D3/D5: sort
 * default +last_unit_price y banner del meta excluded_other_currency.
 * Mock en la frontera del servicio; MemoryRouter; i18n real es.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductSuppliersPage from '../purchase-analytics/ProductSuppliersPage';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';

vi.mock('@/services/bi/relationalAnalyticsService', () => ({
  default: {
    getProductBuyers: vi.fn(),
    getCustomerTopProducts: vi.fn(),
    getSupplierTopProducts: vi.fn(),
    getProductSuppliers: vi.fn(),
  },
  relationalAnalyticsService: {
    getProductBuyers: vi.fn(),
    getCustomerTopProducts: vi.fn(),
    getSupplierTopProducts: vi.fn(),
    getProductSuppliers: vi.fn(),
  },
}));
vi.mock('@/services/productService', () => ({
  default: { search: vi.fn() },
  productService: { search: vi.fn() },
}));

const mockService = relationalAnalyticsService as unknown as {
  getProductSuppliers: ReturnType<typeof vi.fn>;
};

const suppliersEnvelope = (excluded: number) => ({
  success: true,
  data: {
    rows: [
      {
        supplier_id: 'SUPL-1',
        supplier_name: 'Distribuidora Sur',
        supplier_doc: '80012345-6',
        last_unit_price: 5_000,
        avg_unit_price: 5_250,
        min_unit_price: 4_800,
        currency: 'PYG',
        units: 120,
        purchases: 6,
        last_purchase_at: '2026-09-18T10:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    page_size: 10,
    excluded_other_currency: excluded,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockService.getProductSuppliers.mockResolvedValue(suppliersEnvelope(0));
});

describe('ProductSuppliersPage', () => {
  it('fetcha con el sort default del contrato (+last_unit_price)', async () => {
    render(
      <MemoryRouter initialEntries={['/purchase-analytics/products/suppliers?product_id=PRD-1']}>
        <ProductSuppliersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Distribuidora Sur')).toBeInTheDocument();
    expect(mockService.getProductSuppliers).toHaveBeenCalledWith(
      'PRD-1',
      expect.objectContaining({ sort: '+last_unit_price' }),
    );
    expect(screen.getByText(/5\.000/)).toBeInTheDocument();
    expect(screen.getByText('PYG')).toBeInTheDocument();
  });

  it('muestra el banner excluded_other_currency cuando hay compras fuera del ranking', async () => {
    mockService.getProductSuppliers.mockResolvedValue(suppliersEnvelope(2));

    render(
      <MemoryRouter initialEntries={['/purchase-analytics/products/suppliers?product_id=PRD-1']}>
        <ProductSuppliersPage />
      </MemoryRouter>,
    );

    const banner = await screen.findByTestId('excluded-other-currency-banner');
    expect(banner).toHaveTextContent(/2 compras en otra moneda/);
  });

  it('sin exclusiones no renderiza el banner', async () => {
    render(
      <MemoryRouter initialEntries={['/purchase-analytics/products/suppliers?product_id=PRD-1']}>
        <ProductSuppliersPage />
      </MemoryRouter>,
    );

    await screen.findByText('Distribuidora Sur');
    expect(screen.queryByTestId('excluded-other-currency-banner')).not.toBeInTheDocument();
  });

  it('sin product_id muestra el selector de producto', async () => {
    render(
      <MemoryRouter initialEntries={['/purchase-analytics/products/suppliers']}>
        <ProductSuppliersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Elegí Producto/i)).toBeInTheDocument();
    expect(mockService.getProductSuppliers).not.toHaveBeenCalled();
  });
});
