import { describe, expect, it } from 'vitest'
import {
  PRORRATEO_STATUS_TONE,
  allocationTypeKey,
  prorrateoDetailRows,
  prorrateoKpis,
  prorrateoRows,
  prorrateoStatusKey,
} from './prorrateo'
import type { ProrrateoDetail, ProrrateoPeriod } from '@/types/bi'

const period = (overrides: Partial<ProrrateoPeriod> = {}): ProrrateoPeriod => ({
  id: 1,
  period_start: '2026-10-01T00:00:00Z',
  period_end: '2026-11-01T00:00:00Z',
  total_taxable_sales: 1000,
  total_exempt_sales: 100,
  total_sales: 1100,
  deducibility_coefficient: 0.909,
  total_vat_credit: 1000,
  deductible_vat_credit: 909,
  non_deductible_vat_credit: 91,
  status: 'PROCESSED',
  created_at: '2026-11-02T00:00:00Z',
  updated_at: '2026-11-02T00:00:00Z',
  ...overrides,
})

const detail: ProrrateoDetail = {
  id: 10,
  prorrateo_period_id: 1,
  purchase_order_id: 42,
  original_vat_credit: 1000,
  deductible_portion: 909,
  non_deductible_portion: 91,
  allocation_type: 'INDIRECT',
  notes: 'prorrateo',
  created_at: '2026-11-02T00:00:00Z',
}

describe('finance/prorrateo', () => {
  it('ordena el historial por período descendente y convierte el coeficiente', () => {
    const rows = prorrateoRows([
      period({ id: 1, period_start: '2026-09-01T00:00:00Z' }),
      period({ id: 2, period_start: '2026-10-01T00:00:00Z' }),
    ])
    expect(rows.map((row) => row.id)).toEqual([2, 1])
    expect(rows[0].coefficientPct).toBe(90.9)
    expect(prorrateoRows(null)).toEqual([])
  })

  it('arma los KPIs del período con el coeficiente como porcentaje', () => {
    const kpis = prorrateoKpis(period())
    expect(kpis.map((kpi) => kpi.id)).toEqual([
      'prorrateoTotalCredit',
      'prorrateoDeductible',
      'prorrateoNonDeductible',
      'prorrateoCoefficient',
    ])
    expect(kpis[3].value).toBe(90.9)
    expect(prorrateoKpis(null)).toEqual([])
  })

  it('traduce estados y tipos de asignación', () => {
    expect(prorrateoStatusKey('PROCESSED')).toBe('processed')
    expect(prorrateoStatusKey('OTHER')).toBe('unknown')
    expect(PRORRATEO_STATUS_TONE.processed).toBe('success')
    expect(allocationTypeKey('INDIRECT')).toBe('indirect')
    expect(allocationTypeKey('OTHER')).toBe('unknown')
  })

  it('normaliza el detalle con su asignación', () => {
    const rows = prorrateoDetailRows([detail])
    expect(rows[0].allocation).toBe('indirect')
    expect(prorrateoDetailRows(null)).toEqual([])
  })
})
