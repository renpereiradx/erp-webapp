import { describe, expect, it } from 'vitest'
import {
  agingBucketRows,
  agingBucketsTotal,
  agingBars,
  agingUnclassifiedAmount,
  supplierAgingPageTotals,
  supplierAgingRows,
  supplierRiskKey,
} from './aging'
import type { PayablesAgingSummary, SupplierAgingDetail } from '@/types/bi'

const summary: PayablesAgingSummary = {
  current: { amount: 100, count: 1, percentage: 10 },
  days_30_60: { amount: 200, count: 2, percentage: 20 },
  days_60_90: { amount: 300, count: 3, percentage: 30 },
  over_90_days: { amount: 400, count: 4, percentage: 40 },
}

const supplier = (overrides: Partial<SupplierAgingDetail> = {}): SupplierAgingDetail => ({
  supplier_id: 'SP-1',
  supplier_name: 'Protek',
  current: 0,
  days_30_60: 0,
  days_60_90: 0,
  over_90_days: 0,
  total: 0,
  ...overrides,
})

describe('payables/aging', () => {
  it('ordena los tramos y conserva montos/porcentajes del payload', () => {
    const rows = agingBucketRows(summary)
    expect(rows.map((row) => row.key)).toEqual([
      'current',
      'days_30_60',
      'days_60_90',
      'over_90_days',
    ])
    expect(rows[3]).toEqual({
      key: 'over_90_days',
      amount: 400,
      count: 4,
      percentage: 40,
    })
    expect(agingBucketsTotal(summary)).toBe(1000)
    expect(agingBucketRows(null)).toEqual([])
  })

  it('calcula el remanente sin clasificar sin volverse negativo', () => {
    expect(agingUnclassifiedAmount(1050, summary)).toBe(50)
    expect(agingUnclassifiedAmount(900, summary)).toBe(0)
    expect(agingUnclassifiedAmount(null, null)).toBe(0)
  })

  it('clasifica el riesgo del proveedor por sus tramos', () => {
    expect(supplierRiskKey(supplier({ over_90_days: 1 }))).toBe('critical')
    expect(supplierRiskKey(supplier({ days_60_90: 1 }))).toBe('moderate')
    expect(supplierRiskKey(supplier({ days_30_60: 60, total: 100 }))).toBe('moderate')
    expect(supplierRiskKey(supplier({ days_30_60: 40, total: 100 }))).toBe('minimal')
  })

  it('agrega el riesgo a cada fila sin perder el orden del BE', () => {
    const rows = supplierAgingRows([
      supplier({ supplier_id: 'A', over_90_days: 10, total: 10 }),
      supplier({ supplier_id: 'B', current: 5, total: 5 }),
    ])
    expect(rows.map((row) => [row.supplier_id, row.risk])).toEqual([
      ['A', 'critical'],
      ['B', 'minimal'],
    ])
    expect(supplierAgingRows(null)).toEqual([])
  })

  it('suma los totales de la página', () => {
    expect(
      supplierAgingPageTotals([
        supplier({ current: 1, days_30_60: 2, days_60_90: 3, over_90_days: 4, total: 10 }),
        supplier({ current: 5, days_30_60: 5, total: 10 }),
      ]),
    ).toEqual({ current: 6, days30to60: 7, days60to90: 3, over90: 4, total: 20 })
  })

  it('arma las barras con el tono de cada tramo', () => {
    expect(agingBars(summary).map((bar) => bar.tone)).toEqual([
      'current',
      'warning',
      'warning',
      'critical',
    ])
    expect(agingBars(null)).toEqual([])
  })
})
