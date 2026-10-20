/**
 * Contrato FE→BE de `services/bi/dashboardService` (F2).
 * Fija rutas, params y el envelope: el servicio NO desenvuelve `.data`
 * (el hook lo hace y puede leer `metadata.partial`).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dashboardService } from '../bi/dashboardService'
import { apiClient } from '../api'

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}))

const envelope = (data: unknown) => ({
  success: true,
  data,
  metadata: { generated_at: '2026-10-20T13:00:00Z' },
})

describe('dashboardService — contrato /dashboard/*', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}))
  })

  it('getSummary pega /dashboard/summary con el período', async () => {
    const response = await dashboardService.getSummary({ period: 'week' })
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/summary', {
      params: { period: 'week' },
    })
    expect(response).toEqual(envelope({}))
  })

  it('getKPIs y getTrends usan sus endpoints con el período', async () => {
    await dashboardService.getKPIs({ period: 'year' })
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/kpis', {
      params: { period: 'year' },
    })

    await dashboardService.getTrends({ period: 'today' })
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/trends', {
      params: { period: 'today' },
    })
  })

  it('getAlerts viaja sin filtros por defecto y acepta severity/category', async () => {
    await dashboardService.getAlerts()
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/alerts', { params: {} })

    await dashboardService.getAlerts({ severity: 'critical', category: 'inventory' })
    expect(apiClient.get).toHaveBeenLastCalledWith('/dashboard/alerts', {
      params: { severity: 'critical', category: 'inventory' },
    })
  })

  it('getTopProducts mapea period/limit/sort_by al contrato del BE', async () => {
    await dashboardService.getTopProducts({ period: 'month', limit: 10, sort_by: 'profit' })
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/top-products', {
      params: { period: 'month', limit: 10, sort_by: 'profit' },
    })
  })

  it('getSalesHeatmap envía weeks', async () => {
    await dashboardService.getSalesHeatmap({ weeks: 8 })
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/sales-heatmap', {
      params: { weeks: 8 },
    })
  })

  it('getRecentActivity convierte types[] a lista separada por comas', async () => {
    await dashboardService.getRecentActivity({ limit: 5, types: ['sale', 'purchase'] })
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/recent-activity', {
      params: { limit: 5, types: 'sale,purchase' },
    })
  })

  it('getRecentActivity sin types no inventa el param', async () => {
    await dashboardService.getRecentActivity({ limit: 3 })
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/recent-activity', {
      params: { limit: 3 },
    })
  })
})
