/**
 * F6 — contrato FE→BE de `/profitability/*`: rutas, período, paginación,
 * orden server-side, granularidad y telemetría del error.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { telemetry } from '../../utils/telemetry'
import { cleanQueryParams, profitabilityService } from '../bi/profitabilityService'

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('../../utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}))

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

describe('profitabilityService — contrato', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}))
  })

  it('cleanQueryParams elimina undefined/null/vacíos y stringifica', () => {
    expect(
      cleanQueryParams({
        page: 2,
        page_size: 10,
        sort_by: '',
        sort_order: undefined,
        period: null,
      }),
    ).toEqual({ page: '2', page_size: '10' })
  })

  it('dashboard y categorías mandan el período', async () => {
    await profitabilityService.getDashboard('week')
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/profitability/dashboard', {
      params: { period: 'week' },
    })

    await profitabilityService.getCategories('year')
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/profitability/categories', {
      params: { period: 'year' },
    })
  })

  it('dashboard usa month por defecto', async () => {
    await profitabilityService.getDashboard()
    expect(apiClient.get).toHaveBeenCalledWith('/profitability/dashboard', {
      params: { period: 'month' },
    })
  })

  it('products mapea período, página, tamaño y orden', async () => {
    await profitabilityService.getProducts({
      period: 'month',
      page: 2,
      page_size: 10,
      sort_by: 'margin',
      sort_order: 'ASC',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/profitability/products', {
      params: {
        period: 'month',
        page: '2',
        page_size: '10',
        sort_by: 'margin',
        sort_order: 'ASC',
      },
    })
  })

  it('products sin params no manda strings vacíos', async () => {
    await profitabilityService.getProducts({})
    expect(apiClient.get).toHaveBeenCalledWith('/profitability/products', { params: {} })
  })

  it('customers mapea paginación (sin sort: el BE no lo acepta)', async () => {
    await profitabilityService.getCustomers({ period: 'today', page: 1, page_size: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/profitability/customers', {
      params: { period: 'today', page: '1', page_size: '10' },
    })
  })

  it('trends manda período y granularidad', async () => {
    await profitabilityService.getTrends({ period: 'year', granularity: 'monthly' })
    expect(apiClient.get).toHaveBeenCalledWith('/profitability/trends', {
      params: { period: 'year', granularity: 'monthly' },
    })
  })

  it('sellers manda el período', async () => {
    await profitabilityService.getSellers('today')
    expect(apiClient.get).toHaveBeenCalledWith('/profitability/sellers', {
      params: { period: 'today' },
    })
  })

  it('telemetriza el error y lo propaga', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('boom'))
    await expect(profitabilityService.getDashboard('month')).rejects.toThrow('boom')
    expect(telemetry.record).toHaveBeenCalledWith('bi.profitability.error', {
      operation: 'getDashboard',
      error: 'boom',
    })
  })

  it('cada método registra su propia operación al fallar', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('down'))
    await expect(profitabilityService.getProducts()).rejects.toThrow('down')
    await expect(profitabilityService.getCustomers()).rejects.toThrow('down')
    await expect(profitabilityService.getCategories()).rejects.toThrow('down')
    await expect(profitabilityService.getTrends()).rejects.toThrow('down')
    await expect(profitabilityService.getSellers()).rejects.toThrow('down')
    expect(telemetry.record).toHaveBeenCalledWith('bi.profitability.error', {
      operation: 'getProducts',
      error: 'down',
    })
    expect(telemetry.record).toHaveBeenCalledWith('bi.profitability.error', {
      operation: 'getSellers',
      error: 'down',
    })
  })
})
