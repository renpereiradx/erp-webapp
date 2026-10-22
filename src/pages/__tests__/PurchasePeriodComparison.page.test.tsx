/**
 * PurchasePeriodComparisonPage — modo período (vs ventana previa) y modo
 * rangos personalizados. Un rango inválido bloquea el request; las
 * variaciones son relativas y los rangos se muestran inclusivos.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
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

vi.mock('@/services/bi/purchaseAnalyticsService', () => ({
  purchaseAnalyticsService: {
    getPerformance: vi.fn(),
    getTrends: vi.fn(),
    getByCategory: vi.fn(),
    getByProduct: vi.fn(),
    getBySupplier: vi.fn(),
    getByBuyer: vi.fn(),
    getByPaymentMethod: vi.fn(),
    getByHour: vi.fn(),
    getByDayOfWeek: vi.fn(),
    getComparison: vi.fn(),
  },
}))

import { purchaseAnalyticsService } from '@/services/bi/purchaseAnalyticsService'
import { envelope, renderPurchasePage } from './purchaseAnalyticsTestUtils'
import PurchasePeriodComparisonPage from '../purchase-analytics/PurchasePeriodComparisonPage'

const COMPARISON = {
  period_1: {
    period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
    total_purchases: 275000,
    total_transactions: 2,
    total_units: 40,
    average_order: 137500,
    unique_suppliers: 1,
  },
  period_2: {
    period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
    total_purchases: 200000,
    total_transactions: 4,
    total_units: 20,
    average_order: 50000,
    unique_suppliers: 2,
  },
  differences: {
    purchases_change: 75000,
    purchases_change_pct: 37.5,
    transactions_change: -2,
    transactions_change_pct: -50,
    units_change: 20,
    units_change_pct: 100,
    order_change: 87500,
    order_change_pct: 175,
    suppliers_change: -1,
    suppliers_change_pct: -50,
  },
}

describe('PurchasePeriodComparisonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(purchaseAnalyticsService.getComparison).mockResolvedValue(
      envelope(COMPARISON) as never,
    )
  })

  it('modo período compara contra la ventana previa sin fechas explícitas', async () => {
    renderPurchasePage(<PurchasePeriodComparisonPage />, {
      route: '/purchase-analytics/period-comparison',
    })

    expect(await screen.findByTestId('purchase-comparison-table')).toBeInTheDocument()
    expect(purchaseAnalyticsService.getComparison).toHaveBeenCalledWith({ period: 'month' })
    // Las 5 métricas del contrato, con variación relativa.
    expect(screen.getByText('Compras')).toBeInTheDocument()
    expect(screen.getByText('Proveedores')).toBeInTheDocument()
    expect(screen.getByText('+37,5%')).toBeInTheDocument()
  })

  it('los rangos se muestran con el end_date inclusivo (día anterior)', async () => {
    renderPurchasePage(<PurchasePeriodComparisonPage />, {
      route: '/purchase-analytics/period-comparison',
    })

    expect(await screen.findByTestId('purchase-comparison-table')).toBeInTheDocument()
    expect(screen.getAllByText(/31 oct/i).length).toBeGreaterThan(0)
  })

  it('sin base comparable no inventa un 0% (muestra solo el delta)', async () => {
    vi.mocked(purchaseAnalyticsService.getComparison).mockResolvedValue(
      envelope({
        ...COMPARISON,
        differences: {
          ...COMPARISON.differences,
          purchases_change: 100000,
          purchases_change_pct: 0,
        },
      }) as never,
    )
    renderPurchasePage(<PurchasePeriodComparisonPage />, {
      route: '/purchase-analytics/period-comparison',
    })

    expect(await screen.findByTestId('purchase-comparison-table')).toBeInTheDocument()
    expect(screen.queryByText('0%')).toBeNull()
  })

  it('modo personalizado aplica solo con "Comparar" y valida el rango', async () => {
    const user = userEvent.setup()
    renderPurchasePage(<PurchasePeriodComparisonPage />, {
      route: '/purchase-analytics/period-comparison',
    })

    await screen.findByText('Rangos personalizados')
    await user.click(screen.getByText('Rangos personalizados'))

    const start1 = screen.getAllByLabelText('Desde')[0]
    await user.clear(start1)
    await user.type(start1, '2026-10-15')

    // Rango 1 invertido: el aviso aparece y "Comparar" no dispara request nuevo.
    const end1 = screen.getAllByLabelText('Hasta')[0]
    await user.clear(end1)
    await user.type(end1, '2026-09-01')
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    const callsBefore = vi.mocked(purchaseAnalyticsService.getComparison).mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Comparar' }))
    expect(vi.mocked(purchaseAnalyticsService.getComparison).mock.calls.length).toBe(callsBefore)
  })

  it('sin compras en ninguna ventana muestra el empty honesto', async () => {
    vi.mocked(purchaseAnalyticsService.getComparison).mockResolvedValue(
      envelope({
        ...COMPARISON,
        period_1: { ...COMPARISON.period_1, total_purchases: 0, total_transactions: 0, total_units: 0 },
        period_2: { ...COMPARISON.period_2, total_purchases: 0, total_transactions: 0, total_units: 0 },
      }) as never,
    )
    renderPurchasePage(<PurchasePeriodComparisonPage />, {
      route: '/purchase-analytics/period-comparison',
    })

    expect(await screen.findByText(/Sin compras en ninguna de las ventanas/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByTestId('purchase-comparison-table')).toBeNull()
    })
  })
})
