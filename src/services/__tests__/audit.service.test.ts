/**
 * F10 — contrato canónico del servicio de Auditoría
 * (`src/services/bi/auditService.ts`).
 *
 * Fija rutas, params y limpieza del query string de los 4 GET consumidos y el
 * body del export (POST). Reemplaza a `auditExport.service.test.ts`: el
 * servicio se reescribió tipado y el contrato completo vive acá (regla 1 de
 * PLAN_TEST_DESIGN_FRONTEND: test del servicio en `services/__tests__`).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auditService, cleanAuditParams } from '../bi/auditService'
import { apiClient } from '../api'

vi.mock('../api', () => ({
  apiClient: { get: vi.fn(), getBlob: vi.fn() },
}))

const envelope = (data: unknown) => ({ success: true, data, metadata: {} })
const blobResult = { blob: new Blob(['id\n']), filename: 'audit_logs.csv' }

describe('auditService (F10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockResolvedValue(envelope({}))
    vi.mocked(apiClient.getBlob).mockResolvedValue(blobResult)
  })

  it('dashboard: ruta real + período', async () => {
    await auditService.getDashboard('year')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit/dashboard', {
      params: { period: 'year' },
    })
  })

  it('logs: envía filtros, paginación y orden sin parámetros vacíos', async () => {
    await auditService.getLogs({
      start_date: '2026-09-22',
      end_date: '2026-10-21',
      page: 2,
      page_size: 10,
      search: 'SALE-1',
      category: 'SALE',
      level: 'ERROR',
      success: false,
      sort_by: 'action',
      sort_order: 'asc',
      user_id: '',
    })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit/logs', {
      params: {
        start_date: '2026-09-22',
        end_date: '2026-10-21',
        page: '2',
        page_size: '10',
        search: 'SALE-1',
        category: 'SALE',
        level: 'ERROR',
        success: 'false',
        sort_by: 'action',
        sort_order: 'asc',
      },
    })
  })

  it('catálogo de tipos de entidad: ruta real', async () => {
    await auditService.getEntityTypes()
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit/entity-types', {
      params: {},
    })
  })

  it('detalle: codifica el id en la ruta', async () => {
    await auditService.getLogById('27088')
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/audit/logs/27088', {
      params: {},
    })
    await auditService.getLogById('A/B')
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/v1/audit/logs/A%2FB', {
      params: {},
    })
  })

  it('actividad de usuario: ruta codificada + período', async () => {
    await auditService.getUserActivity('jJk V4', 'week')
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/v1/audit/users/jJk%20V4/activity',
      { params: { period: 'week' } },
    )
  })

  it('export: search_term, success booleano y end_date exclusivo (+1d)', async () => {
    await auditService.exportLogs(
      {
        search: ' BodyTech ',
        level: 'ERROR',
        success: 'false',
        start_date: '2026-09-01',
        end_date: '2026-09-15',
      },
      { format: 'csv' },
    )

    expect(apiClient.getBlob).toHaveBeenCalledTimes(1)
    const [endpoint, options] = vi.mocked(apiClient.getBlob).mock.calls[0]
    expect(endpoint).toBe('/api/v1/audit/export')
    expect(options?.method).toBe('POST')

    const body = JSON.parse(options?.body as string)
    expect(body.format).toBe('csv')
    expect(body.max_records).toBe(10000)
    expect(body.filter.search_term).toBe('BodyTech')
    expect(body.filter.success).toBe(false)
    expect(body.filter.level).toBe('ERROR')
    expect(body.filter.start_date).toBe(new Date('2026-09-01T00:00:00').toISOString())
    // El BE usa timestamp < end: 2026-09-15 excluye el día → se manda el 16.
    expect(body.filter.end_date).toBe(new Date('2026-09-16T00:00:00').toISOString())
  })

  it('export: sin filtros manda filter vacío y respeta format json + max_records', async () => {
    await auditService.exportLogs({}, { format: 'json', max_records: 50 })

    const body = JSON.parse(vi.mocked(apiClient.getBlob).mock.calls[0][1]?.body as string)
    expect(body.filter).toEqual({})
    expect(body.format).toBe('json')
    expect(body.max_records).toBe(50)
  })

  it('export: devuelve blob + filename del Content-Disposition', async () => {
    const result = await auditService.exportLogs({ category: 'LEGACY' })
    expect(result).toEqual(blobResult)
  })

  it('propaga el error del endpoint (no lo convierte en datos vacíos)', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('boom'))
    await expect(auditService.getDashboard('month')).rejects.toThrow('boom')
  })

  it('cleanAuditParams descarta null/undefined/vacío', () => {
    expect(
      cleanAuditParams({ a: 1, b: null, c: undefined, d: '', e: false, f: true }),
    ).toEqual({ a: '1', e: 'false', f: 'true' })
  })
})
