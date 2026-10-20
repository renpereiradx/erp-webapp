/**
 * TrendsVelocityPage (F4) — serie, KPIs de velocidad y perfiles por hora/día.
 * La hora pico y el mejor día salen del payload: la pantalla vieja los tenía
 * hardcodeados ("14:00 - 15:00").
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

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

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  salesAnalyticsService: {
    getTrends: vi.fn(),
    getVelocity: vi.fn(),
    getByHour: vi.fn(),
    getByDayOfWeek: vi.fn(),
  },
}))

import { salesAnalyticsService } from '@/services/bi/salesAnalyticsService'
import { envelope, renderSalesPage } from './salesAnalyticsTestUtils'
import TrendsVelocityPage from '../sales-analytics/TrendsVelocityPage'

const TRENDS = {
  period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
  granularity: 'daily',
  data_points: [
    {
      timestamp: '2026-09-14T12:00:00Z',
      label: '14 Sep',
      sales: 301150,
      transactions: 3,
      units: 8,
      average_ticket: 100383.33,
    },
  ],
  summary: {
    trend_direction: 'UP',
    growth_rate: 12.5,
    peak_period: '14 Sep',
    peak_value: 301150,
    low_period: '14 Sep',
    low_value: 301150,
    volatility: 0,
  },
}

const VELOCITY = {
  overall: {
    sales_per_day: 30201.5,
    sales_per_hour: 1258.4,
    transactions_per_day: 0.4,
    transactions_per_hour: 0.02,
    units_per_day: 0.5,
    units_per_hour: 0.02,
    avg_minutes_between_sales: 5400,
  },
  by_product: [
    {
      product_id: 'P-1',
      product_name: 'CAMISETA ADIDAS',
      units_per_day: 6.2,
      sales_per_day: 134770,
      current_stock: 40,
      days_to_sellout: 6.5,
      velocity: 'FAST',
    },
    {
      product_id: 'P-2',
      product_name: 'GORRA NIKE',
      units_per_day: 0.4,
      sales_per_day: 10000,
      current_stock: 0,
      days_to_sellout: 0,
      velocity: 'SLOW',
    },
  ],
  by_category: [],
  period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
}

const HOURLY = {
  hourly_data: [
    { hour: 9, sales: 100000, transactions: 1, percentage: 33.3 },
    { hour: 14, sales: 200000, transactions: 2, percentage: 66.7 },
  ],
  peak_hour: 14,
  peak_sales: 200000,
  period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
}

const WEEKDAY = {
  daily_data: [
    {
      day_of_week: 1,
      day_name: 'Lunes',
      sales: 100000,
      transactions: 1,
      average_ticket: 100000,
      percentage: 25,
    },
    {
      day_of_week: 5,
      day_name: 'Viernes',
      sales: 300000,
      transactions: 3,
      average_ticket: 100000,
      percentage: 75,
    },
  ],
  best_day: 'Viernes',
  best_sales: 300000,
  period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
}

describe('TrendsVelocityPage (F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesAnalyticsService.getTrends).mockResolvedValue(envelope(TRENDS) as never)
    vi.mocked(salesAnalyticsService.getVelocity).mockResolvedValue(envelope(VELOCITY) as never)
    vi.mocked(salesAnalyticsService.getByHour).mockResolvedValue(envelope(HOURLY) as never)
    vi.mocked(salesAnalyticsService.getByDayOfWeek).mockResolvedValue(
      envelope(WEEKDAY) as never,
    )
  })

  it('muestra los KPIs de velocidad con duración legible', async () => {
    renderSalesPage(<TrendsVelocityPage />)

    await waitFor(() =>
      expect(screen.getByTestId('velocity-kpis')).toHaveTextContent('Gs. 30.202'),
    )
    expect(salesAnalyticsService.getVelocity).toHaveBeenCalledWith({ period: 'month' })
    expect(screen.getByTestId('velocity-kpis')).toHaveTextContent('3,8 días')
    expect(screen.getByTestId('velocity-kpis')).toHaveTextContent(
      'Sobre todas las horas del período',
    )
  })

  it('la hora pico viene del payload, no de un literal', async () => {
    renderSalesPage(<TrendsVelocityPage />)

    await waitFor(() => expect(screen.getByTestId('hourly-peak')).toBeInTheDocument())
    expect(screen.getByTestId('hourly-peak')).toHaveTextContent('14:00')
    expect(screen.queryByText(/14:00 - 15:00/)).not.toBeInTheDocument()
    // Grid completo de 24 horas, con ceros reales.
    expect(screen.getAllByTestId(/^bar-hour-/)).toHaveLength(24)
  })

  it('el mejor día se deriva del máximo real del payload', async () => {
    renderSalesPage(<TrendsVelocityPage />)

    await waitFor(() => expect(screen.getByTestId('weekday-best')).toBeInTheDocument())
    expect(screen.getByTestId('weekday-best')).toHaveTextContent('Vie')
    expect(screen.getByTestId('weekday-best')).toHaveTextContent('Gs. 300.000')
    expect(screen.getAllByTestId(/^bar-day-/)).toHaveLength(7)
  })

  it('la tabla de velocidad usa stock real y clasificación del BE', async () => {
    renderSalesPage(<TrendsVelocityPage />)

    await waitFor(() =>
      expect(screen.getByTestId('product-velocity-table')).toHaveTextContent('CAMISETA ADIDAS'),
    )
    const table = screen.getByTestId('product-velocity-table')
    expect(table).toHaveTextContent('Rápida')
    expect(table).toHaveTextContent('Lenta')
    expect(table).toHaveTextContent('Sin stock')
    expect(table).toHaveTextContent('6,5 días')
  })

  it('pide la serie con granularidad diaria para el mes', async () => {
    renderSalesPage(<TrendsVelocityPage />)

    await waitFor(() =>
      expect(salesAnalyticsService.getTrends).toHaveBeenCalledWith({
        period: 'month',
        granularity: 'daily',
      }),
    )
    expect(salesAnalyticsService.getByDayOfWeek).toHaveBeenCalledWith({ period: 'month' })
  })
})
