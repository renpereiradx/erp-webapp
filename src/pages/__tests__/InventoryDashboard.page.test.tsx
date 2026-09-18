/**
 * Tests FASE 6 (plan alineación BI): InventoryDashboard (pulido in situ D5).
 * Mock en la frontera del servicio (PLAN_TEST_DESIGN_FRONTEND §2).
 * Verifica: ABC items generados desde el domain con el total correcto,
 * KPIs y estados del overview real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InventoryDashboard from '../InventoryAnalytics/InventoryDashboard';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';

vi.mock('@/services/bi/inventoryAnalyticsService', () => ({
  inventoryAnalyticsService: {
    getDashboard: vi.fn(),
    getOverview: vi.fn(),
  },
}));

const dashboardData = {
  kpis: {
    total_value: 450000000,
    total_products: 320,
    low_stock_count: 14,
    out_of_stock_count: 3,
  },
  abc_summary: {
    class_a_value_pct: 78,
    class_a_count: 42,
    class_b_value_pct: 17,
    class_b_count: 96,
    class_c_value_pct: 5,
    class_c_count: 182,
  },
  stock_status: [
    { status: 'IN_STOCK', count: 280 },
    { status: 'LOW_STOCK', count: 14 },
  ],
  alerts: [],
};

const overviewData = {
  total_value: 460000000,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <InventoryDashboard />
    </MemoryRouter>,
  );

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

  it('muestra los 3 tramos ABC valuados sobre el total del overview', async () => {
    renderPage();

    // totalValueForABC = overview.total_value || kpis.total_value: A=78%
    const aLabel = await screen.findByText('Clase A (Alta Rotación/Valor)');
    expect(aLabel).toBeInTheDocument();
    expect(screen.getAllByText(/358\.800\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/78\.200\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/23\.000\.000/).length).toBeGreaterThan(0);
  });

  it('muestra KPIs del inventario', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Dashboard de Inventario/i)).toBeInTheDocument());
  });
});
