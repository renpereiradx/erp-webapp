/**
 * F11 — contrato canónico del servicio de Pronósticos
 * (`src/services/bi/forecastService.ts`).
 *
 * Fija rutas y params de los 5 GET consumidos contra `/forecast/*`, la
 * limpieza del query string y que el error se propaga (nunca datos vacíos).
 * Auditoría 2026-09: el drift de mapeo de escenarios/bandas fue el fallo de
 * este grupo; el servicio tipado es la frontera que lo evita.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanForecastParams, forecastService } from '../bi/forecastService'
import { apiClient } from '../api'

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}))

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

describe('forecastService (F11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}))
  })

  it('dashboard: ruta real + horizonte', async () => {
    await forecastService.getDashboard({ months: 6 })
    expect(apiClient.get).toHaveBeenCalledWith('/forecast/dashboard', {
      params: { months: '6' },
    })
  })

  it('ventas: historial, horizonte, método y granularidad', async () => {
    await forecastService.getSalesForecast({
      history_months: 12,
      forecast_months: 3,
      method: 'LINEAR',
      granularity: 'MONTHLY',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/forecast/sales', {
      params: {
        history_months: '12',
        forecast_months: '3',
        method: 'LINEAR',
        granularity: 'MONTHLY',
      },
    })
  })

  it('inventario: días + paginación server-side y sin category_id vacío', async () => {
    await forecastService.getInventoryForecast({
      forecast_days: 90,
      page: 2,
      page_size: 10,
      category_id: '',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/forecast/inventory', {
      params: { forecast_days: '90', page: '2', page_size: '10' },
    })
  })

  it('demanda: historial + horizonte + página', async () => {
    await forecastService.getDemandForecast({
      history_months: 6,
      forecast_months: 3,
      page: 1,
      page_size: 10,
    })
    expect(apiClient.get).toHaveBeenCalledWith('/forecast/demand', {
      params: {
        history_months: '6',
        forecast_months: '3',
        page: '1',
        page_size: '10',
      },
    })
  })

  it('ingresos: escenarios como booleano y horizonte', async () => {
    await forecastService.getRevenueForecast({
      history_months: 12,
      forecast_months: 6,
      include_scenarios: true,
    })
    expect(apiClient.get).toHaveBeenCalledWith('/forecast/revenue', {
      params: {
        history_months: '12',
        forecast_months: '6',
        include_scenarios: 'true',
      },
    })
  })

  it('propaga el error del endpoint (no lo convierte en datos vacíos)', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('boom'))
    await expect(forecastService.getSalesForecast()).rejects.toThrow('boom')
  })

  it('cleanForecastParams descarta null/undefined/vacío y conserva 0/false', () => {
    expect(
      cleanForecastParams({ a: 1, b: null, c: undefined, d: '', e: false, f: 0 }),
    ).toEqual({ a: '1', e: 'false', f: '0' })
  })
})
