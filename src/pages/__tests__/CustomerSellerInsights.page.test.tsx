/**
 * Tests FASE 5 (plan auditoría BI) + deuda ≤10 filas (VERIFICACION_POST_CIERRE
 * 2026-09-21): CustomerSellerInsights. Fuentes reales: /sales-analytics/
 * by-customer + /by-seller en paralelo, ambas paginadas server-side
 * (page_size 10). Mock en la frontera del servicio; MemoryRouter para el
 * link a /parties. "Progreso de Meta" (target_progress, campo que el BE
 * nunca envió) no debe volver.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CustomerSellerInsights from '../sales-analytics/CustomerSellerInsights';
import salesAnalyticsService from '@/services/bi/salesAnalyticsService';

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  default: { getByCustomer: vi.fn(), getBySeller: vi.fn() },
  salesAnalyticsService: { getByCustomer: vi.fn(), getBySeller: vi.fn() },
}));

const mockService = salesAnalyticsService as unknown as {
  getByCustomer: ReturnType<typeof vi.fn>;
  getBySeller: ReturnType<typeof vi.fn>;
};

const customerPayload = {
  pagination: { page: 1, page_size: 10, total_items: 850, total_pages: 85 },
  summary: {
    total_customers: 850,
    returning_customers: 700,
    new_customers: 150,
    average_lifetime_value: 1500000,
    customer_retention_rate: 82,
    top_customer_revenue: 45000000,
  },
  customers: [
    {
      customer_id: 'C-1',
      customer_name: 'María González',
      customer_ruc: '1234567-8',
      segment: 'VIP',
      frequency: 'SEMANAL',
      total_purchases: 9000000,
      last_purchase: '2026-09-15T10:00:00Z',
    },
  ],
};

const sellerPayload = {
  pagination: { page: 1, page_size: 10, total_items: 3, total_pages: 1 },
  sellers: [
    {
      seller_id: 'V-1',
      seller_name: 'Carlos Ruiz',
      rank: 1,
      total_sales: 20000000,
      units_sold: 320,
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <CustomerSellerInsights />
    </MemoryRouter>,
  );

describe('CustomerSellerInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getByCustomer.mockResolvedValue({ success: true, data: customerPayload });
    mockService.getBySeller.mockResolvedValue({ success: true, data: sellerPayload });
  });

  it('consulta ambos endpoints paginados en paralelo y monta KPIs', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockService.getByCustomer).toHaveBeenCalledWith({ period: 'month', page: 1, page_size: 10 });
      expect(mockService.getBySeller).toHaveBeenCalledWith({ period: 'month', page: 1, page_size: 10 });
    });

    expect(screen.getByText('Total Clientes')).toBeInTheDocument();
    expect(screen.getByText('850')).toBeInTheDocument();
    expect(screen.getByText('700 Recurrentes | 150 Nuevos')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument(); // retención real (P1-3 fuera)
    expect(screen.getByText(/45\.000\.000/)).toBeInTheDocument();
  });

  it('tablas con datos reales; sin la columna fabricada "Progreso de Meta"', async () => {
    renderPage();

    await screen.findByText('María González');
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('semanal')).toBeInTheDocument(); // frequency capitalizada en CSS
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(screen.queryByText('Progreso de Meta')).not.toBeInTheDocument();
    expect(screen.queryByText('75%')).not.toBeInTheDocument(); // target_progress no existe en el BE
  });

  it('pagina la tabla de clientes server-side (page 2 → refetch)', async () => {
    renderPage();
    await screen.findByText('María González');

    // el pager de clientes es el que habilita "siguiente" (85 páginas);
    // el de vendedores está en la última página (1/1, disabled)
    const nextButtons = screen.getAllByRole('button', { name: 'Página siguiente' });
    const enabledNext = nextButtons.find((b) => !((b as HTMLButtonElement).disabled));
    expect(enabledNext).toBeDefined();
    await userEvent.click(enabledNext!);

    await waitFor(() => {
      expect(mockService.getByCustomer).toHaveBeenCalledWith({ period: 'month', page: 2, page_size: 10 });
    });
  });

  it('link "Ver todos los clientes" apunta al catálogo canónico /parties', async () => {
    renderPage();
    await screen.findByText('María González');

    expect(screen.getByText('Ver todos los clientes')).toHaveAttribute(
      'href',
      '/parties?tab=clientes',
    );
  });

  it('sin datos → estados vacíos por tabla (no blank)', async () => {
    mockService.getByCustomer.mockResolvedValue({ success: true, data: { summary: {}, customers: [], pagination: { page: 1, total_pages: 1, total_items: 0 } } });
    mockService.getBySeller.mockResolvedValue({ success: true, data: { sellers: [], pagination: { page: 1, total_pages: 1, total_items: 0 } } });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Sin datos de clientes disponibles')).toBeInTheDocument();
      expect(screen.getByText('Sin datos de vendedores disponibles')).toBeInTheDocument();
    });
  });

  it('fallo de la API → estado de error', async () => {
    mockService.getByCustomer.mockRejectedValue(new Error('timeout'));
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('No se pudieron cargar los insights.')).toBeInTheDocument(),
    );
  });
});
