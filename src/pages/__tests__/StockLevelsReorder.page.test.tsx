/**
 * Tests alineación Inventory Analytics (PLAN_ALINEACION_INVENTORY_ANALYTICS_2026-09-21):
 * StockLevelsReorder. Mock en la frontera del servicio. Cubre: contrato de
 * paginación server-side (page/page_size), filtros client-side, tarjetas de
 * reorden, H7 (sin pager falso en la tabla) y degradación sin reorder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StockLevelsReorder from '../InventoryAnalytics/StockLevelsReorder';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';

vi.mock('@/services/bi/inventoryAnalyticsService', () => ({
  inventoryAnalyticsService: {
    getStockLevels: vi.fn(),
    getReorderAnalysis: vi.fn(),
    getDashboard: vi.fn(),
    getOverview: vi.fn(),
  },
}));

const stockData = {
  generated_at: '2026-09-21T12:00:00Z',
  summary: { total_products: 34, total_units: 420, total_value: 500000, average_stock: 12 },
  pagination: { page: 1, page_size: 20, total_items: 34, total_pages: 2 },
  products: [
    {
      product_id: 'p-1',
      product_name: 'Cerveza Premium 1L',
      sku: 'SKU-001',
      category_name: 'Bebidas',
      current_stock: 24,
      min_stock: 6,
      max_stock: 60,
      reorder_point: 10,
      status: 'IN_STOCK',
      days_of_stock: 12,
      unit_cost: 8000,
      unit_price: 12000,
      stock_value: 192000,
      last_movement: '2026-09-20',
      last_sale: '2026-09-20',
    },
    {
      product_id: 'p-2',
      product_name: 'Papas 300g',
      sku: 'SKU-002',
      category_name: 'Snacks',
      current_stock: 1,
      min_stock: 5,
      max_stock: 40,
      reorder_point: 8,
      status: 'LOW_STOCK',
      days_of_stock: 2,
      unit_cost: 3000,
      unit_price: 5000,
      stock_value: 3000,
      last_movement: '2026-09-21',
      last_sale: '2026-09-21',
    },
  ],
};

const reorderData = {
  generated_at: '2026-09-21T12:00:00Z',
  summary: { total_needing_reorder: 3, urgent_count: 1, soon_count: 2, estimated_cost: 300000 },
  urgent_reorders: [
    {
      product_id: 'p-2',
      product_name: 'Papas 300g',
      sku: 'SKU-002',
      category_name: 'Snacks',
      current_stock: 1,
      min_stock: 5,
      reorder_point: 8,
      reorder_quantity: 40,
      estimated_cost: 120000,
      days_until_stockout: 2,
      priority: 'URGENT',
    },
  ],
  soon_reorders: [],
};

describe('StockLevelsReorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inventoryAnalyticsService.getStockLevels).mockResolvedValue({
      success: true,
      data: stockData,
    } as never);
    vi.mocked(inventoryAnalyticsService.getReorderAnalysis).mockResolvedValue({
      success: true,
      data: reorderData,
    } as never);
  });

  it('consulta stock-levels con paginación server-side y reorder sin página', async () => {
    render(<StockLevelsReorder />);

    await waitFor(() =>
      expect(inventoryAnalyticsService.getStockLevels).toHaveBeenCalledWith({ page: 1, page_size: 20 }),
    );
    expect(inventoryAnalyticsService.getReorderAnalysis).toHaveBeenCalledTimes(1);
  });

  it('renderiza productos, tarjetas de reorden y pager del BE', async () => {
    render(<StockLevelsReorder />);

    expect(await screen.findByText('Cerveza Premium 1L')).toBeInTheDocument();
    expect(screen.getByText('Papas 300g')).toBeInTheDocument();
    expect(screen.getByText(/Necesidad Urgente de Reorden/i)).toBeInTheDocument();
    // pager server-side con metadata real
    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument();
  });

  it('filtra por búsqueda con memo', async () => {
    const user = userEvent.setup();
    render(<StockLevelsReorder />);
    await screen.findByText('Cerveza Premium 1L');

    await user.type(screen.getByRole('textbox'), 'cerveza');

    await waitFor(() => expect(screen.queryByText('Papas 300g')).not.toBeInTheDocument());
    expect(screen.getByText('Cerveza Premium 1L')).toBeInTheDocument();
  });

  it('filtra por status', async () => {
    const user = userEvent.setup();
    render(<StockLevelsReorder />);
    await screen.findByText('Cerveza Premium 1L');

    await user.click(screen.getByRole('button', { name: /Bajo Stock/i }));

    await waitFor(() => expect(screen.queryByText('Cerveza Premium 1L')).not.toBeInTheDocument());
    expect(screen.getByText('Papas 300g')).toBeInTheDocument();
  });

  it('H7: la tabla no trae pager falso propio', async () => {
    render(<StockLevelsReorder />);
    await screen.findByText('Cerveza Premium 1L');

    // el pager falso de la tabla tenía un "Siguiente" siempre activo sin handler
    const tabla = screen.getByText(/Mostrando/i).closest('div');
    expect(tabla?.querySelectorAll('button').length ?? 0).toBe(0);
  });

  it('fallo de stock-levels muestra ErrorState; fallo de reorder degrada sin tarjetas', async () => {
    vi.mocked(inventoryAnalyticsService.getStockLevels).mockRejectedValue(new Error('timeout'));
    render(<StockLevelsReorder />);

    expect(await screen.findByText('No se pudieron cargar los niveles de stock')).toBeInTheDocument();

    // reset y ahora fallar solo reorder
    vi.mocked(inventoryAnalyticsService.getStockLevels).mockResolvedValue({
      success: true,
      data: stockData,
    } as never);
    vi.mocked(inventoryAnalyticsService.getReorderAnalysis).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Actualizar/i }));

    await waitFor(() => expect(screen.getByText('Cerveza Premium 1L')).toBeInTheDocument());
    expect(screen.queryByText(/Necesidad Urgente de Reorden/i)).not.toBeInTheDocument();
  });
});
