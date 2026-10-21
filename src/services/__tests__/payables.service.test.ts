/**
 * F8 — contrato FE→BE de `/payables/*`: rutas, paginación, orden server-side,
 * período, ventanas de días, codificación de ids y telemetría del error.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { telemetry } from '../../utils/telemetry'
import { cleanPayablesParams, payablesService } from '../bi/payablesService'

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('../../utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}))

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

describe('payablesService — contrato', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}))
  })

  it('cleanPayablesParams elimina undefined/null/vacíos y stringifica', () => {
    expect(
      cleanPayablesParams({
        page: 2,
        page_size: 10,
        status: '',
        sort_by: undefined,
        search: null,
      }),
    ).toEqual({ page: '2', page_size: '10' })
  })

  it('overview pega GET /payables/overview sin params', async () => {
    await payablesService.getOverview()
    expect(apiClient.get).toHaveBeenCalledWith('/payables/overview', { params: {} })
  })

  it('list mapea estado, prioridad, texto, fechas, página y orden whitelist', async () => {
    await payablesService.getList({
      status: 'OVERDUE',
      priority: 'URGENT',
      supplier_id: 'SP-1',
      search: 'acme',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      page: 2,
      page_size: 10,
      sort_by: 'priority',
      sort_order: 'ASC',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/payables', {
      params: {
        status: 'OVERDUE',
        priority: 'URGENT',
        supplier_id: 'SP-1',
        search: 'acme',
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        page: '2',
        page_size: '10',
        sort_by: 'priority',
        sort_order: 'ASC',
      },
    })
  })

  it('list sin filtros no manda strings vacíos', async () => {
    await payablesService.getList({ status: undefined, page: 1, page_size: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/payables', {
      params: { page: '1', page_size: '10' },
    })
  })

  it('detail y análisis de proveedor codifican el id en la ruta', async () => {
    await payablesService.getById('PO/1')
    expect(apiClient.get).toHaveBeenCalledWith('/payables/PO%2F1')

    await payablesService.getSupplierAnalysis('SP/1')
    expect(apiClient.get).toHaveBeenCalledWith('/payables/supplier/SP%2F1/analysis')
  })

  it('top suppliers manda el límite (5 por defecto)', async () => {
    await payablesService.getTopSuppliers()
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/payables/top-suppliers', {
      params: { limit: '5' },
    })

    await payablesService.getTopSuppliers(10)
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/payables/top-suppliers', {
      params: { limit: '10' },
    })
  })

  it('schedule manda la ventana en días (30 por defecto)', async () => {
    await payablesService.getSchedule()
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/payables/schedule', {
      params: { days: '30' },
    })

    await payablesService.getSchedule(60)
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/payables/schedule', {
      params: { days: '60' },
    })
  })

  it('aging report mapea page/page_size', async () => {
    await payablesService.getAgingReport({ page: 2, page_size: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/payables/aging/report', {
      params: { page: '2', page_size: '10' },
    })
  })

  it('statistics manda el período (month por defecto)', async () => {
    await payablesService.getStatistics()
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/payables/statistics', {
      params: { period: 'month' },
    })

    await payablesService.getStatistics('week')
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/payables/statistics', {
      params: { period: 'week' },
    })
  })

  it('cash-flow usa /payables/cash-flow (proyección, no estado contable)', async () => {
    await payablesService.getCashFlowProjection(90)
    expect(apiClient.get).toHaveBeenCalledWith('/payables/cash-flow', {
      params: { days: '90' },
    })
  })

  it('telemetriza el error y lo propaga', async () => {
    const failure = new Error('boom')
    vi.mocked(apiClient.get).mockRejectedValueOnce(failure)

    await expect(payablesService.getOverview()).rejects.toThrow('boom')
    expect(telemetry.record).toHaveBeenCalledWith('bi.payables.error', {
      operation: 'getOverview',
      error: 'boom',
    })
  })
})
