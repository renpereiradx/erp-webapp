/**
 * Tests de página: ProductBuyersPage (#1 RF-BIPACK-021 — compradores de un
 * producto). Mock en la frontera del servicio; i18n real (namespace bi.*
 * registrado síncrono en vitest.setup); MemoryRouter para useSearchParams.
 * Cobertura: selector sin id, fetch + filas + paginación, draft-vs-applied
 * de la búsqueda, sort por encabezado y error con reintento.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductBuyersPage from '../sales-analytics/ProductBuyersPage';
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
  getProductBuyers: ReturnType<typeof vi.fn>;
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

beforeEach(() => {
  vi.clearAllMocks();
  mockService.getProductBuyers.mockResolvedValue(buyersEnvelope);
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
});
