/**
 * F11 — Pronóstico de ingresos: KPIs, escenarios del backend (pesos 20/60/20,
 * base ±15 %) sin el texto en español, serie mensual con banda absoluta y
 * participación por categoría sin una proyección inventada por categoría.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      if (!fallback) return key
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null
          ? fallbackOrVars
          : maybeVars) ?? {}
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      )
    },
  }),
}))

vi.mock('@/services/bi/forecastService', () => ({
  forecastService: { getRevenueForecast: vi.fn() },
}))

import { forecastService } from '@/services/bi/forecastService'
import {
  forecastEnvelope,
  renderForecastPage,
  revenueForecastFixture,
} from './forecastTestUtils'
import RevenueForecastPage from '../forecast/RevenueForecastPage'

const kpi = (id: string) => within(screen.getByTestId(`forecast-kpi-${id}`))
const tablist = (name: string) => screen.getByRole('tablist', { name })

describe('RevenueForecastPage (F11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(forecastService.getRevenueForecast).mockResolvedValue(
      forecastEnvelope(revenueForecastFixture()) as never,
    )
  })

  it('pide el contrato default con escenarios', async () => {
    renderForecastPage(<RevenueForecastPage />, { route: '/bi/pronosticos/ingresos' })
    await screen.findByTestId('forecast-revenue-kpis')

    expect(forecastService.getRevenueForecast).toHaveBeenCalledWith({
      history_months: 12,
      forecast_months: 3,
      include_scenarios: true,
    })
  })

  it('muestra los KPIs reales', async () => {
    renderForecastPage(<RevenueForecastPage />, { route: '/bi/pronosticos/ingresos' })
    await screen.findByTestId('forecast-revenue-kpis')

    expect(kpi('historicalRevenue').getByText('Gs. 4.837.175')).toBeInTheDocument()
    expect(kpi('forecastRevenue').getByText('Gs. 1.767.000')).toBeInTheDocument()
    expect(kpi('annualProjection').getByText('Gs. 3.534.000')).toBeInTheDocument()
    expect(kpi('growth').getByText('+58,8%')).toBeInTheDocument()
    expect(kpi('confidence').getByText('6,9%')).toBeInTheDocument()
  })

  it('ordena los escenarios y usa el peso/importe del modelo, no el texto del BE', async () => {
    const { container } = renderForecastPage(<RevenueForecastPage />, {
      route: '/bi/pronosticos/ingresos',
    })
    const cards = await screen.findByTestId('forecast-scenario-cards')

    const pessimistic = within(cards).getByTestId('forecast-scenario-pessimistic')
    expect(within(pessimistic).getByText('Pesimista')).toBeInTheDocument()
    expect(within(pessimistic).getByText('Gs. 1.501.950')).toBeInTheDocument()
    expect(within(pessimistic).getByText('20%')).toBeInTheDocument()
    expect(within(pessimistic).getByText('+43,8%')).toBeInTheDocument()

    const baseline = within(cards).getByTestId('forecast-scenario-baseline')
    expect(within(baseline).getByText('Gs. 1.767.000')).toBeInTheDocument()
    expect(within(baseline).getByText('60%')).toBeInTheDocument()

    const optimistic = within(cards).getByTestId('forecast-scenario-optimistic')
    expect(within(optimistic).getByText('Gs. 2.032.050')).toBeInTheDocument()
    expect(within(optimistic).getByText('+73,8%')).toBeInTheDocument()

    expect(container.textContent).not.toContain('condiciones favorables')
    expect(container.textContent).not.toContain('factores adversos')
    expect(container.textContent).not.toContain('Proyeccion basada')
  })

  it('muestra la serie mensual ordenada con banda absoluta', async () => {
    renderForecastPage(<RevenueForecastPage />, { route: '/bi/pronosticos/ingresos' })
    const table = await screen.findByTestId('forecast-revenue-monthly-table')
    const rows = within(table).getAllByRole('row').slice(1)

    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText(/sep/i)).toBeInTheDocument()
    expect(within(rows[0]).getByText('Histórico')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Gs. 551.760')).toBeInTheDocument()

    expect(within(rows[1]).getByText('Proyección')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Gs. 2.316.356')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Gs. 1.968.903')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Gs. 2.663.809')).toBeInTheDocument()

    expect(within(rows[2]).getByText(/nov/i)).toBeInTheDocument()
  })

  it('muestra la participación por categoría sin proyección por categoría', async () => {
    renderForecastPage(<RevenueForecastPage />, { route: '/bi/pronosticos/ingresos' })
    const table = await screen.findByTestId('forecast-revenue-categories-table')

    const electronics = within(table).getByText('Electrónicos').closest('tr') as HTMLElement
    expect(within(electronics).getByText('Gs. 300.000')).toBeInTheDocument()
    expect(within(electronics).getByText('56,6%')).toBeInTheDocument()

    const drinks = within(table).getByText('Bebidas').closest('tr') as HTMLElement
    expect(within(drinks).getByText('Gs. 2.400')).toBeInTheDocument()
    expect(within(drinks).getByText('0,5%')).toBeInTheDocument()

    expect(within(table).queryByText('Proyectado')).toBeNull()
  })

  it('cambia el horizonte a 12 meses', async () => {
    renderForecastPage(<RevenueForecastPage />, { route: '/bi/pronosticos/ingresos' })
    await screen.findByTestId('forecast-revenue-kpis')

    fireEvent.click(within(tablist('Horizonte')).getByRole('tab', { name: '12 meses' }))
    await waitFor(() =>
      expect(forecastService.getRevenueForecast).toHaveBeenLastCalledWith({
        history_months: 12,
        forecast_months: 12,
        include_scenarios: true,
      }),
    )
  })

  it('explica la extrapolación anual y el método', async () => {
    renderForecastPage(<RevenueForecastPage />, { route: '/bi/pronosticos/ingresos' })
    const notes = await screen.findByTestId('forecast-revenue-notes')

    expect(within(notes).getByText(/extrapola el horizonte/)).toBeInTheDocument()
    expect(within(notes).getByText(/regresión lineal/)).toBeInTheDocument()
  })

  it('propaga el error del endpoint', async () => {
    vi.mocked(forecastService.getRevenueForecast).mockRejectedValueOnce(new Error('boom'))
    renderForecastPage(<RevenueForecastPage />, { route: '/bi/pronosticos/ingresos' })

    expect(await screen.findByText('No se pudieron cargar los pronósticos')).toBeInTheDocument()
    expect(screen.queryByTestId('forecast-revenue-kpis')).toBeNull()
  })
})
