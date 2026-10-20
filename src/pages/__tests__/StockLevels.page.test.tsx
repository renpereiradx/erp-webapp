/**
 * StockLevelsPage (F5) — paginación/orden/filtro server-side, resumen honesto
 * (unidades/valor de la página), reposición con costo faltante en `—` y
 * centinela 999 como "sin ventas", no como 999 días.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
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
import StockLevelsPage from '../inventory-analytics/StockLevelsPage'

const product = (overrides: Record<string, unknown> = {}) => ({
  product_id: 'P-1',
  product_name: 'CAMISETA ADIDAS',
  sku: 'P-1',
  category_name: 'MODA',
  product_type: 'PHYSICAL',
  current_stock: 20,
  min_stock: 5,
  max_stock: 15,
  reorder_point: 5,
  status: 'OVERSTOCK',
  days_of_stock: 12,
  unit_cost: 50000,
  unit_price: 90000,
  stock_value: 1000000,
  last_movement: '2026-10-10T12:00:00Z',
  last_sale: '2026-10-09T12:00:00Z',
  ...overrides,
})

const LEVELS = {
  generated_at: '2026-10-20T12:00:00Z',
  summary: {
    total_products: 21,
    total_units: 40,
    total_value: 1000000,
    average_stock: 0,
    median_stock: 0,
  },
  products: [
    product(),
    product({
      product_id: 'P-2',
      product_name: 'MOUSE GOLITEC',
      sku: 'P-2',
      category_name: 'TECNOLOGIA',
      current_stock: 0,
      status: 'OUT_OF_STOCK',
      days_of_stock: 999,
      stock_value: 0,
    }),
  ],
  pagination: { page: 1, page_size: 10, total_items: 21, total_pages: 3 },
}

const REORDER = {
  generated_at: '2026-10-20T12:00:00Z',
  summary: {
    total_needing_reorder: 2,
    urgent_count: 1,
    soon_count: 1,
    estimated_cost: 0,
    average_lead_time_days: 0,
  },
  urgent_reorders: [
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
      estimated_cost: 0,
      days_until_stockout: 999,
      priority: 'URGENT',
    },
  ],
  soon_reorders: [
    {
      product_id: 'P-3',
      product_name: 'TECLADO BASICO',
      sku: 'P-3',
      category_name: 'TECNOLOGIA',
      product_type: 'PHYSICAL',
      current_stock: 3,
      min_stock: 5,
      reorder_point: 5,
      reorder_quantity: 7,
      estimated_cost: 0,
      days_until_stockout: 12,
      priority: 'MEDIUM',
    },
  ],
  by_supplier: null,
}

describe('StockLevelsPage (F5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryAnalyticsService.getStockLevels).mockResolvedValue(
      inventoryEnvelope(LEVELS) as never,
    )
    vi.mocked(inventoryAnalyticsService.getReorder).mockResolvedValue(
      inventoryEnvelope(REORDER) as never,
    )
  })

  it('muestra el resumen scope-página, la tabla y el centinela 999', async () => {
    renderInventoryPage(<StockLevelsPage />, {
      route: '/inventory-analytics/stock-levels',
    })

    const summary = await screen.findByTestId('stock-levels-summary')
    expect(within(summary).getByText('Productos con el filtro')).toBeInTheDocument()
    expect(within(summary).getByText('21')).toBeInTheDocument()
    expect(within(summary).getByText('Unidades en esta página')).toBeInTheDocument()
    expect(within(summary).getByText('40')).toBeInTheDocument()
    expect(within(summary).getByText('Valor a costo en esta página')).toBeInTheDocument()
    expect(within(summary).getByText('Gs. 1.000.000')).toBeInTheDocument()

    const table = screen.getByTestId('stock-levels-table')
    expect(within(table).getByText('CAMISETA ADIDAS')).toBeInTheDocument()
    expect(within(table).getByText('Sobre-stock')).toBeInTheDocument()
    expect(within(table).getByText('MOUSE GOLITEC')).toBeInTheDocument()
    expect(within(table).getByText('Sin stock')).toBeInTheDocument()
    expect(within(table).getByText('Sin ventas 30 d')).toBeInTheDocument()
    expect(within(table).getByText('12')).toBeInTheDocument()

    expect(screen.getByText('Página 1 de 3 (21 items)')).toBeInTheDocument()

    for (const fabricated of ['$', 'Live', 'Objetivo']) {
      expect(screen.queryByText(fabricated)).toBeNull()
    }
  })

  it('cambia el filtro server-side y vuelve a la página 1', async () => {
    const user = userEvent.setup()
    renderInventoryPage(<StockLevelsPage />, {
      route: '/inventory-analytics/stock-levels',
    })
    await screen.findByTestId('stock-levels-table')

    await user.click(screen.getByRole('tab', { name: 'Sin stock' }))

    await waitFor(() =>
      expect(inventoryAnalyticsService.getStockLevels).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 10,
        status: 'OUT_OF_STOCK',
        sort_by: 'stock',
        sort_order: 'DESC',
      }),
    )
  })

  it('ordena server-side por valor y alterna el sentido', async () => {
    const user = userEvent.setup()
    renderInventoryPage(<StockLevelsPage />, {
      route: '/inventory-analytics/stock-levels',
    })
    await screen.findByTestId('stock-levels-table')

    const valueSort = () =>
      screen.getByRole('button', { name: 'Valor (costo): ordenar (descendente)' })

    await user.click(valueSort())
    await waitFor(() =>
      expect(inventoryAnalyticsService.getStockLevels).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, sort_by: 'value', sort_order: 'DESC' }),
      ),
    )

    await user.click(valueSort())
    await waitFor(() =>
      expect(inventoryAnalyticsService.getStockLevels).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'value', sort_order: 'ASC' }),
      ),
    )
  })

  it('pagina server-side con el pager del BE', async () => {
    const user = userEvent.setup()
    renderInventoryPage(<StockLevelsPage />, {
      route: '/inventory-analytics/stock-levels',
    })
    await screen.findByTestId('stock-levels-table')

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))

    await waitFor(() =>
      expect(inventoryAnalyticsService.getStockLevels).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('no presenta Gs. 0 en reposición cuando falta el costo unitario', async () => {
    renderInventoryPage(<StockLevelsPage />, {
      route: '/inventory-analytics/stock-levels',
    })

    const summary = await screen.findByTestId('inventory-reorder-summary')
    expect(within(summary).getByText('Productos a reponer')).toBeInTheDocument()
    expect(within(summary).getByText('2')).toBeInTheDocument()
    expect(within(summary).getByText('Urgentes')).toBeInTheDocument()
    expect(within(summary).getByText('Próximos')).toBeInTheDocument()
    expect(within(summary).getByText('Costo estimado')).toBeInTheDocument()
    expect(within(summary).getByText('—')).toBeInTheDocument()
    expect(
      screen.getByText('El reporte no tiene costo unitario para estos productos.'),
    ).toBeInTheDocument()

    const table = screen.getByTestId('inventory-reorder-table')
    expect(within(table).getByText('MOUSE GOLITEC')).toBeInTheDocument()
    expect(within(table).getByText('Urgente')).toBeInTheDocument()
    expect(within(table).getByText('Sin ventas 30 d')).toBeInTheDocument()
    expect(within(table).getAllByLabelText('Sin costo').length).toBeGreaterThan(0)
    expect(within(table).queryByText('Gs. 0')).toBeNull()
  })

  it('muestra el empty honesto cuando el filtro no devuelve filas', async () => {
    vi.mocked(inventoryAnalyticsService.getStockLevels).mockResolvedValue(
      inventoryEnvelope({
        ...LEVELS,
        products: [],
        summary: { ...LEVELS.summary, total_products: 0, total_units: 0, total_value: 0 },
        pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 0 },
      }) as never,
    )
    renderInventoryPage(<StockLevelsPage />, {
      route: '/inventory-analytics/stock-levels',
    })

    expect(await screen.findByText('Sin productos con ese filtro')).toBeInTheDocument()
    expect(screen.getByText('Probá con otro estado.')).toBeInTheDocument()
  })
})
