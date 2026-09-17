/**
 * Tests FASE 5 (plan auditoría BI): CustomerSellerInsights.
 * Fuentes reales: /sales-analytics/by-customer + /by-seller en paralelo.
 * Mock en la frontera del servicio; MemoryRouter para el link a /parties.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  sellers: [
    {
      seller_id: 'V-1',
      seller_name: 'Carlos Ruiz',
      rank: 1,
      total_sales: 20000000,
      units_sold: 320,
      target_progress: 75,
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

  it('consulta ambos endpoints en paralelo con período month y monta KPIs', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockService.getByCustomer).toHaveBeenCalledWith({ period: 'month' });
      expect(mockService.getBySeller).toHaveBeenCalledWith({ period: 'month' });
    });

    expect(screen.getByText('Total Clientes')).toBeInTheDocument();
    expect(screen.getByText('850')).toBeInTheDocument();
    expect(screen.getByText('700 Recurrentes | 150 Nuevos')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument(); // retención real (P1-3 fuera)
    expect(screen.getByText(/45\.000\.000/)).toBeInTheDocument();
  });

  it('tablas de segmentación y ranking con datos reales', async () => {
    renderPage();

    await screen.findByText('María González');
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('semanal')).toBeInTheDocument(); // frequency capitalizada en CSS
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument(); // progreso de meta
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
    mockService.getByCustomer.mockResolvedValue({ success: true, data: { summary: {}, customers: [] } });
    mockService.getBySeller.mockResolvedValue({ success: true, data: { sellers: [] } });
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
