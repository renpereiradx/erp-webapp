/**
 * F11 — Pronóstico de demanda: categorías completas, top de productos
 * paginado, confianza constante mostrada una vez y crecimiento real de 30/30
 * días.
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
  forecastService: { getDemandForecast: vi.fn() },
}))

import { forecastService } from '@/services/bi/forecastService'
import {
  demandForecastFixture,
  forecastEnvelope,
  renderForecastPage,
} from './forecastTestUtils'
import DemandForecastPage from '../forecast/DemandForecastPage'

const kpi = (id: string) => within(screen.getByTestId(`forecast-kpi-${id}`))
const tablist = (name: string) => screen.getByRole('tablist', { name })

describe('DemandForecastPage (F11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(forecastService.getDemandForecast).mockResolvedValue(
      forecastEnvelope(demandForecastFixture()) as never,
    )
  })

  it('pide el contrato default', async () => {
    renderForecastPage(<DemandForecastPage />, { route: '/bi/pronosticos/demanda' })
    await screen.findByTestId('forecast-demand-kpis')

    expect(forecastService.getDemandForecast).toHaveBeenCalledWith({
      history_months: 6,
      forecast_months: 3,
      page: 1,
      page_size: 10,
    })
  })

  it('muestra KPIs con los extremos reales del payload', async () => {
    renderForecastPage(<DemandForecastPage />, { route: '/bi/pronosticos/demanda' })
    await screen.findByTestId('forecast-demand-kpis')

    expect(kpi('categories').getByText('2')).toBeInTheDocument()
    expect(kpi('historicalUnits').getByText('49')).toBeInTheDocument()
    expect(kpi('forecastUnits').getByText('57')).toBeInTheDocument()
    expect(kpi('topCategoryGrowth').getByText('+250%')).toBeInTheDocument()
    expect(kpi('topCategoryGrowth').getByText('Categoría: Moda')).toBeInTheDocument()
    expect(kpi('topProductUnits').getByText('90')).toBeInTheDocument()
    expect(kpi('topProductUnits').getByText('Producto: Camiseta Adidas')).toBeInTheDocument()
    expect(kpi('confidence').getByText('75%')).toBeInTheDocument()
  })

  it('lista categorías con su crecimiento y tendencia traducida', async () => {
    renderForecastPage(<DemandForecastPage />, { route: '/bi/pronosticos/demanda' })
    const categories = await screen.findByTestId('forecast-demand-categories-table')

    const moda = within(categories).getByText('Moda').closest('tr') as HTMLElement
    expect(within(moda).getByText('31')).toBeInTheDocument()
    expect(within(moda).getByText('54')).toBeInTheDocument()
    expect(within(moda).getByText('+250%')).toBeInTheDocument()
    expect(within(moda).getByText('En alza')).toBeInTheDocument()

    const alquiler = within(categories).getByText('Alquiler').closest('tr') as HTMLElement
    expect(within(alquiler).getByText('-66,7%')).toBeInTheDocument()
    expect(within(alquiler).getByText('En baja')).toBeInTheDocument()
  })

  it('lista el top de productos con categoría, unidades y crecimiento', async () => {
    renderForecastPage(<DemandForecastPage />, { route: '/bi/pronosticos/demanda' })
    const products = await screen.findByTestId('forecast-demand-products-table')
    const row = within(products).getByText('Camiseta Adidas').closest('tr') as HTMLElement

    expect(within(row).getByText('Moda')).toBeInTheDocument()
    expect(within(row).getByText('87')).toBeInTheDocument()
    expect(within(row).getByText('90')).toBeInTheDocument()
    expect(within(row).getByText('+12,5%')).toBeInTheDocument()
  })

  it('pagina el top de productos server-side', async () => {
    renderForecastPage(<DemandForecastPage />, { route: '/bi/pronosticos/demanda' })
    await screen.findByTestId('forecast-demand-products-table')

    expect(screen.getByText('Página 1 de 2 (12 items)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() =>
      expect(forecastService.getDemandForecast).toHaveBeenLastCalledWith({
        history_months: 6,
        forecast_months: 3,
        page: 2,
        page_size: 10,
      }),
    )
  })

  it('cambia el horizonte y resetea la página', async () => {
    renderForecastPage(<DemandForecastPage />, {
      route: '/bi/pronosticos/demanda?months=3&page=2',
    })
    await screen.findByTestId('forecast-demand-products-table')

    fireEvent.click(within(tablist('Horizonte')).getByRole('tab', { name: '12 meses' }))
    await waitFor(() =>
      expect(forecastService.getDemandForecast).toHaveBeenLastCalledWith({
        history_months: 6,
        forecast_months: 12,
        page: 1,
        page_size: 10,
      }),
    )
  })

  it('explica la confianza constante y el alcance de los totales', async () => {
    renderForecastPage(<DemandForecastPage />, { route: '/bi/pronosticos/demanda' })
    const notes = await screen.findByTestId('forecast-demand-notes')

    expect(within(notes).getByText(/constante del modelo/)).toBeInTheDocument()
    expect(within(notes).getByText(/promedio mensual histórico/)).toBeInTheDocument()
    expect(within(notes).getByText(/corresponden a la página/)).toBeInTheDocument()
  })

  it('propaga el error del endpoint', async () => {
    vi.mocked(forecastService.getDemandForecast).mockRejectedValueOnce(new Error('boom'))
    renderForecastPage(<DemandForecastPage />, { route: '/bi/pronosticos/demanda' })

    expect(await screen.findByText('No se pudieron cargar los pronósticos')).toBeInTheDocument()
    expect(screen.queryByTestId('forecast-demand-kpis')).toBeNull()
  })
})
