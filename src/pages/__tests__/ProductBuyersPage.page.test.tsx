/**
 * Tests de página: ProductBuyersPage (#1 RF-BIPACK-021 — compradores de un
 * producto). Mock en la frontera del servicio; i18n real (namespace bi.*
 * registrado síncrono en vitest.setup); MemoryRouter para useSearchParams.
 * Cobertura: selector sin id, fetch + filas + paginación, draft-vs-applied
 * de la búsqueda, sort por encabezado, error con reintento y el menú de
 * acciones por fila (datos informativos, pivote al análisis del cliente,
 * copiar documento).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductBuyersPage from '../sales-analytics/ProductBuyersPage';
import CustomerTopProductsPage from '../sales-analytics/CustomerTopProductsPage';
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
  getProductBuyers: ReturnType<typeof vi.fn>;
  getCustomerTopProducts: ReturnType<typeof vi.fn>;
};

const mockProductService = productService as unknown as {
  searchAdvanced: ReturnType<typeof vi.fn>;
  searchInfo: ReturnType<typeof vi.fn>;
};

const buyersEnvelope = {
  success: true,
  data: {
    rows: [
      {
        client_id: 'CLI-1',
        client_name: 'Maria Gomez',
        client_doc: '1234567',
        purchases: 3,
        units: 9,
        total: 1_500_000,
        avg_unit_price: 166_667,
        last_purchase_at: '2026-09-20T12:00:00Z',
      },
    ],
    total: 12,
    page: 1,
    page_size: 10,
  },
};

const topProductsEnvelope = {
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
    total: 4,
    page: 1,
    page_size: 10,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockService.getProductBuyers.mockResolvedValue(buyersEnvelope);
  mockService.getCustomerTopProducts.mockResolvedValue(topProductsEnvelope);
});
describe('ProductBuyersPage', () => {
  it('sin product_id muestra el selector de producto y no fetcha', async () => {
    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Elegí Producto/i)).toBeInTheDocument();
    expect(mockService.getProductBuyers).not.toHaveBeenCalled();
  });

  it('con product_id fetcha con el sort default del contrato y pagina', async () => {
    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers?product_id=PRD-1']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Maria Gomez')).toBeInTheDocument();
    expect(mockService.getProductBuyers).toHaveBeenCalledWith(
      'PRD-1',
      expect.objectContaining({ sort: '-total', page: 1, page_size: 10 }),
    );
    expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2 (12 items)')).toBeInTheDocument();
  });

  it('tipear la búsqueda no fetcha; Aplicar sí (draft-vs-applied)', async () => {
    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers?product_id=PRD-1']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );
    await screen.findByText('Maria Gomez');
    expect(mockService.getProductBuyers).toHaveBeenCalledTimes(1);

    await userEvent.type(
      screen.getByLabelText('Buscar por nombre o documento...'),
      'gomez',
    );
    expect(mockService.getProductBuyers).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    await waitFor(() => {
      expect(mockService.getProductBuyers).toHaveBeenLastCalledWith(
        'PRD-1',
        expect.objectContaining({ q: 'gomez', page: 1 }),
      );
    });
  });

  it('el encabezado Total alterna el sort (+total tras el default -total)', async () => {
    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers?product_id=PRD-1']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );
    await screen.findByText('Maria Gomez');

    await userEvent.click(screen.getByRole('button', { name: /^Total/ }));
    await waitFor(() => {
      expect(mockService.getProductBuyers).toHaveBeenLastCalledWith(
        'PRD-1',
        expect.objectContaining({ sort: '+total' }),
      );
    });
  });

  it('error muestra el estado y Reintentar refetcha', async () => {
    mockService.getProductBuyers
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(buyersEnvelope);

    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers?product_id=PRD-1']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('No se pudieron cargar los datos.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Maria Gomez')).toBeInTheDocument();
  });

  it('el menú por fila muestra datos informativos y pivota al análisis del cliente', async () => {
    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers?product_id=PRD-1']}>
        <Routes>
          <Route path="/sales-analytics/products/buyers" element={<ProductBuyersPage />} />
          <Route path="/sales-analytics/customers/top-products" element={<CustomerTopProductsPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText('Maria Gomez');

    await userEvent.click(screen.getByTestId('drilldown-row-actions'));
    const menu = await screen.findByTestId('drilldown-row-menu');
    expect(within(menu).getByText('Doc: 1234567')).toBeInTheDocument();
    expect(within(menu).getByText(/9 uds\. · 3 compras · Gs\. 1\.500\.000/)).toBeInTheDocument();

    await userEvent.click(within(menu).getByTestId('drilldown-row-action-customer-top'));
    await waitFor(() => {
      expect(mockService.getCustomerTopProducts).toHaveBeenCalledWith(
        'CLI-1',
        expect.objectContaining({ sort: '-units', page: 1 }),
      );
    });
    expect(await screen.findByText('Coca-Cola 2L')).toBeInTheDocument();
  });

  it('Copiar documento escribe el documento de la fila en el portapapeles', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers?product_id=PRD-1']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );
    await screen.findByText('Maria Gomez');

    await userEvent.click(screen.getByTestId('drilldown-row-actions'));
    await userEvent.click(screen.getByTestId('drilldown-row-action-copy-doc'));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('1234567');
    });
  });

  it('el picker muestra filas planas informativas (variante, SKU, stock, precio)', async () => {
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
        {
          id: 'PRD-2',
          name: 'Remera Lisa',
          variant_id: null,
          variant_name: null,
          sku: 'REM-1',
          current_price: 80_000,
          stock_quantity: 0,
          base_unit: 'unit',
          state: true,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Buscar...'), 'adidas');
    expect(await screen.findByText('Camiseta Adidas · Rojo M')).toBeInTheDocument();
    expect(screen.getByText('SKU: AD-R-M')).toBeInTheDocument();
    expect(screen.getByText('Stock: 12 unit')).toBeInTheDocument();
    expect(screen.getByText(/Gs\. 150\.000/)).toBeInTheDocument();
    expect(screen.getByText('Remera Lisa')).toBeInTheDocument();
    expect(screen.getByText('Stock: 0 unit')).toBeInTheDocument();
    expect(mockProductService.searchAdvanced).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'adidas', granularity: 'variant' }),
    );
  });

  it('elegir una variante en el picker fetcha con variant_id', async () => {
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
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Buscar...'), 'adidas');
    await userEvent.click(await screen.findByRole('option', { name: /Camiseta Adidas · Rojo M/ }));
    await waitFor(() => {
      expect(mockService.getProductBuyers).toHaveBeenCalledWith(
        'PRD-1',
        expect.objectContaining({ variant_id: 'VAR-1' }),
      );
    });
  });

  it('elegir la fila base (sin variante) fetcha solo con product_id', async () => {
    mockProductService.searchAdvanced.mockResolvedValue({
      products: [
        {
          id: 'PRD-2',
          name: 'Remera Lisa',
          variant_id: null,
          variant_name: null,
          sku: 'REM-1',
          current_price: 80_000,
          stock_quantity: 0,
          base_unit: 'unit',
          state: true,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/sales-analytics/products/buyers']}>
        <ProductBuyersPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Buscar...'), 'remera');
    await userEvent.click(await screen.findByRole('option', { name: /Remera Lisa/ }));
    await waitFor(() => {
      expect(mockService.getProductBuyers).toHaveBeenCalledWith(
        'PRD-2',
        expect.objectContaining({ sort: '-total' }),
      );
    });
    const lastCall = mockService.getProductBuyers.mock.calls.at(-1);
    expect(lastCall?.[1].variant_id).toBeUndefined();
  });
});
