/**
 * F11 — Pronóstico de ventas: KPIs, métricas de ajuste sin maquillar, bandas
 * según el método, etiquetas de bucket re-derivadas (no el label inglés),
 * estacionalidad traducida y SEASONAL deshabilitado si la historia es corta.
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
  forecastService: { getSalesForecast: vi.fn() },
}))

import { forecastService } from '@/services/bi/forecastService'
import {
  forecastEnvelope,
  renderForecastPage,
  salesForecastFixture,
} from './forecastTestUtils'
import SalesForecastPage from '../forecast/SalesForecastPage'

const kpi = (id: string) => within(screen.getByTestId(`forecast-kpi-${id}`))
const tablist = (name: string) => screen.getByRole('tablist', { name })

describe('SalesForecastPage (F11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(forecastService.getSalesForecast).mockResolvedValue(
      forecastEnvelope(salesForecastFixture()) as never,
    )
  })

  it('pide el contrato default (6 meses de historia, 3 de horizonte, lineal mensual)', async () => {
    renderForecastPage(<SalesForecastPage />, { route: '/bi/pronosticos/ventas' })
    await screen.findByTestId('forecast-sales-kpis')

    expect(forecastService.getSalesForecast).toHaveBeenCalledWith({
      history_months: 6,
      forecast_months: 3,
      method: 'LINEAR',
      granularity: 'MONTHLY',
    })
  })

  it('muestra los KPIs reales del backend', async () => {
    renderForecastPage(<SalesForecastPage />, { route: '/bi/pronosticos/ventas' })
    await screen.findByTestId('forecast-sales-kpis')

    expect(kpi('historicalTotal').getByText('Gs. 1.000.000')).toBeInTheDocument()
    expect(kpi('projectedTotal').getByText('Gs. 7.572.047')).toBeInTheDocument()
    expect(kpi('projectedAverage').getByText('Gs. 2.524.016')).toBeInTheDocument()
    expect(kpi('growth').getByText('+58,8%')).toBeInTheDocument()
    expect(kpi('confidence').getByText('6,9%')).toBeInTheDocument()
  })

  it('muestra las métricas de ajuste y la banda del método lineal', async () => {
    renderForecastPage(<SalesForecastPage />, { route: '/bi/pronosticos/ventas' })
    const model = await screen.findByTestId('forecast-sales-model')

    expect(within(model).getByText('Regresión lineal')).toBeInTheDocument()
    expect(within(model).getByTestId('forecast-model-confidence')).toHaveTextContent('6,9%')
    expect(within(model).getByTestId('forecast-model-r2')).toHaveTextContent('0,07')
    expect(within(model).getByTestId('forecast-model-mae')).toHaveTextContent(
      'Gs. 1.166.347',
    )
    expect(within(model).getByTestId('forecast-model-mape')).toHaveTextContent('334,4%')
    expect(within(model).getByTestId('forecast-model-rmse')).toHaveTextContent(
      'Gs. 1.450.000',
    )
    expect(within(model).getByText(/±15 %/)).toBeInTheDocument()
    expect(within(model).getByText(/0,85 y 1,15/)).toBeInTheDocument()
  })

  it('re-deriva las etiquetas de bucket y no usa el label inglés', async () => {
    const { container } = renderForecastPage(<SalesForecastPage />, {
      route: '/bi/pronosticos/ventas',
    })
    const history = await screen.findByTestId('forecast-sales-history-table')

    expect(within(history).getByText(/abr/i)).toBeInTheDocument()
    expect(within(history).getByText(/jun/i)).toBeInTheDocument()
    expect(container.textContent).not.toContain('Apr 2026')
    expect(container.textContent).not.toContain('Jun 2026')
  })

  it('muestra la proyección con su banda absoluta', async () => {
    renderForecastPage(<SalesForecastPage />, { route: '/bi/pronosticos/ventas' })
    const projection = await screen.findByTestId('forecast-sales-projection-table')

    expect(within(projection).getByText('Gs. 2.316.356')).toBeInTheDocument()
    expect(within(projection).getByText('Gs. 1.968.903')).toBeInTheDocument()
    expect(within(projection).getByText('Gs. 2.663.809')).toBeInTheDocument()
    expect(within(projection).getAllByText('Proyección')).toHaveLength(2)
  })

  it('traduce la estacionalidad del backend', async () => {
    renderForecastPage(<SalesForecastPage />, { route: '/bi/pronosticos/ventas' })
    const seasonality = await screen.findByTestId('forecast-sales-seasonality')

    expect(within(seasonality).getByText('Meses pico')).toBeInTheDocument()
    expect(within(seasonality).getAllByText(/oct/i).length).toBeGreaterThan(0)
    expect(within(seasonality).getAllByText(/feb/i).length).toBeGreaterThan(0)
    expect(within(seasonality).getByText('1,3')).toBeInTheDocument()
  })

  it('cambia horizonte, historial y método lineal/móvil/exponencial', async () => {
    renderForecastPage(<SalesForecastPage />, { route: '/bi/pronosticos/ventas' })
    await screen.findByTestId('forecast-sales-kpis')

    // SEASONAL no se ofrece: el BE exige ≥ 12 puntos con ventas y puede 400.
    expect(
      within(tablist('Método')).queryByRole('tab', {
        name: 'Descomposición estacional',
      }),
    ).toBeNull()

    fireEvent.click(within(tablist('Horizonte')).getByRole('tab', { name: '6 meses' }))
    await waitFor(() =>
      expect(forecastService.getSalesForecast).toHaveBeenLastCalledWith(
        expect.objectContaining({ forecast_months: 6 }),
      ),
    )

    fireEvent.click(within(tablist('Historial')).getByRole('tab', { name: '12 meses' }))
    await waitFor(() =>
      expect(forecastService.getSalesForecast).toHaveBeenLastCalledWith(
        expect.objectContaining({ history_months: 12 }),
      ),
    )

    fireEvent.click(within(tablist('Método')).getByRole('tab', { name: 'Media móvil' }))
    await waitFor(() =>
      expect(forecastService.getSalesForecast).toHaveBeenLastCalledWith(
        expect.objectContaining({ method: 'MOVING_AVG' }),
      ),
    )
  })

  it('muestra un empty honesto sin historial suficiente', async () => {
    vi.mocked(forecastService.getSalesForecast).mockResolvedValue(
      forecastEnvelope(
        salesForecastFixture({ historical_data: [], forecast_data: [], summary: {} }),
      ) as never,
    )
    renderForecastPage(<SalesForecastPage />, { route: '/bi/pronosticos/ventas' })

    expect(await screen.findByTestId('forecast-sales-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('forecast-sales-kpis')).toBeNull()
  })

  it('propaga el error con retry y sin cifras silenciosas', async () => {
    vi.mocked(forecastService.getSalesForecast).mockRejectedValueOnce(
      new Error('boom'),
    )
    renderForecastPage(<SalesForecastPage />, { route: '/bi/pronosticos/ventas' })

    expect(await screen.findByText('No se pudieron cargar los pronósticos')).toBeInTheDocument()
    expect(screen.queryByTestId('forecast-sales-kpis')).toBeNull()
  })
})
