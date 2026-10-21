/**
 * F7 — contrato FE→BE de `/receivables/*`: rutas, paginación, orden
 * server-side, período, codificación de ids y telemetría del error.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { telemetry } from '../../utils/telemetry'
import { cleanQueryParams, receivablesService } from '../bi/receivablesService'

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('../../utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}))

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

describe('receivablesService — contrato', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}))
  })

  it('cleanQueryParams elimina undefined/null/vacíos y stringifica', () => {
    expect(
      cleanQueryParams({
        page: 2,
        page_size: 10,
        status: '',
        sort_by: undefined,
        sort_order: null,
      }),
    ).toEqual({ page: '2', page_size: '10' })
  })

  it('overview pega GET /receivables/overview sin params', async () => {
    await receivablesService.getOverview()
    expect(apiClient.get).toHaveBeenCalledWith('/receivables/overview', { params: {} })
  })

  it('list mapea estado, cliente, página y orden de la whitelist', async () => {
    await receivablesService.getList({
      status: 'OVERDUE',
      client_id: 'CL-1',
      page: 2,
      page_size: 10,
      sort_by: 'days_overdue',
      sort_order: 'DESC',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/receivables', {
      params: {
        status: 'OVERDUE',
        client_id: 'CL-1',
        page: '2',
        page_size: '10',
        sort_by: 'days_overdue',
        sort_order: 'DESC',
      },
    })
  })

  it('list sin filtros no manda strings vacíos', async () => {
    await receivablesService.getList({ status: undefined, page: 1, page_size: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/receivables', {
      params: { page: '1', page_size: '10' },
    })
  })

  it('detail y client-profile codifican el id en la ruta', async () => {
    await receivablesService.getById('SALE-1780338284-194')
    expect(apiClient.get).toHaveBeenCalledWith('/receivables/SALE-1780338284-194')

    await receivablesService.getClientReceivables('CL/1')
    expect(apiClient.get).toHaveBeenCalledWith('/receivables/client/CL%2F1')

    await receivablesService.getClientRisk('CL/1')
    expect(apiClient.get).toHaveBeenCalledWith('/receivables/client/CL%2F1/risk')
  })

  it('overdue solo manda paginación (el BE fija estado y orden)', async () => {
    await receivablesService.getOverdue({ page: 3, page_size: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/receivables/overdue', {
      params: { page: '3', page_size: '10' },
    })
  })

  it('aging report mapea page/page_size', async () => {
    await receivablesService.getAgingReport({ page: 2, page_size: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/receivables/aging/report', {
      params: { page: '2', page_size: '10' },
    })
  })

  it('top debtors manda el límite (5 por defecto)', async () => {
    await receivablesService.getTopDebtors()
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/receivables/top-debtors', {
      params: { limit: '5' },
    })

    await receivablesService.getTopDebtors(10)
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/receivables/top-debtors', {
      params: { limit: '10' },
    })
  })

  it('statistics manda el período (month por defecto)', async () => {
    await receivablesService.getStatistics()
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/receivables/statistics', {
      params: { period: 'month' },
    })

    await receivablesService.getStatistics('week')
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/receivables/statistics', {
      params: { period: 'week' },
    })
  })

  it('telemetriza el error y lo propaga', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('boom'))
    await expect(receivablesService.getOverview()).rejects.toThrow('boom')
    expect(telemetry.record).toHaveBeenCalledWith('bi.receivables.error', {
      operation: 'getOverview',
      error: 'boom',
    })
  })

  it('cada método registra su propia operación al fallar', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('down'))
    await expect(receivablesService.getList()).rejects.toThrow('down')
    await expect(receivablesService.getById('SALE-1')).rejects.toThrow('down')
    await expect(receivablesService.getOverdue()).rejects.toThrow('down')
    await expect(receivablesService.getClientReceivables('CL-1')).rejects.toThrow('down')
    await expect(receivablesService.getClientRisk('CL-1')).rejects.toThrow('down')
    await expect(receivablesService.getAgingReport()).rejects.toThrow('down')
    await expect(receivablesService.getTopDebtors()).rejects.toThrow('down')
    await expect(receivablesService.getStatistics()).rejects.toThrow('down')
    expect(telemetry.record).toHaveBeenCalledWith('bi.receivables.error', {
      operation: 'getClientRisk',
      error: 'down',
    })
    expect(telemetry.record).toHaveBeenCalledWith('bi.receivables.error', {
      operation: 'getStatistics',
      error: 'down',
    })
  })
})
