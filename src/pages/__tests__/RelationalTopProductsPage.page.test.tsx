/**
 * Tests de página: CustomerTopProductsPage (#2 RF-BIPACK-022 — productos que
 * compra un cliente) y SupplierTopProductsPage (#3 RF-BIPACK-023 — productos
 * suministrados por un proveedor, compras COMPLETED). Mock en la frontera del
 * servicio; MemoryRouter para useSearchParams; i18n real es. Incluye el menú
 * de acciones por fila: pivotes entre análisis + copiar SKU.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CustomerTopProductsPage from '../sales-analytics/CustomerTopProductsPage';
import SupplierTopProductsPage from '../purchase-analytics/SupplierTopProductsPage';
import ProductBuyersPage from '../sales-analytics/ProductBuyersPage';
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
vi.mock('@/services/clientService', () => ({
  default: { searchByName: vi.fn() },
  clientService: { searchByName: vi.fn() },
}));
vi.mock('@/services/supplierService', () => ({
  default: { searchByName: vi.fn() },
}));

const mockService = relationalAnalyticsService as unknown as {
  getProductBuyers: ReturnType<typeof vi.fn>;
  getCustomerTopProducts: ReturnType<typeof vi.fn>;
  getSupplierTopProducts: ReturnType<typeof vi.fn>;
  getProductSuppliers: ReturnType<typeof vi.fn>;
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

const buyersEnvelope = {
  success: true,
  data: {
    rows: [
      {
        client_id: 'CLI-7',
        client_name: 'Maria Gomez',
        client_doc: '1234567',
        purchases: 3,
        units: 9,
        total: 1_500_000,
        avg_unit_price: 166_667,
        last_purchase_at: '2026-09-20T12:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    page_size: 10,
  },
};

const suppliersEnvelope = {
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
  },
};

/** Las 4 rutas del pivot relacional: los menús de fila navegan entre ellas. */
const renderWithRoutes = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/sales-analytics/products/buyers" element={<ProductBuyersPage />} />
        <Route path="/sales-analytics/customers/top-products" element={<CustomerTopProductsPage />} />
        <Route path="/purchase-analytics/suppliers/top-products" element={<SupplierTopProductsPage />} />
        <Route path="/purchase-analytics/products/suppliers" element={<ProductSuppliersPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockService.getCustomerTopProducts.mockResolvedValue(topProductsEnvelope);
  mockService.getSupplierTopProducts.mockResolvedValue(topProductsEnvelope);
  mockService.getProductBuyers.mockResolvedValue(buyersEnvelope);
  mockService.getProductSuppliers.mockResolvedValue(suppliersEnvelope);
});

