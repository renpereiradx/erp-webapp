/**
 * F11 — Dashboard de Pronósticos: KPIs de los 4 pronósticos, insights
 * traducidos por `type` (sin el texto español del backend), recomendaciones
 * derivadas con los umbrales reales, accesos a las 4 pantallas y ausencia de
 * claims inventados ("$", IA, tiempo real).
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
  forecastService: { getDashboard: vi.fn() },
}))

import { forecastService } from '@/services/bi/forecastService'
import {
  forecastDashboardFixture,
  forecastEnvelope,
  renderForecastPage,
} from './forecastTestUtils'
import ForecastDashboardPage from '../forecast/ForecastDashboardPage'

const kpi = (id: string) => within(screen.getByTestId(`forecast-kpi-${id}`))

describe('ForecastDashboardPage (F11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(forecastService.getDashboard).mockResolvedValue(
      forecastEnvelope(forecastDashboardFixture()) as never,
    )
  })

  it('muestra los KPIs reales compuestos por el backend', async () => {
    renderForecastPage(<ForecastDashboardPage />)
    await screen.findByTestId('forecast-dashboard-kpis')

    expect(forecastService.getDashboard).toHaveBeenCalledWith({ months: 3 })
    expect(kpi('salesForecast').getByText('Gs. 7.572.047')).toBeInTheDocument()
    expect(kpi('annualRevenue').getByText('Gs. 3.534.000')).toBeInTheDocument()
    expect(kpi('riskProducts').getByText('5')).toBeInTheDocument()
    expect(kpi('demandUnits').getByText('57')).toBeInTheDocument()
    expect(kpi('coverage').getByText('10,5')).toBeInTheDocument()
  })

  it('traduce los insights por type y no muestra el texto del servidor', async () => {
    const { container } = renderForecastPage(<ForecastDashboardPage />)
    const insights = await screen.findByTestId('forecast-insights-list')

    expect(within(insights).getByText('Tendencia de ventas')).toBeInTheDocument()
    expect(within(insights).getByText('+58,8%')).toBeInTheDocument()
    expect(within(insights).getByText('Patrón estacional detectado')).toBeInTheDocument()
    expect(within(insights).getAllByText(/oct/i).length).toBeGreaterThan(0)
    expect(within(insights).getByText('Productos en riesgo de agotamiento')).toBeInTheDocument()
    expect(within(insights).getByText('Cobertura de inventario')).toBeInTheDocument()
    expect(within(insights).getByText('Proyección de ingresos anual')).toBeInTheDocument()
    expect(within(insights).getByText('Gs. 3.534.000')).toBeInTheDocument()

    // Los textos en español/`$` del SQL no se renderizan.
    expect(container.textContent).not.toContain('Se proyecta un crecimiento')
    expect(container.textContent).not.toContain('Periodos pico')
    expect(container.textContent).not.toContain('$')
  })

  it('deriva recomendaciones de las condiciones reales y enlaza a su pantalla', async () => {
    renderForecastPage(<ForecastDashboardPage />)
    const recommendations = await screen.findByTestId('forecast-recommendations-list')

    expect(
      within(recommendations).getByText('Reabastecer productos en riesgo'),
    ).toBeInTheDocument()
    expect(within(recommendations).getByText(/Hay 5 productos/)).toBeInTheDocument()
    expect(
      within(recommendations).getByText('Aumentar niveles de inventario'),
    ).toBeInTheDocument()
    expect(within(recommendations).getByText(/10,5 días/)).toBeInTheDocument()
    expect(
      within(recommendations).getByText('Prepararse para temporada alta'),
    ).toBeInTheDocument()
    expect(
      within(recommendations).getByText('Mejorar precisión de pronósticos'),
    ).toBeInTheDocument()

    const links = within(recommendations).getAllByRole('link', { name: /Ver pantalla/ })
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/bi/pronosticos/inventario',
      '/bi/pronosticos/inventario',
      '/bi/pronosticos/ventas',
      '/bi/pronosticos/ingresos',
    ])
  })

  it('enlaza las 4 pantallas del grupo con cifras reales', async () => {
    renderForecastPage(<ForecastDashboardPage />)
    const groups = await screen.findByTestId('forecast-group-links')

    expect(within(groups).getByTestId('forecast-group-sales')).toHaveAttribute(
      'href',
      '/bi/pronosticos/ventas',
    )
    expect(within(groups).getByTestId('forecast-group-revenue')).toHaveAttribute(
      'href',
      '/bi/pronosticos/ingresos',
    )
    expect(within(groups).getByTestId('forecast-group-inventory')).toHaveAttribute(
      'href',
      '/bi/pronosticos/inventario',
    )
    expect(within(groups).getByTestId('forecast-group-demand')).toHaveAttribute(
      'href',
      '/bi/pronosticos/demanda',
    )
    expect(within(groups).getByText('Gs. 7.572.047')).toBeInTheDocument()
    expect(within(groups).getByText('Gs. 1.767.000')).toBeInTheDocument()
  })

  it('cambia el horizonte y vuelve a pedir el dashboard', async () => {
    renderForecastPage(<ForecastDashboardPage />)
    await screen.findByTestId('forecast-dashboard-kpis')

    fireEvent.click(screen.getByRole('tab', { name: '6 meses' }))
    await waitFor(() =>
      expect(forecastService.getDashboard).toHaveBeenLastCalledWith({ months: 6 }),
    )
  })

  it('no promete IA ni frescura en tiempo real', async () => {
    const { container } = renderForecastPage(<ForecastDashboardPage />)
    await screen.findByTestId('forecast-dashboard-kpis')

    expect(container.textContent).not.toMatch(/\bIA\b/)
    expect(container.textContent).not.toContain('en tiempo real')
    expect(container.textContent).not.toContain('Live')
  })
})
