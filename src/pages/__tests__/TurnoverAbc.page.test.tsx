/**
 * TurnoverAbcPage (F5) — rotación real del período (incluida la nota de días),
 * performance traducido, días sin COGS como "—" y ABC por ventas con tabs.
 * Verifica que no reviva el claim "Vs. período anterior" que no trae el BE.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
import TurnoverAbcPage from '../inventory-analytics/TurnoverAbcPage'

const TURNOVER = {
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
  overall: {
    turnover_rate: 0.01,
    days_of_inventory: 2839,
    average_inventory: 22881350,
    cost_of_goods_sold: 241800,
    inventory_efficiency: 0,
  },
  by_category: [
    {
      category_id: '1',
      category_name: 'MODA',
      turnover_rate: 4.2,
      days_of_inventory: 90,
      total_units: 40,
      total_value: 500000,
      units_sold: 12,
      performance: 'EXCELLENT',
    },
    {
      category_id: '2',
      category_name: 'ALQUILER',
      turnover_rate: 0.09,
      days_of_inventory: 0,
      total_units: 5,
      total_value: 100000,
      units_sold: 0,
      performance: 'POOR',
    },
  ],
  by_product: [
    {
      product_id: 'P-1',
      product_name: 'PRODUCTO TOP',
      sku: 'P-1',
      category_name: 'MODA',
      product_type: 'PHYSICAL',
      turnover_rate: 1.5,
      days_of_inventory: 120,
      current_stock: 10,
      units_sold: 5,
      average_stock: 10,
      performance: 'GOOD',
    },
  ],
  trends: null,
}

const ABC = {
  generated_at: '2026-10-20T12:00:00Z',
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
  summary: {
    total_products: 3,
    total_value: 1000000,
    class_a_count: 1,
    class_a_value: 800000,
    class_a_value_pct: 80,
    class_b_count: 1,
    class_b_value: 150000,
    class_b_value_pct: 15,
    class_c_count: 1,
    class_c_value: 50000,
    class_c_value_pct: 5,
  },
  class_a: [
    {
      product_id: 'P-A',
      product_name: 'PRODUCTO A',
      sku: 'P-A',
      category_name: 'MODA',
      product_type: 'PHYSICAL',
      class: 'A',
      total_sales: 800000,
      sales_percentage: 80,
      cumulative_pct: 80,
      units_sold: 8,
      current_stock: 2,
      stock_value: 200000,
      turnover_rate: 0,
      rank: 1,
    },
  ],
  class_b: [
    {
      product_id: 'P-B',
      product_name: 'PRODUCTO B',
      sku: 'P-B',
      category_name: 'MODA',
      product_type: 'PHYSICAL',
      class: 'B',
      total_sales: 150000,
      sales_percentage: 15,
      cumulative_pct: 95,
      units_sold: 3,
      current_stock: 4,
      stock_value: 100000,
      turnover_rate: 0,
      rank: 2,
    },
  ],
  class_c: [
    {
      product_id: 'P-C',
      product_name: 'PRODUCTO C',
      sku: 'P-C',
      category_name: 'MODA',
      product_type: 'PHYSICAL',
      class: 'C',
      total_sales: 50000,
      sales_percentage: 5,
      cumulative_pct: 100,
      units_sold: 1,
      current_stock: 9,
      stock_value: 50000,
      turnover_rate: 0,
      rank: 3,
    },
  ],
}

describe('TurnoverAbcPage (F5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryAnalyticsService.getTurnover).mockResolvedValue(
      inventoryEnvelope(TURNOVER) as never,
    )
    vi.mocked(inventoryAnalyticsService.getABC).mockResolvedValue(
      inventoryEnvelope(ABC) as never,
    )
  })

  it('muestra KPIs, nota de días, tablas de rotación y performance', async () => {
    renderInventoryPage(<TurnoverAbcPage />, {
      route: '/inventory-analytics/turnover-abc?period=month',
    })

    expect(await screen.findByTestId('turnover-kpi-ledger')).toBeInTheDocument()
    expect(screen.getByTestId('inventory-kpi-turnoverRate')).toHaveTextContent('0,01x')
    expect(screen.getByTestId('inventory-kpi-daysOfInventory')).toHaveTextContent('2.839 días')
    expect(screen.getByTestId('inventory-kpi-inventoryCost')).toHaveTextContent(
      'Gs. 22.881.350',
    )
    expect(screen.getByTestId('inventory-kpi-cogs')).toHaveTextContent('Gs. 241.800')
    expect(screen.getByText(/Los días de inventario se calculan con el costo de ventas/)).toBeInTheDocument()

    const categories = screen.getByTestId('turnover-category-table')
    expect(within(categories).getByText('MODA')).toBeInTheDocument()
    expect(within(categories).getByText('4,2x')).toBeInTheDocument()
    expect(within(categories).getByText('Excelente')).toBeInTheDocument()
    expect(within(categories).getByText('Baja')).toBeInTheDocument()
    expect(within(categories).getAllByLabelText('Sin costo de ventas en el período').length).toBeGreaterThan(0)

    const products = screen.getByTestId('turnover-product-table')
    expect(within(products).getByText('PRODUCTO TOP')).toBeInTheDocument()
    expect(within(products).getByText('1,5x')).toBeInTheDocument()
    expect(within(products).getByText('Buena')).toBeInTheDocument()

    for (const fabricated of ['Vs. período anterior', 'Vs. periodo anterior', '$', 'Live']) {
      expect(screen.queryByText(fabricated)).toBeNull()
    }
  })

  it('muestra el ABC por ventas y cambia de clase con las tabs', async () => {
    const user = userEvent.setup()
    renderInventoryPage(<TurnoverAbcPage />, {
      route: '/inventory-analytics/turnover-abc',
    })

    const summary = await screen.findByTestId('abc-summary-table')
    expect(within(summary).getByText('Clase A')).toBeInTheDocument()
    expect(within(summary).getByText('Gs. 800.000')).toBeInTheDocument()
    expect(within(summary).getByText(/80%/)).toBeInTheDocument()

    const abcTable = screen.getByTestId('abc-class-table')
    expect(within(abcTable).getByText('PRODUCTO A')).toBeInTheDocument()
    expect(within(abcTable).queryByText('PRODUCTO B')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Clase B · 1' }))
    expect(within(screen.getByTestId('abc-class-table')).getByText('PRODUCTO B')).toBeInTheDocument()
  })


  it('abre la primera clase con productos cuando la A está vacía', async () => {
    vi.mocked(inventoryAnalyticsService.getABC).mockResolvedValue(
      inventoryEnvelope({
        ...ABC,
        summary: {
          ...ABC.summary,
          class_a_count: 0,
          class_a_value: 0,
          class_a_value_pct: 0,
          class_b_count: 0,
          class_b_value: 0,
          class_b_value_pct: 0,
          class_c_count: 3,
          class_c_value: 1000000,
          class_c_value_pct: 100,
        },
        class_a: [],
        class_b: [],
      }) as never,
    )
    renderInventoryPage(<TurnoverAbcPage />, {
      route: '/inventory-analytics/turnover-abc',
    })

    const table = await screen.findByTestId('abc-class-table')
    expect(within(table).getByText('PRODUCTO C')).toBeInTheDocument()
  })

  it('muestra error y retry del ABC sin tumbar la rotación', async () => {
    vi.mocked(inventoryAnalyticsService.getABC).mockRejectedValue(new Error('offline'))
    renderInventoryPage(<TurnoverAbcPage />, {
      route: '/inventory-analytics/turnover-abc',
    })

    expect(await screen.findByTestId('turnover-category-table')).toBeInTheDocument()
    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })
})
