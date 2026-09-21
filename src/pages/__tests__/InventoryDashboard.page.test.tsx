/**
 * Tests FASE de alineación Inventory Analytics (PLAN_ALINEACION_INVENTORY_ANALYTICS_2026-09-21).
 * Mock en la frontera del servicio (PLAN_TEST_DESIGN_FRONTEND §2). Fixtures con la
 * forma REAL del API (GET /inventory-analytics/dashboard + /overview, verificada en
 * dev 2026-09-21 — kpis.potential_profit no existe; el profit viene del overview).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryDashboard from '../InventoryAnalytics/InventoryDashboard';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';

vi.mock('@/services/bi/inventoryAnalyticsService', () => ({
  inventoryAnalyticsService: {
    getDashboard: vi.fn(),
    getOverview: vi.fn(),
  },
}));

const dashboardData = {
  generated_at: '2026-09-21T12:00:00Z',
  kpis: {
    total_value: 213680,
    turnover_rate: 0.5,
    days_of_inventory: 118,
    stockout_rate: 2,
    fill_rate: 97,
    dead_stock_pct: 12.4,
  },
  stock_status: {
    in_stock: 14,
    low_stock: 2,
    out_of_stock: 1,
    overstock: 0,
    in_stock_pct: 82.4,
    low_stock_pct: 11.8,
    out_of_stock_pct: 5.8,
    overstock_pct: 0,
  },
  alerts: [
    { type: 'LOW_STOCK', product_id: '', product_name: '', message: '11.8% de productos con stock bajo', current_stock: 0, severity: 'HIGH' },
  ],
  abc_summary: {
    total_products: 17,
    total_value: 213680,
    class_a_count: 1,
    class_a_value: 110500,
    class_a_value_pct: 51.7,
    class_b_count: 1,
    class_b_value: 66780,
    class_b_value_pct: 31.3,
    class_c_count: 15,
    class_c_value: 36400,
    class_c_value_pct: 17,
  },
};

const overviewData = {
  generated_at: '2026-09-21T12:00:00Z',
  total_products: 17,
  total_units: 320,
  total_value: 260000,
  total_cost: 150000,
  potential_profit: 110000,
  stock_status: dashboardData.stock_status,
  valuation: {
    total_cost_value: 150000,
    total_retail_value: 260000,
    potential_margin: 110000,
    potential_margin_pct: 42.3,
    average_cost: 8823,
    average_retail: 15294,
  },
  turnover: { turnover_rate: 0.5, days_of_inventory: 118, stockout_rate: 2, fill_rate: 97 },
};

const renderPage = () => render(<InventoryDashboard />);

describe('InventoryDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inventoryAnalyticsService.getDashboard).mockResolvedValue({
      success: true,
      data: dashboardData,
    } as never);
    vi.mocked(inventoryAnalyticsService.getOverview).mockResolvedValue({
      success: true,
      data: overviewData,
    } as never);
  });

  it('llama a los 2 endpoints del módulo', async () => {
    renderPage();
    await waitFor(() => expect(inventoryAnalyticsService.getDashboard).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(inventoryAnalyticsService.getOverview).toHaveBeenCalledTimes(1));
  });

  it('muestra KPIs valuados con el overview y estados del stock', async () => {
    renderPage();

    // profit del overview (campo real), no de kpis.potential_profit (inexistente)
    expect(await screen.findByText('Gs. 110.000')).toBeInTheDocument();
    expect(screen.getByText(/213\.680/)).toBeInTheDocument();
    expect(screen.getByText('Estado del Stock')).toBeInTheDocument();
    expect(screen.getByText('En Stock')).toBeInTheDocument();
    // el legend del donut usa toFixed(2): "82.40%"
    expect(screen.getByText(/82[.,]4/)).toBeInTheDocument();
  });

  it('renderiza el resumen ABC del dominio valuado sobre el total del overview', async () => {
    renderPage();

    expect(await screen.findByText('Clase A (Alta Rotación/Valor)')).toBeInTheDocument();
    // A = 51.7% de 260.000 (total del overview, no del dashboard)
    expect(screen.getAllByText(/134\.420/).length).toBeGreaterThan(0);
  });

  it('muestra alertas informativas sin botones de acción muertos', async () => {
    renderPage();

    expect(await screen.findByText('11.8% de productos con stock bajo')).toBeInTheDocument();
    expect(screen.queryByText('Ver reporte detallado')).not.toBeInTheDocument();
    expect(screen.queryByText('Generar orden de compra')).not.toBeInTheDocument();
  });

  it('Actualizar refetchea sin recargar la página', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Estado del Stock');

    await user.click(screen.getByRole('button', { name: /Actualizar/i }));

    await waitFor(() => expect(inventoryAnalyticsService.getDashboard).toHaveBeenCalledTimes(2));
    expect(inventoryAnalyticsService.getOverview).toHaveBeenCalledTimes(2);
  });

  it('fallo de los endpoints muestra ErrorState con retry', async () => {
    vi.mocked(inventoryAnalyticsService.getDashboard).mockRejectedValue(new Error('timeout'));
    renderPage();

    expect(await screen.findByText('No se pudo cargar el dashboard de inventario')).toBeInTheDocument();
    expect(screen.getByTestId('error-retry')).toBeInTheDocument();
  });
});
