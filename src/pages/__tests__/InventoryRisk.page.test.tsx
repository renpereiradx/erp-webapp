/**
 * Tests alineación Inventory Analytics (PLAN_ALINEACION_INVENTORY_ANALYTICS_2026-09-21):
 * InventoryRisk. Mock en la frontera del servicio. H7: sin botones alert()
 * ("Ejecutar Plan de Mitigación", "Descargar Reporte", acciones por-carda).
 * Estado de error con retry (antes los fallos se tragaban en silencio).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryRisk from '../InventoryAnalytics/InventoryRisk';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';

vi.mock('@/services/bi/inventoryAnalyticsService', () => ({
  inventoryAnalyticsService: {
    getDeadStock: vi.fn(),
    getForecast: vi.fn(),
  },
}));

const deadStockData = {
  generated_at: '2026-09-21T12:00:00Z',
  summary: {
    total_products: 2,
    total_units: 10,
    total_value: 190000,
    percentage_of_stock: 15.5,
    average_days_idle: 140,
    potential_loss: 95000,
  },
  products: [
    {
      product_id: 'p-1',
      product_name: 'Producto Vencido',
      sku: 'SKU-001',
      category_name: 'Alimentos',
      current_stock: 4,
      stock_value: 60000,
      last_sale_date: '2026-04-01',
      days_since_last_sale: 173,
      last_movement_date: '2026-04-01',
      days_since_movement: 173,
      recommendation: 'LIQUIDACIÓN',
    },
  ],
  recommendations: ['Liquidar Producto Vencido'],
};

const forecastData = {
  generated_at: '2026-09-21T12:00:00Z',
  forecast_days: 30,
  summary: {
    products_at_risk: 3,
    high_risk_count: 1,
    medium_risk_count: 2,
    estimated_stockouts: 3,
    reorder_value: 250000,
  },
  risk_products: [
    {
      product_id: 'p-2',
      product_name: 'Producto Quiebre',
      sku: 'SKU-002',
      current_stock: 2,
      daily_demand: 3,
      days_until_stockout: 1,
      stockout_date: '2026-09-22',
      forecasted_stock: 0,
      recommended_order: 90,
      risk: 'HIGH',
    },
  ],
};

describe('InventoryRisk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inventoryAnalyticsService.getDeadStock).mockResolvedValue({
      success: true,
      data: deadStockData,
    } as never);
    vi.mocked(inventoryAnalyticsService.getForecast).mockResolvedValue({
      success: true,
      data: forecastData,
    } as never);
  });

  it('llama a los 2 endpoints del módulo', async () => {
    render(<InventoryRisk />);
    await waitFor(() => expect(inventoryAnalyticsService.getDeadStock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(inventoryAnalyticsService.getForecast).toHaveBeenCalledTimes(1));
  });

  it('muestra impact cards, tabla de stock muerto y pronóstico', async () => {
    render(<InventoryRisk />);

    // la pérdida aparece en la impact card y en el insight del footer
    expect((await screen.findAllByText('Gs. 95.000')).length).toBeGreaterThan(0);
    expect(screen.getByText('Producto Vencido')).toBeInTheDocument();
    expect(screen.getByText('Producto Quiebre')).toBeInTheDocument();
    expect(screen.getByText(/Pronóstico de Agotamiento/)).toBeInTheDocument();
  });

  it('H7: sin botones alert() muertos', async () => {
    render(<InventoryRisk />);
    await screen.findByText('Producto Vencido');

    expect(screen.queryByText('Ejecutar Plan de Mitigación')).not.toBeInTheDocument();
    expect(screen.queryByText(/Descargar Reporte Completo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Generar OC Urgente/i)).not.toBeInTheDocument();
  });

  it('fallo de un endpoint muestra ErrorState con retry y refetch funciona', async () => {
    vi.mocked(inventoryAnalyticsService.getDeadStock).mockRejectedValue(new Error('timeout'));
    const user = userEvent.setup();
    render(<InventoryRisk />);

    expect(await screen.findByText('No se pudo cargar el análisis de riesgos')).toBeInTheDocument();

    vi.mocked(inventoryAnalyticsService.getDeadStock).mockResolvedValue({
      success: true,
      data: deadStockData,
    } as never);
    await user.click(screen.getByRole('button', { name: /Actualizar/i }));

    await waitFor(() => expect(screen.getByText('Producto Vencido')).toBeInTheDocument());
  });
});
