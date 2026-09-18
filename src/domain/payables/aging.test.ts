import { describe, expect, it } from 'vitest'
import {
  buildAgingDistribution,
  buildAgingReportKpis,
  buildAgingSegments,
  buildSupplierAgingRows,
  getSupplierRisk,
} from './aging'

const OVERVIEW = {
  total_pending: 1000,
  average_days_to_pay: 42.6,
  aging_summary: {
    current: { amount: 500, percentage: 50 },
    days_30_60: { amount: 300, percentage: 30 },
    days_60_90: { amount: 150, percentage: 15 },
    over_90_days: { amount: 50, percentage: 5 },
  },
}

describe('buildAgingReportKpis', () => {
  it('forma --- sin overview o sin statistics', () => {
    expect(buildAgingReportKpis(null, { average_dpo: 10 })).toEqual({
      dpo: '---',
      overdue: '---',
      critical: '---',
    })
    expect(buildAgingReportKpis(OVERVIEW, null)).toEqual({
      dpo: '---',
      overdue: '---',
      critical: '---',
    })
  })

  it('DPO prefiere statistics.average_dpo y cae al overview', () => {
    expect(buildAgingReportKpis(OVERVIEW, { average_dpo: 55.4 }).dpo).toBe('55 Días')
    expect(buildAgingReportKpis(OVERVIEW, {}).dpo).toBe('43 Días')
  })

  it('overdue en % y monto crítico en PYG', () => {
    const kpis = buildAgingReportKpis(OVERVIEW, { overdue_percentage: 12.34 })
    expect(kpis.overdue).toBe('12,34%')
    expect(kpis.critical).toBe('Gs. 50')
  })
})

describe('buildAgingDistribution', () => {
  it('null sin aging_summary', () => {
    expect(buildAgingDistribution(null)).toBeNull()
    expect(buildAgingDistribution({})).toBeNull()
  })

  it('aplana los 4 tramos + total', () => {
    const dist = buildAgingDistribution(OVERVIEW)
    expect(dist).toEqual({
      total: 1000,
      current: { amount: 500, percentage: 50 },
      days30_60: { amount: 300, percentage: 30 },
      days60_90: { amount: 150, percentage: 15 },
      over90: { amount: 50, percentage: 5 },
    })
  })
})

describe('buildAgingSegments', () => {
  it('[] con distribución null', () => {
    expect(buildAgingSegments(null)).toEqual([])
  })

  it('4 segmentos con clase/etiqueta por tramo y percentage numérico', () => {
    const segments = buildAgingSegments(buildAgingDistribution(OVERVIEW))
    expect(segments.map((s) => [s.key, s.shortLabel, s.percentage])).toEqual([
      ['current', '0-30 d', 50],
      ['days30_60', '31-60 d', 30],
      ['days60_90', '61-90 d', 15],
      ['over90', '+90 d', 5],
    ])
    expect(segments[3].label).toBe('Crítico')
    expect(segments[0].bgClass).toBe('bg-fluent-success')
  })

  it('normaliza percentages faltantes a 0', () => {
    const segments = buildAgingSegments({
      total: 0,
      current: { amount: 0, percentage: null },
      days30_60: { amount: 0, percentage: undefined },
      days60_90: { amount: 0, percentage: 0 },
      over90: { amount: 0, percentage: 0 },
    })
    expect(segments.map((s) => s.percentage)).toEqual([0, 0, 0, 0])
  })
})

describe('getSupplierRisk', () => {
  it.each([
    [{ over_90_days: 10, days_60_90: 0, days_30_60: 0, total: 100 }, 'Crítico'],
    [{ over_90_days: 0, days_60_90: 5, days_30_60: 0, total: 100 }, 'Moderado'],
    [{ over_90_days: 0, days_60_90: 0, days_30_60: 60, total: 100 }, 'Moderado'], // >50% del total
    [{ over_90_days: 0, days_60_90: 0, days_30_60: 50, total: 100 }, 'Mínimo'], // borde: 50% no es > 50%
    [{ over_90_days: 0, days_60_90: 0, days_30_60: 0, total: 0 }, 'Mínimo'],
  ])('%j → %s', (row, expected) => {
    expect(getSupplierRisk(row).risk).toBe(expected)
  })

  it('clase CSS acorde al riesgo', () => {
    expect(getSupplierRisk({ over_90_days: 1, days_60_90: 0, days_30_60: 0, total: 10 }).riskClass).toContain('fluent-danger')
    expect(getSupplierRisk({ over_90_days: 0, days_60_90: 0, days_30_60: 0, total: 10 }).riskClass).toContain('fluent-success')
  })
})

describe('buildSupplierAgingRows', () => {
  const ROWS = [
    { supplier_id: 's1', supplier_name: 'Alpha', current: 10, days_30_60: 0, days_60_90: 0, over_90_days: 0, total: 10 },
    { supplier_id: 's2', supplier_name: 'Beta', current: 0, days_30_60: 90, days_60_90: 0, over_90_days: 5, total: 95 },
  ]

  it('[] con by_supplier null', () => {
    expect(buildSupplierAgingRows(null, '')).toEqual([])
  })

  it('mapea columnas renombradas + riesgo', () => {
    const rows = buildSupplierAgingRows(ROWS, '')
    expect(rows[0]).toMatchObject({ id: 's1', name: 'Alpha', risk: 'Mínimo' })
    expect(rows[1]).toMatchObject({ id: 's2', days30_60: 90, over90: 5, risk: 'Crítico' })
  })

  it('filtra por nombre case-insensitive', () => {
    expect(buildSupplierAgingRows(ROWS, 'ALP')).toHaveLength(1)
    expect(buildSupplierAgingRows(ROWS, 'ALP')[0].id).toBe('s1')
    expect(buildSupplierAgingRows(ROWS, 'gamma')).toHaveLength(0)
  })
})
