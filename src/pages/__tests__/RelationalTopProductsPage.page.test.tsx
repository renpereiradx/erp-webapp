/**
 * Tests de página: CustomerTopProductsPage (#2 RF-BIPACK-022 — productos que
 * compra un cliente) y SupplierTopProductsPage (#3 RF-BIPACK-023 — productos
 * suministrados por un proveedor, compras COMPLETED). Mock en la frontera del
 * servicio; MemoryRouter para useSearchParams; i18n real es.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CustomerTopProductsPage from '../sales-analytics/CustomerTopProductsPage';
import SupplierTopProductsPage from '../purchase-analytics/SupplierTopProductsPage';
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
  getCustomerTopProducts: ReturnType<typeof vi.fn>;
  getSupplierTopProducts: ReturnType<typeof vi.fn>;
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
  mockService.getCustomerTopProducts.mockResolvedValue(topProductsEnvelope);
  mockService.getSupplierTopProducts.mockResolvedValue(topProductsEnvelope);
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
});
