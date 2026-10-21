/**
 * F9 — contrato FE→BE de `/financial-reports/*` y `/vat-prorrateo/*`: rutas,
 * períodos, paginación, filtros SIFEN del date-range, codificación de ids y
 * telemetría del error.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api'
import { telemetry } from '../../utils/telemetry'
import {
  cleanFinancialParams,
  financialReportsService,
} from '../bi/financialReportsService'

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('../../utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}))

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })

describe('financialReportsService — contrato', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}))
  })

  it('cleanFinancialParams elimina undefined/null/vacíos y stringifica', () => {
    expect(
      cleanFinancialParams({ period: 'month', page: 2, start_date: '', estado: null }),
    ).toEqual({ period: 'month', page: '2' })
  })

  it('income-statement, cash-flow y vat mandan el período (month por defecto)', async () => {
    await financialReportsService.getIncomeStatement()
    expect(apiClient.get).toHaveBeenNthCalledWith(
      1,
      '/financial-reports/income-statement',
      { params: { period: 'month' } },
    )

    await financialReportsService.getCashFlow('week')
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/financial-reports/cash-flow', {
      params: { period: 'week' },
    })

    await financialReportsService.getVat('year')
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/financial-reports/vat', {
      params: { period: 'year' },
    })
  })

  it('tax-summary, overview y health-score usan el período', async () => {
    await financialReportsService.getTaxSummary('today')
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/financial-reports/tax-summary', {
      params: { period: 'today' },
    })

    await financialReportsService.getOverview()
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/financial-reports/overview', {
      params: { period: 'month' },
    })

    await financialReportsService.getHealthScore('month')
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/financial-reports/health-score', {
      params: { period: 'month' },
    })
  })

  it('libro de ventas sin fechas usa el endpoint por período', async () => {
    await financialReportsService.getSalesLedger({ period: 'month', page: 2 })
    expect(apiClient.get).toHaveBeenCalledWith('/financial-reports/sales-ledger', {
      params: { period: 'month', page: '2' },
    })
  })

  it('libro de ventas con rango usa date-range y manda los filtros SIFEN', async () => {
    await financialReportsService.getSalesLedger({
      period: 'month',
      page: 1,
      page_size: 10,
      start_date: '2026-09-01',
      end_date: '2026-10-01',
      estado: 'APROBADO',
      cdc: '123',
      timbrado: '8000',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/financial-reports/sales-ledger/date-range', {
      params: {
        start_date: '2026-09-01',
        end_date: '2026-10-01',
        page: '1',
        page_size: '10',
        estado: 'APROBADO',
        cdc: '123',
        timbrado: '8000',
      },
    })
  })

  it('libro de compras usa date-range con fechas o período sin ellas', async () => {
    await financialReportsService.getPurchaseLedger({ period: 'month', page: 1 })
    expect(apiClient.get).toHaveBeenNthCalledWith(
      1,
      '/financial-reports/purchase-ledger',
      { params: { period: 'month', page: '1' } },
    )

    await financialReportsService.getPurchaseLedger({
      period: 'month',
      page: 3,
      page_size: 10,
      start_date: '2026-09-01',
      end_date: '2026-10-01',
    })
    expect(apiClient.get).toHaveBeenNthCalledWith(
      2,
      '/financial-reports/purchase-ledger/date-range',
      {
        params: {
          start_date: '2026-09-01',
          end_date: '2026-10-01',
          page: '3',
          page_size: '10',
        },
      },
    )
  })

  it('con una sola fecha no usa date-range (no hay rango completo)', async () => {
    await financialReportsService.getPurchaseLedger({
      period: 'month',
      page: 1,
      start_date: '2026-09-01',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/financial-reports/purchase-ledger', {
      params: { period: 'month', page: '1' },
    })
  })

  it('prorrateo history manda el límite y details codifica el id', async () => {
    await financialReportsService.getProrrateoHistory()
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/vat-prorrateo/history', {
      params: { limit: '20' },
    })

    await financialReportsService.getProrrateoDetails(12)
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/vat-prorrateo/periods/12/details')
  })

  it('telemetriza el error y lo propaga', async () => {
    const failure = new Error('boom')
    vi.mocked(apiClient.get).mockRejectedValueOnce(failure)

    await expect(financialReportsService.getOverview()).rejects.toThrow('boom')
    expect(telemetry.record).toHaveBeenCalledWith('bi.financialReports.error', {
      operation: 'getOverview',
      error: 'boom',
    })
  })
})
