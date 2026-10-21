/**
 * F11 — Salud de inventario: KPIs del set completo, alertas traducidas sin el
 * `message` del SQL, centinela 999 como "sin ventas", tabla paginada
 * server-side y cambio de horizonte.
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
  forecastService: { getInventoryForecast: vi.fn() },
}))

import { forecastService } from '@/services/bi/forecastService'
import {
  forecastEnvelope,
  inventoryForecastFixture,
  renderForecastPage,
} from './forecastTestUtils'
import InventoryForecastPage from '../forecast/InventoryForecastPage'

const kpi = (id: string) => within(screen.getByTestId(`forecast-kpi-${id}`))
const tablist = (name: string) => screen.getByRole('tablist', { name })

describe('InventoryForecastPage (F11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(forecastService.getInventoryForecast).mockResolvedValue(
      forecastEnvelope(inventoryForecastFixture()) as never,
    )
  })

  it('pide el contrato default con página server-side', async () => {
    renderForecastPage(<InventoryForecastPage />, {
      route: '/bi/pronosticos/inventario',
    })
    await screen.findByTestId('forecast-inventory-kpis')

    expect(forecastService.getInventoryForecast).toHaveBeenCalledWith({
      forecast_days: 30,
      page: 1,
      page_size: 10,
    })
  })

  it('muestra los KPIs sobre el set completo', async () => {
    renderForecastPage(<InventoryForecastPage />, {
      route: '/bi/pronosticos/inventario',
    })
    await screen.findByTestId('forecast-inventory-kpis')

    expect(kpi('coverage').getByText('10,5')).toBeInTheDocument()
    expect(kpi('currentStock').getByText('1.070')).toBeInTheDocument()
    expect(kpi('projectedDemand').getByText('128')).toBeInTheDocument()
    expect(kpi('highRisk').getByText('5')).toBeInTheDocument()
    expect(kpi('mediumRisk').getByText('1')).toBeInTheDocument()
    expect(kpi('totalProducts').getByText('18')).toBeInTheDocument()
  })

  it('traduce las alertas del backend y no muestra sus mensajes en español', async () => {
    renderForecastPage(<InventoryForecastPage />, {
      route: '/bi/pronosticos/inventario',
    })
    const alerts = await screen.findByTestId('forecast-alerts-list')

    expect(within(alerts).getByText('Alertas: 2 · Altas: 1 · Medias: 1')).toBeInTheDocument()
    expect(within(alerts).getByText(/Quiebre inminente/)).toBeInTheDocument()
    expect(within(alerts).getByText(/Stock bajo/)).toBeInTheDocument()
    expect(within(alerts).getByText('Lavado de auto')).toBeInTheDocument()
    expect(within(alerts).getByText(/Días para actuar: 0/)).toBeInTheDocument()
    expect(screen.queryByText('Stock se agotara en 0 dias')).toBeNull()
    expect(screen.queryByText('Stock bajo: 5 dias de cobertura')).toBeNull()
  })

  it('cuenta los riesgos del summary sin inventar estados', async () => {
    renderForecastPage(<InventoryForecastPage />, {
      route: '/bi/pronosticos/inventario',
    })
    const risk = await screen.findByTestId('forecast-inventory-risk')

    expect(within(risk).getByTestId('forecast-risk-high')).toHaveTextContent('5')
    expect(within(risk).getByTestId('forecast-risk-medium')).toHaveTextContent('1')
    expect(within(risk).getByTestId('forecast-risk-low')).toHaveTextContent('2')
    expect(within(risk).getByTestId('forecast-risk-none')).toHaveTextContent('10')
  })

  it('renderiza la tabla con la reposición y el centinela 999', async () => {
    renderForecastPage(<InventoryForecastPage />, {
      route: '/bi/pronosticos/inventario',
    })
    const table = await screen.findByTestId('forecast-inventory-table')

    const activeRow = within(table).getByText('Lavado de auto').closest('tr')
    expect(activeRow).not.toBeNull()
    // Stock 0 y días restantes 0 son dos ceros reales de la fila.
    expect(within(activeRow as HTMLElement).getAllByText('0')).toHaveLength(2)
    expect(within(activeRow as HTMLElement).getByText('2')).toBeInTheDocument()
    expect(within(activeRow as HTMLElement).getByText('60')).toBeInTheDocument()
    expect(within(activeRow as HTMLElement).getByText('88')).toBeInTheDocument()
    expect(within(activeRow as HTMLElement).getByText('Alto')).toBeInTheDocument()
    expect(within(activeRow as HTMLElement).getByText('En alza')).toBeInTheDocument()
    expect(within(activeRow as HTMLElement).getByText(/Reponer antes del/)).toBeInTheDocument()

    const idleRow = within(table).getByText('Producto sin ventas').closest('tr')
    expect(
      within(idleRow as HTMLElement).getByText('Sin ventas en 90 días'),
    ).toBeInTheDocument()
    expect(within(idleRow as HTMLElement).queryByText('999')).toBeNull()
  })

  it('pagina el listado server-side y resetea la página al cambiar el horizonte', async () => {
    renderForecastPage(<InventoryForecastPage />, {
      route: '/bi/pronosticos/inventario',
    })
    await screen.findByTestId('forecast-inventory-table')

    expect(screen.getByText('Página 1 de 2 (18 items)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() =>
      expect(forecastService.getInventoryForecast).toHaveBeenLastCalledWith({
        forecast_days: 30,
        page: 2,
        page_size: 10,
      }),
    )

    fireEvent.click(within(tablist('Horizonte')).getByRole('tab', { name: '90 días' }))
    await waitFor(() =>
      expect(forecastService.getInventoryForecast).toHaveBeenLastCalledWith({
        forecast_days: 90,
        page: 1,
        page_size: 10,
      }),
    )
  })

  it('propaga el error del endpoint', async () => {
    vi.mocked(forecastService.getInventoryForecast).mockRejectedValueOnce(
      new Error('boom'),
    )
    renderForecastPage(<InventoryForecastPage />, {
      route: '/bi/pronosticos/inventario',
    })

    expect(await screen.findByText('No se pudieron cargar los pronósticos')).toBeInTheDocument()
    expect(screen.queryByTestId('forecast-inventory-kpis')).toBeNull()
  })
})
