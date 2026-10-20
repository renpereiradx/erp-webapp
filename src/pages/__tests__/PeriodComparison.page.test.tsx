/**
 * PeriodComparisonPage (F4) — comparación A/B contra `/sales-analytics/compare`:
 * porcentajes redondeados, variaciones relativas (sin "pp") y modo de rangos
 * personalizados que no dispara requests con fechas inválidas.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
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

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  salesAnalyticsService: {
    getComparison: vi.fn(),
  },
}))

import { salesAnalyticsService } from '@/services/bi/salesAnalyticsService'
import { envelope, renderSalesPage } from './salesAnalyticsTestUtils'
import PeriodComparisonPage from '../sales-analytics/PeriodComparisonPage'

const COMPARISON = {
  period_1: {
    period: { start_date: '2026-09-01T00:00:00Z', end_date: '2026-10-01T00:00:00Z' },
    total_sales: 551760,
    total_transactions: 8,
    total_units: 15,
    average_ticket: 68970,
    unique_customers: 4,
    gross_margin: 289260,
  },
  period_2: {
    period: { start_date: '2026-08-01T00:00:00Z', end_date: '2026-09-01T00:00:00Z' },
    total_sales: 2407523,
    total_transactions: 13,
    total_units: 31,
    average_ticket: 185194,
    unique_customers: 5,
    gross_margin: 419200,
  },
  differences: {
    sales_change: -1855763,
    sales_change_pct: -77.08183888585903,
    transactions_change: -5,
    transactions_change_pct: -38.46153846153847,
    units_change: -16,
    units_change_pct: -51.61290322580645,
    ticket_change: -116224,
    ticket_change_pct: -62.75798818952093,
    customers_change: -1,
    customers_change_pct: -20,
    margin_change: -129940,
    margin_change_pct: -30.997,
  },
}

describe('PeriodComparisonPage (F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesAnalyticsService.getComparison).mockResolvedValue(
      envelope(COMPARISON) as never,
    )
  })

  it('compara el período actual contra la ventana previa equivalente', async () => {
    renderSalesPage(<PeriodComparisonPage />)

    await waitFor(() =>
      expect(screen.getByTestId('comparison-table')).toHaveTextContent('Ventas'),
    )
    expect(salesAnalyticsService.getComparison).toHaveBeenCalledWith({ period: 'month' })

    const table = screen.getByTestId('comparison-table')
    expect(table).toHaveTextContent('Gs. 551.760')
    expect(table).toHaveTextContent('Gs. 2.407.523')
    expect(table).toHaveTextContent('- Gs. 1.855.763')
    expect(table).toHaveTextContent('-77,1%')
    // Rangos con fin inclusivo (el fin del BE es exclusivo).
    expect(screen.getByText(/30 sept 2026/)).toBeInTheDocument()
  })

  it('redondea los porcentajes y no habla de puntos porcentuales', async () => {
    renderSalesPage(<PeriodComparisonPage />)

    await waitFor(() => expect(screen.getByTestId('comparison-table')).toBeInTheDocument())
    expect(screen.getByTestId('comparison-table')).not.toHaveTextContent('77.081838')
    expect(screen.queryByText(/\bpp\b/)).not.toBeInTheDocument()
    expect(screen.queryByText(/puntos porcentuales/i)).not.toBeInTheDocument()
  })

  it('en rangos personalizados compara las 4 fechas elegidas', async () => {
    const user = userEvent.setup()
    renderSalesPage(<PeriodComparisonPage />)

    await waitFor(() => expect(salesAnalyticsService.getComparison).toHaveBeenCalled())
    await user.click(screen.getByRole('tab', { name: 'Rangos personalizados' }))

    await waitFor(() =>
      expect(salesAnalyticsService.getComparison).toHaveBeenCalledWith(
        expect.objectContaining({
          start1: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          end1: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          start2: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          end2: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      ),
    )

    fireEvent.change(document.getElementById('comparison-start2') as HTMLInputElement, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.getElementById('comparison-end2') as HTMLInputElement, {
      target: { value: '2026-07-31' },
    })
    await user.click(screen.getByRole('button', { name: 'Comparar' }))

    await waitFor(() =>
      expect(salesAnalyticsService.getComparison).toHaveBeenLastCalledWith(
        expect.objectContaining({
          start2: '2026-07-01',
          end2: '2026-07-31',
        }),
      ),
    )
  })

  it('un rango invertido muestra el aviso y no se aplica', async () => {
    const user = userEvent.setup()
    renderSalesPage(<PeriodComparisonPage />)

    await waitFor(() => expect(salesAnalyticsService.getComparison).toHaveBeenCalled())
    await user.click(screen.getByRole('tab', { name: 'Rangos personalizados' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Comparar' })).toBeInTheDocument())
    // El modo personalizado aplica el rango default al entrar; esperamos esa
    // request antes de medir que el rango inválido NO dispara otra.
    await waitFor(() =>
      expect(salesAnalyticsService.getComparison).toHaveBeenLastCalledWith(
        expect.objectContaining({
          start1: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      ),
    )

    const callsBefore = vi.mocked(salesAnalyticsService.getComparison).mock.calls.length
    fireEvent.change(document.getElementById('comparison-start1') as HTMLInputElement, {
      target: { value: '2026-10-10' },
    })
    fireEvent.change(document.getElementById('comparison-end1') as HTMLInputElement, {
      target: { value: '2026-10-01' },
    })

    expect(
      screen.getByText(
        'Cada rango debe tener una fecha válida con "Desde" no posterior a "Hasta".',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Comparar' }))
    expect(vi.mocked(salesAnalyticsService.getComparison).mock.calls.length).toBe(callsBefore)
  })

  it('sin ventas en ninguno de los períodos muestra el empty state', async () => {
    vi.mocked(salesAnalyticsService.getComparison).mockResolvedValue(
      envelope({
        ...COMPARISON,
        period_1: {
          ...COMPARISON.period_1,
          total_sales: 0,
          total_transactions: 0,
          total_units: 0,
          unique_customers: 0,
        },
        period_2: {
          ...COMPARISON.period_2,
          total_sales: 0,
          total_transactions: 0,
          total_units: 0,
          unique_customers: 0,
        },
      }) as never,
    )
    renderSalesPage(<PeriodComparisonPage />)

    await waitFor(() =>
      expect(screen.getByText('Sin ventas en ninguno de los períodos')).toBeInTheDocument(),
    )
  })
})
