/**
 * F5 — contrato FE→BE de `/inventory-analytics/*`: rutas, params de paginación/
 * sort/status, período y días, limpieza de params y telemetría del error.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { telemetry } from '../../utils/telemetry'
import { cleanQueryParams, inventoryAnalyticsService } from '../bi/inventoryAnalyticsService'

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('../../utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}))

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

describe('inventoryAnalyticsService — contrato', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}))
  })

  it('cleanQueryParams elimina undefined/null/vacíos y stringifica', () => {
    expect(
      cleanQueryParams({ page: 2, page_size: 10, status: '', sort_by: undefined, days: null }),
    ).toEqual({ page: '2', page_size: '10' })
  })

  it('overview y dashboard no mandan parámetros que el BE ignora', async () => {
    await inventoryAnalyticsService.getOverview()
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/inventory-analytics/overview', {
      params: {},
    })

    await inventoryAnalyticsService.getDashboard()
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/inventory-analytics/dashboard', {
      params: {},
    })
  })

  it('stock-levels mapea página, tamaño, filtro y orden', async () => {
    await inventoryAnalyticsService.getStockLevels({
      page: 3,
      page_size: 10,
      status: 'LOW_STOCK',
      sort_by: 'value',
      sort_order: 'ASC',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/inventory-analytics/stock-levels', {
      params: {
        page: '3',
        page_size: '10',
        status: 'LOW_STOCK',
        sort_by: 'value',
        sort_order: 'ASC',
      },
    })
  })

  it('stock-levels sin filtro no manda status vacío', async () => {
    await inventoryAnalyticsService.getStockLevels({ page: 1, page_size: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/inventory-analytics/stock-levels', {
      params: { page: '1', page_size: '10' },
    })
  })

  it('turnover y ABC mandan el período', async () => {
    await inventoryAnalyticsService.getTurnover({ period: 'week' })
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/inventory-analytics/turnover', {
      params: { period: 'week' },
    })

    await inventoryAnalyticsService.getABC({ period: 'year' })
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/inventory-analytics/abc', {
      params: { period: 'year' },
    })
  })

  it('dead-stock manda days, reorder y aging no mandan params', async () => {
    await inventoryAnalyticsService.getDeadStock({ days: 120 })
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/inventory-analytics/dead-stock', {
      params: { days: '120' },
    })

    await inventoryAnalyticsService.getReorder()
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/inventory-analytics/reorder', {
      params: {},
    })

    await inventoryAnalyticsService.getStockAging()
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/inventory-analytics/aging', {
      params: {},
    })
  })

  it('propaga el error y lo telemetriza sin fallback demo', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('offline'))

    await expect(inventoryAnalyticsService.getDashboard()).rejects.toThrow('offline')
    expect(telemetry.record).toHaveBeenCalledWith('bi.inventoryAnalytics.error', {
      operation: 'getDashboard',
      error: 'offline',
    })
  })
})