describe('CustomerTopProductsPage', () => {
  it('fetcha por customer_id con sort default -units y renderiza la fila', async () => {
    render(
      <MemoryRouter initialEntries={['/sales-analytics/customers/top-products?customer_id=CLI-1']}>
        <CustomerTopProductsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Coca-Cola 2L')).toBeInTheDocument();
    expect(mockService.getCustomerTopProducts).toHaveBeenCalledWith(
      'CLI-1',
      expect.objectContaining({ sort: '-units', page: 1, page_size: 10 }),
    );
    expect(screen.getByText('SKU-COCA-2L')).toBeInTheDocument();
    expect(screen.getByText('60 uds.')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 1 (4 items)')).toBeInTheDocument();
  });

  it('sin customer_id muestra el selector de cliente y no fetcha', async () => {
    render(
      <MemoryRouter initialEntries={['/sales-analytics/customers/top-products']}>
        <CustomerTopProductsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Elegí Cliente/i)).toBeInTheDocument();
    expect(mockService.getCustomerTopProducts).not.toHaveBeenCalled();
  });

  it('el menú por fila ofrece compradores y comparación de proveedores con métricas', async () => {
    renderWithRoutes('/sales-analytics/customers/top-products?customer_id=CLI-1');
    await screen.findByText('Coca-Cola 2L');

    await userEvent.click(screen.getByTestId('drilldown-row-actions'));
    const menu = await screen.findByTestId('drilldown-row-menu');
    expect(within(menu).getByText('SKU: SKU-COCA-2L')).toBeInTheDocument();
    expect(within(menu).getByText(/60 uds\. · 14 compras · Gs\. 4\.500\.000/)).toBeInTheDocument();
    expect(within(menu).getByText('Precio prom.: Gs. 75.000')).toBeInTheDocument();

    await userEvent.click(within(menu).getByTestId('drilldown-row-action-compare-suppliers'));
    await waitFor(() => {
      expect(mockService.getProductSuppliers).toHaveBeenCalledWith(
        'PRD-9',
        expect.objectContaining({ sort: '+last_unit_price', page: 1 }),
      );
    });
    expect(await screen.findByText('Distribuidora Sur')).toBeInTheDocument();
  });

  it('el menú por fila pivota a compradores del producto', async () => {
    renderWithRoutes('/sales-analytics/customers/top-products?customer_id=CLI-1');
    await screen.findByText('Coca-Cola 2L');

    await userEvent.click(screen.getByTestId('drilldown-row-actions'));
    const menu = await screen.findByTestId('drilldown-row-menu');
    await userEvent.click(within(menu).getByTestId('drilldown-row-action-buyers'));

    await waitFor(() => {
      expect(mockService.getProductBuyers).toHaveBeenCalledWith(
        'PRD-9',
        expect.objectContaining({ sort: '-total', page: 1 }),
      );
    });
    expect(await screen.findByText('Maria Gomez')).toBeInTheDocument();
  });

  it('Copiar SKU escribe el SKU de la fila en el portapapeles', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderWithRoutes('/sales-analytics/customers/top-products?customer_id=CLI-1');
    await screen.findByText('Coca-Cola 2L');

    await userEvent.click(screen.getByTestId('drilldown-row-actions'));
    await userEvent.click(screen.getByTestId('drilldown-row-action-copy-sku'));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('SKU-COCA-2L');
    });
  });
});

describe('SupplierTopProductsPage', () => {
  it('fetcha por supplier_id con sort default -units', async () => {
    render(
      <MemoryRouter initialEntries={['/purchase-analytics/suppliers/top-products?supplier_id=SUPL-1']}>
        <SupplierTopProductsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Coca-Cola 2L')).toBeInTheDocument();
    expect(mockService.getSupplierTopProducts).toHaveBeenCalledWith(
      'SUPL-1',
      expect.objectContaining({ sort: '-units', page: 1, page_size: 10 }),
    );
  });

  it('sin supplier_id muestra el selector de proveedor', async () => {
    render(
      <MemoryRouter initialEntries={['/purchase-analytics/suppliers/top-products']}>
        <SupplierTopProductsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Elegí Proveedor/i)).toBeInTheDocument();
    expect(mockService.getSupplierTopProducts).not.toHaveBeenCalled();
  });

  it('el menú por fila muestra costo promedio y pivota a comparar proveedores', async () => {
    renderWithRoutes('/purchase-analytics/suppliers/top-products?supplier_id=SUPL-1');
    await screen.findByText('Coca-Cola 2L');

    await userEvent.click(screen.getByTestId('drilldown-row-actions'));
    const menu = await screen.findByTestId('drilldown-row-menu');
    expect(within(menu).getByText('SKU: SKU-COCA-2L')).toBeInTheDocument();
    expect(within(menu).getByText('Costo prom.: Gs. 75.000')).toBeInTheDocument();

    await userEvent.click(within(menu).getByTestId('drilldown-row-action-compare-suppliers'));
    await waitFor(() => {
      expect(mockService.getProductSuppliers).toHaveBeenCalledWith(
        'PRD-9',
        expect.objectContaining({ sort: '+last_unit_price', page: 1 }),
      );
    });
    expect(await screen.findByText('Distribuidora Sur')).toBeInTheDocument();
  });
});
