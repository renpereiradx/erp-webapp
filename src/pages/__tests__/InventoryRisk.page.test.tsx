/**
 * InventoryRiskPage (F5) — stock sin venta para un umbral real, recomendación
 * i18n derivada de los días (no el texto en español del BE), sin la "pérdida
 * potencial" hardcodeada (30 %) y antigüedad del stock por tramos.
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
import InventoryRiskPage from '../inventory-analytics/InventoryRiskPage'

const deadProduct = (overrides: Record<string, unknown>) => ({
  product_id: 'P-1',
  product_name: 'MOUSE GOLITEC',
  sku: 'P-1',
  category_name: 'TECNOLOGIA',
  product_type: 'PHYSICAL',
  current_stock: 10,
  stock_value: 500000,
  last_sale_date: '2026-04-01T12:00:00Z',
  days_since_last_sale: 200,
  last_movement_date: '2026-03-01T12:00:00Z',
  days_since_movement: 230,
  recommendation: 'Considerar liquidación o descontinuar',
  ...overrides,
})

const DEAD_STOCK = {
  generated_at: '2026-10-20T12:00:00Z',
  summary: {
    total_products: 9,
    total_units: 20,
    total_value: 2149350,
    percentage_of_stock: 31.31,
    average_days_idle: 145.2,
    potential_loss: 644805,
  },
  products: [
    deadProduct({}),
    deadProduct({
      product_id: 'P-2',
      product_name: 'TECLADO BASICO',
      sku: 'P-2',
      days_since_last_sale: 130,
      days_since_movement: 140,
      recommendation: 'Aplicar descuento significativo',
    }),
    deadProduct({
      product_id: 'P-3',
      product_name: 'CABLE HDMI',
      sku: 'P-3',
      days_since_last_sale: 100,
      days_since_movement: 110,
      recommendation: 'Promocionar activamente',
    }),
  ],
  by_category: null,
  recommendations: ['Alto porcentaje de stock muerto. Revisar política de compras.'],
}

const AGING = {
  generated_at: '2026-10-20T12:00:00Z',
  summary: {
    total_products: 10,
    total_units: 20,
    total_value: 10000,
    average_age_days: 76.4,
    old_stock_value: 2500,
    old_stock_pct: 25,
  },
  buckets: [
    {
      label: '0-30 días',
      min_days: 0,
      max_days: 30,
      product_count: 3,
      total_units: 6,
      total_value: 3000,
      percentage: 30,
    },
    {
      label: '91-180 días',
      min_days: 91,
      max_days: 180,
      product_count: 2,
      total_units: 4,
      total_value: 2500,
      percentage: 25,
    },
    {
      label: '180+ días',
      min_days: 181,
      max_days: 9999,
      product_count: 5,
      total_units: 10,
      total_value: 4500,
      percentage: 45,
    },
  ],
  products: null,
}

describe('InventoryRiskPage (F5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inventoryAnalyticsService.getDeadStock).mockResolvedValue(
      inventoryEnvelope(DEAD_STOCK) as never,
    )
    vi.mocked(inventoryAnalyticsService.getStockAging).mockResolvedValue(
      inventoryEnvelope(AGING) as never,
    )
  })

  it('muestra KPIs, recomendaciones i18n y antigüedad real', async () => {
    renderInventoryPage(<InventoryRiskPage />, {
      route: '/inventory-analytics/risk',
    })

    expect(await screen.findByTestId('dead-stock-kpi-ledger')).toBeInTheDocument()
    expect(screen.getByTestId('inventory-kpi-products')).toHaveTextContent('9')
    expect(screen.getByTestId('inventory-kpi-units')).toHaveTextContent('20')
    expect(screen.getByTestId('inventory-kpi-value')).toHaveTextContent('Gs. 2.149.350')
    expect(screen.getByTestId('inventory-kpi-percentage')).toHaveTextContent('31,3%')
    expect(screen.getByTestId('inventory-kpi-avgDays')).toHaveTextContent('145 días')
    expect(screen.getByTestId('inventory-kpi-products')).toHaveTextContent(
      'Sin ventas en los últimos 90 días',
    )

    const table = screen.getByTestId('dead-stock-table')
    expect(within(table).getByText('MOUSE GOLITEC')).toBeInTheDocument()
    expect(within(table).getByText('Evaluar descontinuar')).toBeInTheDocument()
    expect(within(table).getByText('Aplicar descuento')).toBeInTheDocument()
    expect(within(table).getByText('Promocionar')).toBeInTheDocument()
    expect(within(table).getByText('200')).toBeInTheDocument()
    expect(within(table).getByText('130')).toBeInTheDocument()
    expect(within(table).getByText('100')).toBeInTheDocument()
    expect(within(table).queryByText('Considerar liquidación o descontinuar')).toBeNull()

    expect(screen.getByTestId('aging-summary')).toHaveTextContent(
      'Antigüedad promedio: 76 días · Más de 90 días: 25% del valor',
    )
    const aging = screen.getByTestId('aging-table')
    expect(within(aging).getByText('0-30 días')).toBeInTheDocument()
    expect(within(aging).getByText('91-180 días')).toBeInTheDocument()
    expect(within(aging).getByText('Más de 180 días')).toBeInTheDocument()

    for (const fabricated of ['Pérdida potencial', 'Gs. 644.805', '$', 'Live']) {
      expect(screen.queryByText(fabricated)).toBeNull()
    }
  })

  it('cambia el umbral de días sin venta contra el endpoint', async () => {
    const user = userEvent.setup()
    renderInventoryPage(<InventoryRiskPage />, {
      route: '/inventory-analytics/risk',
    })
    await screen.findByTestId('dead-stock-table')

    await user.click(screen.getByRole('tab', { name: '120 días' }))

    await waitFor(() =>
      expect(inventoryAnalyticsService.getDeadStock).toHaveBeenLastCalledWith({ days: 120 }),
    )
    expect(await screen.findByTestId('dead-stock-table')).toBeInTheDocument()
  })

  it('muestra el empty honesto de stock muerto y antigüedad', async () => {
    vi.mocked(inventoryAnalyticsService.getDeadStock).mockResolvedValue(
      inventoryEnvelope({
        ...DEAD_STOCK,
        summary: {
          ...DEAD_STOCK.summary,
          total_products: 0,
          total_units: 0,
          total_value: 0,
          percentage_of_stock: 0,
          average_days_idle: 0,
        },
        products: [],
      }) as never,
    )
    vi.mocked(inventoryAnalyticsService.getStockAging).mockResolvedValue(
      inventoryEnvelope({ ...AGING, buckets: [] }) as never,
    )
    renderInventoryPage(<InventoryRiskPage />, {
      route: '/inventory-analytics/risk',
    })

    expect(await screen.findByText('Sin stock muerto para este umbral')).toBeInTheDocument()
    expect(screen.getByText('Sin stock para analizar')).toBeInTheDocument()
  })

  it('muestra error y retry si falla el endpoint', async () => {
    vi.mocked(inventoryAnalyticsService.getDeadStock).mockRejectedValue(new Error('offline'))
    renderInventoryPage(<InventoryRiskPage />, {
      route: '/inventory-analytics/risk',
    })

    expect((await screen.findAllByText('No se pudieron cargar los datos')).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('error-retry').length).toBeGreaterThan(0)
  })
})
