/**
 * InventoryDashboardPage (F5) — KPIs reales del consolidado + valuación del
 * overview, estado por umbral, alertas con destino existente, ABC, movers y
 * reposición urgente. Verifica que no revivan claims como "Live",
 * "en tiempo real", "$0" ni chips de variación (+0%).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null
          ? fallbackOrVars
          : maybeVars) ?? {}
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      )
    },
  }),
}))

vi.mock('@/services/bi/inventoryAnalyticsService', () => ({
  inventoryAnalyticsService: {
    getOverview: vi.fn(),
    getDashboard: vi.fn(),
    getStockLevels: vi.fn(),
    getTurnover: vi.fn(),
    getABC: vi.fn(),
    getDeadStock: vi.fn(),
    getReorder: vi.fn(),
    getStockAging: vi.fn(),
  },
}))

import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService'
import { inventoryEnvelope, renderInventoryPage } from './inventoryAnalyticsTestUtils'
import InventoryDashboardPage from '../inventory-analytics/InventoryDashboardPage'

const STOCK_STATUS = {
  in_stock: 16,
  low_stock: 4,
  out_of_stock: 1,
  overstock: 12,
  in_stock_pct: 64.8,
  low_stock_pct: 16.2,
  out_of_stock_pct: 4.1,
  overstock_pct: 48.6,
}

const DASHBOARD = {
  generated_at: '2026-10-20T12:00:00Z',
  kpis: {
    total_value: 37532095,
    value_change_pct: 0,
    turnover_rate: 0.06,
    turnover_change_pct: 0,
    days_of_inventory: 500,
    stockout_rate: 4.1,
    fill_rate: 95.9,
    dead_stock_pct: 31.31,
  },
  stock_status: STOCK_STATUS,
  top_movers: [
    {
      product_id: 'P-1',
      product_name: 'CAMISETA ADIDAS',
      sku: 'P-1',
      category_name: 'MODA',
      product_type: 'PHYSICAL',
      turnover_rate: 4,
      days_of_inventory: 7.5,
      current_stock: 10,
      units_sold: 40,
      average_stock: 10,
      performance: 'EXCELLENT',
    },
  ],
  slow_movers: [
    {
      product_id: 'P-3',
      product_name: 'RELOJ CLASICO',
      sku: 'P-3',
      category_name: 'MODA',
      product_type: 'PHYSICAL',
      turnover_rate: 0,
      days_of_inventory: 999,
      current_stock: 5,
      units_sold: 0,
      average_stock: 5,
      performance: 'POOR',
    },
  ],
  reorder_alerts: [
    {
      product_id: 'P-2',
      product_name: 'MOUSE GOLITEC',
      sku: 'P-2',
      category_name: 'TECNOLOGIA',
      product_type: 'PHYSICAL',
      current_stock: 0,
      min_stock: 5,
      reorder_point: 5,
      reorder_quantity: 10,
      estimated_cost: 500000,
      days_until_stockout: 999,
      priority: 'URGENT',
    },
  ],
  dead_stock_value: 2149350,
  trends: null,
  abc_summary: {
    total_products: 21,
    total_value: 1000000,
    class_a_count: 1,
    class_a_value: 800000,
    class_a_value_pct: 80,
    class_b_count: 2,
    class_b_value: 150000,
    class_b_value_pct: 15,
    class_c_count: 18,
    class_c_value: 50000,
    class_c_value_pct: 5,
  },
  alerts: [
    {
      type: 'OUT_OF_STOCK',
      product_id: '',
      product_name: '',
      message: '4,1% de productos sin stock',
      current_stock: 0,
      severity: 'CRITICAL',
    },
    {
      type: 'DEAD_STOCK',
      product_id: '',
      product_name: '',
      message: '31,3% del inventario es stock muerto',
      current_stock: 0,
      severity: 'MEDIUM',
    },
  ],
}

const OVERVIEW = {
  generated_at: '2026-10-20T12:00:00Z',
  total_products: 21,
  total_units: 40,
  total_value: 37532095,
  total_cost: 22881350,
  potential_profit: 14650745,
  stock_status: STOCK_STATUS,
  valuation: {
    total_cost_value: 22881350,
    total_retail_value: 37532095,
    potential_margin: 14650745,
    potential_margin_pct: 39,
    average_cost: 1089588,
    average_retail: 1787242,
  },
  turnover: {
    turnover_rate: 0.06,
    days_of_inventory: 500,
    stockout_rate: 4.1,
    fill_rate: 95.9,
  },
  alerts: [],
}

describe('InventoryDashboardPage (F5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryAnalyticsService.getDashboard).mockResolvedValue(
      inventoryEnvelope(DASHBOARD) as never,
    )
    vi.mocked(inventoryAnalyticsService.getOverview).mockResolvedValue(
      inventoryEnvelope(OVERVIEW) as never,
    )
  })

  it('muestra KPIs reales, estado, ABC, movers y reposición', async () => {
    renderInventoryPage(<InventoryDashboardPage />, {
      route: '/inventory-analytics/dashboard',
    })

    expect(await screen.findByTestId('inventory-kpi-ledger')).toBeInTheDocument()
    const totalValue = screen.getByTestId('inventory-kpi-totalValue')
    expect(totalValue).toHaveTextContent('Gs. 37.532.095')
    expect(totalValue).toHaveTextContent('Costo: Gs. 22.881.350')
    expect(screen.getByTestId('inventory-kpi-potentialProfit')).toHaveTextContent(
      'Gs. 14.650.745',
    )
    expect(screen.getByTestId('inventory-kpi-turnoverRate')).toHaveTextContent('0,06x')
    expect(screen.getByTestId('inventory-kpi-daysOfInventory')).toHaveTextContent('500 días')
    expect(screen.getByTestId('inventory-kpi-stockoutRate')).toHaveTextContent('4,1%')
    expect(screen.getByTestId('inventory-kpi-deadStockPct')).toHaveTextContent('31,3%')

    expect(screen.getByTestId('stock-status-inStock')).toHaveTextContent('16')
    expect(screen.getByTestId('stock-status-inStock')).toHaveTextContent('64,8% del catálogo')
    expect(screen.getByText(/Las categorías se superponen/)).toBeInTheDocument()

    expect(screen.getByText('4,1% de productos sin stock')).toBeInTheDocument()
    const manageLinks = screen.getAllByRole('link', { name: 'Gestionar' })
    expect(manageLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/inventory-analytics/stock-levels',
      '/inventory-analytics/risk',
    ])

    const abc = screen.getByTestId('abc-summary-table')
    expect(within(abc).getByText('Clase A')).toBeInTheDocument()
    expect(within(abc).getByText('Gs. 800.000')).toBeInTheDocument()
    expect(within(abc).getByText(/80%/)).toBeInTheDocument()

    const top = screen.getByTestId('inventory-top-movers')
    expect(within(top).getByText('CAMISETA ADIDAS')).toBeInTheDocument()
    expect(within(top).getByText(/Vendidas: 40/)).toBeInTheDocument()
    expect(within(top).getByText('4x')).toBeInTheDocument()

    const slow = screen.getByTestId('inventory-slow-movers')
    expect(within(slow).getByText('RELOJ CLASICO')).toBeInTheDocument()
    expect(within(slow).getByText(/Vendidas: 0/)).toBeInTheDocument()
    expect(within(slow).queryByText(/x$/)).toBeNull()

    const reorder = screen.getByTestId('inventory-dashboard-reorder-table')
    expect(within(reorder).getByText('MOUSE GOLITEC')).toBeInTheDocument()
    expect(within(reorder).getByText('Urgente')).toBeInTheDocument()
    expect(within(reorder).getByText('Gs. 500.000')).toBeInTheDocument()
    expect(within(reorder).getByText('Sin ventas 30 d')).toBeInTheDocument()

    for (const fabricated of ['Live', 'en tiempo real', 'Objetivo', '+0%', '$']) {
      expect(screen.queryByText(fabricated)).toBeNull()
    }
  })

  it('marca los días sin base cuando no hay costo de ventas', async () => {
    vi.mocked(inventoryAnalyticsService.getDashboard).mockResolvedValue(
      inventoryEnvelope({
        ...DASHBOARD,
        kpis: { ...DASHBOARD.kpis, days_of_inventory: 0, turnover_rate: 0 },
      }) as never,
    )
    renderInventoryPage(<InventoryDashboardPage />, {
      route: '/inventory-analytics/dashboard',
    })

    expect(await screen.findByTestId('inventory-kpi-daysOfInventory')).toHaveTextContent('—')
    expect(screen.getByTestId('inventory-kpi-daysOfInventory')).toHaveTextContent(
      'Sin costo de ventas en el período',
    )
  })

  it('muestra el empty honesto de alertas y movers', async () => {
    vi.mocked(inventoryAnalyticsService.getDashboard).mockResolvedValue(
      inventoryEnvelope({ ...DASHBOARD, alerts: [], top_movers: [], slow_movers: [] }) as never,
    )
    renderInventoryPage(<InventoryDashboardPage />, {
      route: '/inventory-analytics/dashboard',
    })

    expect(await screen.findByTestId('inventory-alerts-empty')).toBeInTheDocument()
    expect(screen.getAllByText('Sin productos para mostrar')).toHaveLength(2)
  })

  it('muestra error y retry cuando falla el endpoint', async () => {
    vi.mocked(inventoryAnalyticsService.getDashboard).mockRejectedValue(new Error('offline'))
    renderInventoryPage(<InventoryDashboardPage />, {
      route: '/inventory-analytics/dashboard',
    })

    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })
})
