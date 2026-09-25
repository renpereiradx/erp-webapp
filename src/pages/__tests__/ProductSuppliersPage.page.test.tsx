/**
 * Tests de página: ProductSuppliersPage (#4 RF-BIPACK-024 — comparar
 * proveedores de un producto). Cobertura clave del contrato D3/D5: sort
 * default +last_unit_price y banner del meta excluded_other_currency.
 * Mock en la frontera del servicio; MemoryRouter; i18n real es. Incluye el
 * menú de acciones por fila: pivote a productos suministrados + copiar doc.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductSuppliersPage from '../purchase-analytics/ProductSuppliersPage';
import SupplierTopProductsPage from '../purchase-analytics/SupplierTopProductsPage';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';
import { productService } from '@/services/productService';

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
  default: { search: vi.fn(), searchAdvanced: vi.fn(), searchInfo: vi.fn() },
  productService: { search: vi.fn(), searchAdvanced: vi.fn(), searchInfo: vi.fn() },
}));

const mockService = relationalAnalyticsService as unknown as {
  getProductSuppliers: ReturnType<typeof vi.fn>;
  getSupplierTopProducts: ReturnType<typeof vi.fn>;
};

const mockProductService = productService as unknown as {
  searchAdvanced: ReturnType<typeof vi.fn>;
  searchInfo: ReturnType<typeof vi.fn>;
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
  mockService.getSupplierTopProducts.mockResolvedValue({
    success: true,
    data: {
      rows: [
        {
          product_id: 'PRD-9',
          product_name: 'Coca-Cola 2L',
          product_sku: 'SKU-COCA-2L',
          purchases: 14,
          units: 60,
          total: 4_500_000,
          avg_unit_price: 75_000,
          last_purchase_at: '2026-09-21T11:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      page_size: 10,
    },
  });
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

  it('el menú por fila muestra el último precio y pivota a productos suministrados', async () => {
    render(
      <MemoryRouter initialEntries={['/purchase-analytics/products/suppliers?product_id=PRD-1']}>
        <Routes>
          <Route path="/purchase-analytics/products/suppliers" element={<ProductSuppliersPage />} />
          <Route path="/purchase-analytics/suppliers/top-products" element={<SupplierTopProductsPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText('Distribuidora Sur');
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('drilldown-row-actions'));
    const menu = await screen.findByTestId('drilldown-row-menu');
    expect(within(menu).getByText('Doc: 80012345-6')).toBeInTheDocument();
    expect(within(menu).getByText('Último: Gs. 5.000 · 6 compras')).toBeInTheDocument();

    await userEvent.click(within(menu).getByTestId('drilldown-row-action-supplier-top'));
    await waitFor(() => {
      expect(mockService.getSupplierTopProducts).toHaveBeenCalledWith(
        'SUPL-1',
        expect.objectContaining({ sort: '-units', page: 1 }),
      );
    });
    expect(await screen.findByText('Coca-Cola 2L')).toBeInTheDocument();
  });

  it('Copiar documento escribe el RUC del proveedor en el portapapeles', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(
      <MemoryRouter initialEntries={['/purchase-analytics/products/suppliers?product_id=PRD-1']}>
        <ProductSuppliersPage />
      </MemoryRouter>,
    );
    await screen.findByText('Distribuidora Sur');

    await userEvent.click(screen.getByTestId('drilldown-row-actions'));
    await userEvent.click(screen.getByTestId('drilldown-row-action-copy-doc'));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('80012345-6');
    });
  });

  it('el picker plano muestra variante + SKU y elegir variante fetcha con variant_id', async () => {
    mockProductService.searchAdvanced.mockResolvedValue({
      products: [
        {
          id: 'PRD-1',
          name: 'Camiseta Adidas',
          variant_id: 'VAR-1',
          variant_name: 'Rojo M',
          sku: 'AD-R-M',
          current_price: 150_000,
          stock_quantity: 12,
          base_unit: 'unit',
          state: true,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/purchase-analytics/products/suppliers']}>
        <ProductSuppliersPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'adidas');
    expect(await screen.findByText('Camiseta Adidas · Rojo M')).toBeInTheDocument();
    expect(screen.getByText('SKU: AD-R-M')).toBeInTheDocument();
    expect(screen.queryByText(/Stock:/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Camiseta Adidas · Rojo M/ }));
    await waitFor(() => {
      expect(mockService.getProductSuppliers).toHaveBeenCalledWith(
        'PRD-1',
        expect.objectContaining({ variant_id: 'VAR-1', sort: '+last_unit_price' }),
      );
    });
  });
});
