import { describe, expect, it } from 'vitest'
import {
  AUDIT_RESULT_FILTERS,
  auditAriaSortFor,
  auditRangeState,
  defaultAuditLogFilters,
  hasActiveAuditFilters,
  isAuditRangeQueryable,
  nextAuditSort,
  toAuditExportFilters,
  toAuditLogsParams,
  type AuditLogFilters,
} from './filters'

const filters = (overrides: Partial<AuditLogFilters> = {}): AuditLogFilters => ({
  ...defaultAuditLogFilters(new Date(2026, 9, 21, 12, 0, 0)),
  ...overrides,
})

describe('audit/filters', () => {
  it('ventana inicial de 30 días (hoy inclusive)', () => {
    const defaults = defaultAuditLogFilters(new Date(2026, 9, 21, 12, 0, 0))
    expect(defaults.startDate).toBe('2026-09-22')
    expect(defaults.endDate).toBe('2026-10-21')
    expect(defaults.search).toBe('')
    expect(defaults.category).toBe('')
    expect(defaults.action).toBe('')
    expect(defaults.entityType).toBe('')
    expect(defaults.level).toBe('')
    expect(defaults.result).toBe('ALL')
    expect(AUDIT_RESULT_FILTERS).toEqual(['ALL', 'SUCCESS', 'FAILURE'])
  })

  it('rango: completo, vacío, incompleto e inválido', () => {
    expect(auditRangeState('2026-09-22', '2026-10-21')).toBe('complete')
    expect(auditRangeState('', '')).toBe('empty')
    expect(auditRangeState('2026-09-22', '')).toBe('incomplete')
    expect(auditRangeState('', '2026-10-21')).toBe('incomplete')
    expect(auditRangeState('2026-10-21', '2026-09-22')).toBe('invalid')
    expect(isAuditRangeQueryable('complete')).toBe(true)
    expect(isAuditRangeQueryable('incomplete')).toBe(false)
  })

  it('params: recorta texto, omite vacíos y traduce el resultado a booleano', () => {
    expect(
      toAuditLogsParams(
        filters({
          search: '  SALE-1  ',
          category: 'SALE',
          action: 'CREATE',
          entityType: 'SALE',
          level: 'ERROR',
          result: 'FAILURE',
        }),
        2,
        10,
        { field: 'action', order: 'desc' },
      ),
    ).toEqual({
      start_date: '2026-09-22',
      end_date: '2026-10-21',
      page: 2,
      page_size: 10,
      search: 'SALE-1',
      category: 'SALE',
      action: 'CREATE',
      entity_type: 'SALE',
      level: 'ERROR',
      success: false,
      sort_by: 'action',
      sort_order: 'desc',
    })

    const all = toAuditLogsParams(filters({ result: 'SUCCESS', search: '   ' }), 1, 10)
    expect(all.success).toBe(true)
    expect(all).not.toHaveProperty('search')
    expect(all).not.toHaveProperty('sort_by')
  })

  it('orden: ciclo ASC → DESC → default por columna', () => {
    expect(nextAuditSort(null, 'category')).toEqual({ field: 'category', order: 'asc' })
    expect(nextAuditSort({ field: 'category', order: 'asc' }, 'category')).toEqual({
      field: 'category',
      order: 'desc',
    })
    expect(nextAuditSort({ field: 'category', order: 'desc' }, 'category')).toBeNull()
    expect(nextAuditSort({ field: 'category', order: 'desc' }, 'level')).toEqual({
      field: 'level',
      order: 'asc',
    })
    expect(auditAriaSortFor(null, 'category')).toBe('none')
    expect(auditAriaSortFor({ field: 'category', order: 'asc' }, 'category')).toBe(
      'ascending',
    )
    expect(auditAriaSortFor({ field: 'category', order: 'desc' }, 'category')).toBe(
      'descending',
    )
    expect(auditAriaSortFor({ field: 'category', order: 'desc' }, 'level')).toBe('none')
  })

  it('detecta filtros activos respecto de la ventana inicial', () => {
    const defaults = filters()
    expect(hasActiveAuditFilters(defaults, defaults)).toBe(false)
    expect(hasActiveAuditFilters(filters({ search: 'admin' }), defaults)).toBe(true)
    expect(hasActiveAuditFilters(filters({ category: 'AUTH' }), defaults)).toBe(true)
    expect(hasActiveAuditFilters(filters({ action: 'LOGIN' }), defaults)).toBe(true)
    expect(hasActiveAuditFilters(filters({ entityType: 'SALE' }), defaults)).toBe(true)
    expect(hasActiveAuditFilters(filters({ result: 'FAILURE' }), defaults)).toBe(true)
    expect(
      hasActiveAuditFilters(filters({ startDate: '2026-10-01' }), defaults),
    ).toBe(true)
    // Un texto con solo espacios no cuenta como filtro activo.
    expect(hasActiveAuditFilters(filters({ search: '   ' }), defaults)).toBe(false)
  })

  it('export: search viaja como search y success como string', () => {
    expect(
      toAuditExportFilters(
        filters({
          search: '  admin ',
          category: 'LEGACY',
          action: 'LOGIN',
          entityType: 'USER',
          result: 'SUCCESS',
        }),
      ),
    ).toEqual({
      start_date: '2026-09-22',
      end_date: '2026-10-21',
      search: 'admin',
      category: 'LEGACY',
      action: 'LOGIN',
      entity_type: 'USER',
      success: 'true',
    })
  })
})
