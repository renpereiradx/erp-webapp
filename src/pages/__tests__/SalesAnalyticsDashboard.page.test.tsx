/**
 * Tests FASE 5 (plan auditoría BI): sales-analytics/Dashboard.
 * Fuente real: GET /sales-analytics/dashboard con {period} (fix FASE 4: el
 * período sí viaja). Mock en la frontera del servicio. H7 (FASE 5): fuera
 * Exportar / Ver Detalles / "Hacer clic para ver detalles" (sin handler).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../sales-analytics/Dashboard';
import salesAnalyticsService from '@/services/bi/salesAnalyticsService';

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  default: { getDashboard: vi.fn() },
  salesAnalyticsService: { getDashboard: vi.fn() },
}));

const mockService = salesAnalyticsService as unknown as {
  getDashboard: ReturnType<typeof vi.fn>;
};

const dashboardData = {
  kpis: {
    total_sales: 12500000,
    sales_growth_pct: 12,
    total_transactions: 320,
    transactions_growth_pct: -5,
    average_ticket: 39062,
    ticket_growth_pct: 4,
    gross_margin_pct: 94.76,
    margin_growth_pct: 2,
  },
  trends: [
    { label: 'Semana 1', sales: 3000000 },
    { label: 'Semana 2', sales: 4500000 },
  ],
  alerts: [{ type: 'WARNING', message: 'Ventas por debajo del promedio en sucursal 2' }],
  top_products: [{ product_name: 'Cerveza Premium 1L', units_sold: 840, sales: 8400000 }],
  payment_mix: [{ display_name: 'Efectivo', percentage: 60 }],
};

describe('sales-analytics Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getDashboard.mockResolvedValue({ success: true, data: dashboardData });
  });

  it('consulta con período month y monta KPIs formateados', async () => {
    render(<Dashboard />);

    await waitFor(() => expect(mockService.getDashboard).toHaveBeenCalledWith({ period: 'month' }));
    expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
    expect(screen.getByText('Gs. 12.500.000')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toBeInTheDocument();
    // margen redondeado a 1 decimal (fuera el float crudo de F2)
    expect(screen.getByText('94.8%')).toBeInTheDocument();
  });

  it('renderiza alerta, top productos y mix de pagos del endpoint', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Ventas por debajo del promedio en sucursal 2')).toBeInTheDocument();
    expect(screen.getByText('Cerveza Premium 1L')).toBeInTheDocument();
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('cambiar el período re-consulta con el valor de API', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    await screen.findByText('Ventas Totales');

    await user.click(screen.getByRole('button', { name: 'semana' }));
    await waitFor(() => expect(mockService.getDashboard).toHaveBeenLastCalledWith({ period: 'week' }));
  });

  it('fallo del endpoint → banner de error honesto (estado que existía y no se mostraba)', async () => {
    mockService.getDashboard.mockRejectedValue(new Error('API caída'));
    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('API caída')).toBeInTheDocument());
  });

  it('H7: sin botones decorativos sin handler (Exportar/Ver Detalles/clic alertas)', async () => {
    render(<Dashboard />);
    await screen.findByText('Ventas Totales');

    expect(screen.queryByText('Exportar')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver Detalles')).not.toBeInTheDocument();
    expect(screen.queryByText('Hacer clic para ver detalles')).not.toBeInTheDocument();
  });
});
