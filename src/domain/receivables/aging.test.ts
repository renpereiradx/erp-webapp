import { describe, expect, it } from 'vitest'
import {
  agingBucketRows,
  agingBucketsTotal,
  clientAgingRow,
  clientAgingRows,
  hasUnclassifiedClientAging,
  invoiceAgingBreakdown,
  sumClientAgingPage,
  unclassifiedAgingAmount,
} from './aging'
import type { ClientAgingDetail, ReceivablesAgingSummary } from '@/types/bi'

const SUMMARY: ReceivablesAgingSummary = {
  current: { amount: 0, count: 0, percentage: 0 },
  days_30_60: { amount: 0, count: 0, percentage: 0 },
  days_60_90: { amount: 0, count: 0, percentage: 0 },
  over_90_days: { amount: 315250.38, count: 3, percentage: 100 },
}

const CLIENT = (overrides: Partial<ClientAgingDetail> = {}): ClientAgingDetail => ({
  client_id: 'CL-1',
  client_name: 'Erika Maciel',
  current: 0,
  days_30_60: 0,
  days_60_90: 0,
  over_90_days: 314600,
  total: 314600,
  ...overrides,
})

describe('receivables/aging (F7)', () => {
  it('expone los 4 tramos en orden con los montos del resumen', () => {
    const rows = agingBucketRows(SUMMARY)
    expect(rows.map((row) => row.key)).toEqual([
      'current',
      'days_30_60',
      'days_60_90',
      'over_90_days',
    ])
    expect(rows[3]).toMatchObject({ amount: 315250.38, count: 3, percentage: 100 })
    expect(agingBucketsTotal(SUMMARY)).toBe(315250.38)
  })

  it('sin resumen devuelve tramos en cero (nunca undefined)', () => {
    expect(agingBucketRows(null)).toHaveLength(4)
    expect(agingBucketsTotal(undefined)).toBe(0)
  })

  it('detecta un total sin clasificar solo cuando es positivo', () => {
    expect(unclassifiedAgingAmount(315250.38, SUMMARY)).toBe(0)
    expect(unclassifiedAgingAmount(400000, SUMMARY)).toBe(84749.62)
    // Un total menor (sobrepagos netos del overview) no se inventa como tramo.
    expect(unclassifiedAgingAmount(300000, SUMMARY)).toBe(0)
    expect(unclassifiedAgingAmount(null, SUMMARY)).toBe(0)
  })

  it('deriva el no clasificado por cliente y los totales de la página', () => {
    const row = clientAgingRow(CLIENT({ total: 140000, over_90_days: 0 }))
    expect(row.unclassified).toBe(140000)

    const rows = clientAgingRows([
      CLIENT(),
      CLIENT({ client_id: 'CL-2', current: 1000, over_90_days: 0, total: 1000 }),
    ])
    expect(rows).toHaveLength(2)
    expect(hasUnclassifiedClientAging(rows)).toBe(false)
    expect(
      hasUnclassifiedClientAging([clientAgingRow(CLIENT({ total: 400000 }))]),
    ).toBe(true)
    expect(sumClientAgingPage(rows)).toEqual({
      current: 1000,
      days_30_60: 0,
      days_60_90: 0,
      over_90_days: 314600,
      unclassified: 0,
      total: 315600,
    })
    expect(clientAgingRows(null)).toEqual([])
  })

  it('deriva la antigüedad de las cuentas listadas desde sale_date', () => {
    const now = new Date('2026-10-20T20:00:00-03:00')
    const breakdown = invoiceAgingBreakdown(
      [
        { pending_amount: 1000, sale_date: '2026-10-15T12:00:00Z' },
        { pending_amount: 2000, sale_date: '2026-09-15T12:00:00Z' },
        { pending_amount: 4000, sale_date: '2026-08-15T12:00:00Z' },
        { pending_amount: 8000, sale_date: '2026-01-15T12:00:00Z' },
        { pending_amount: 0, sale_date: '2026-10-15T12:00:00Z' },
      ],
      now,
    )
    expect(breakdown.rows.map((row) => row.amount)).toEqual([1000, 2000, 4000, 8000])
    expect(breakdown.rows.map((row) => row.count)).toEqual([1, 1, 1, 1])
    expect(breakdown.unclassifiedAmount).toBe(0)
    expect(breakdown.total).toBe(15000)
    expect(breakdown.rows[3].percentage).toBeCloseTo(53.33, 2)
  })

  it('suma como no clasificada la deuda sin fecha de venta válida', () => {
    const breakdown = invoiceAgingBreakdown(
      [
        { pending_amount: 500, sale_date: '0001-01-01T00:00:00Z' },
        { pending_amount: 1500, sale_date: '2026-10-15T12:00:00Z' },
      ],
      new Date('2026-10-20T12:00:00-03:00'),
    )
    expect(breakdown.unclassifiedAmount).toBe(500)
    expect(breakdown.total).toBe(2000)
    expect(breakdown.rows[0].amount).toBe(1500)
  })
})
