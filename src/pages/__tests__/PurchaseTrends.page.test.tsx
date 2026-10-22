/**
 * PurchaseTrendsPage — serie con granularidad derivada + perfil horario y
 * semanal. `peak_hour` y `best_day` salen del payload, nunca hardcodeados.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

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
import PurchaseTrendsPage from '../purchase-analytics/PurchaseTrendsPage'

const PERIOD = { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' }

const TRENDS = {
  period: PERIOD,
  granularity: 'daily',
  data_points: [
    {
      timestamp: '2026-10-06T10:45:47Z',
      label: '06 Oct',
      purchases: 275000,
      transactions: 2,
      units: 40,
      average_order: 137500,
    },
  ],
  summary: {
    trend_direction: 'UP',
    growth_rate: 175,
    peak_period: '06 Oct',
    peak_value: 275000,
    low_period: '06 Oct',
    low_value: 275000,
    volatility: 0,
  },
}

const HOURLY = {
  period: PERIOD,
  hourly_data: [{ hour: 10, purchases: 275000, transactions: 2, percentage: 100 }],
  peak_hour: 10,
  peak_purchases: 275000,
}

const WEEKDAY = {
  period: PERIOD,
  daily_data: [
    {
      day_of_week: 2,
      day_name: 'Martes',
      purchases: 275000,
      transactions: 2,
      average_order: 137500,
      percentage: 100,
    },
  ],
  best_day: 'Martes',
  best_purchases: 275000,
}

describe('PurchaseTrendsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(purchaseAnalyticsService.getTrends).mockResolvedValue(envelope(TRENDS) as never)
    vi.mocked(purchaseAnalyticsService.getByHour).mockResolvedValue(envelope(HOURLY) as never)
    vi.mocked(purchaseAnalyticsService.getByDayOfWeek).mockResolvedValue(
      envelope(WEEKDAY) as never,
    )
  })

  it('renderiza la serie con su resumen y los perfiles horario/semanal', async () => {
    renderPurchasePage(<PurchaseTrendsPage />, { route: '/purchase-analytics/trends' })

    expect(await screen.findByTestId('purchase-trend-summary')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-hourly-table')).toHaveTextContent('10:00')
    expect(screen.getByTestId('purchase-weekday-table')).toHaveTextContent('Martes')
  })

  it('la hora pico y el mejor día salen del payload del BE', async () => {
    renderPurchasePage(<PurchaseTrendsPage />, { route: '/purchase-analytics/trends' })

    expect(await screen.findByTestId('purchase-hourly-table')).toBeInTheDocument()
    expect(screen.getByText('Hora pico: 10:00')).toBeInTheDocument()
    expect(screen.getByText('Mejor día: Martes')).toBeInTheDocument()
  })

  it('perfiles sin datos muestran empty honesto (sin ceros silenciosos)', async () => {
    vi.mocked(purchaseAnalyticsService.getByHour).mockResolvedValue(
      envelope({ ...HOURLY, hourly_data: null }) as never,
    )
    vi.mocked(purchaseAnalyticsService.getByDayOfWeek).mockResolvedValue(
      envelope({ ...WEEKDAY, daily_data: null, best_day: '' }) as never,
    )
    renderPurchasePage(<PurchaseTrendsPage />, { route: '/purchase-analytics/trends' })

    expect(await screen.findByTestId('purchase-hourly-table-empty')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-weekday-table-empty')).toBeInTheDocument()
    // Sin best_day el BE manda '': no se renderiza la nota "Mejor día:".
    expect(screen.queryByText(/Mejor día:/)).toBeNull()
  })
})
