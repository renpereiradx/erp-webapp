import { describe, expect, it } from 'vitest'
import { paymentTrendRows } from './statistics'

describe('payables/statistics', () => {
  it('ordena la serie semanal y descarta fechas inválidas', () => {
    expect(
      paymentTrendRows([
        { date: '2026-10-12', purchased: 10, paid: 0, balance: 10 },
        { date: '0001-01-01', purchased: 0, paid: 0, balance: 0 },
        { date: '2026-10-05', purchased: 0, paid: 5, balance: 5 },
      ]).map((row) => row.date),
    ).toEqual(['2026-10-05', '2026-10-12'])
    expect(paymentTrendRows(null)).toEqual([])
  })

  it('descarta el bucket que arranca después del fin exclusivo del rango', () => {
    const rows = paymentTrendRows(
      [
        { date: '2026-10-26', purchased: 0, paid: 0, balance: 0 },
        { date: '2026-11-02', purchased: 0, paid: 0, balance: 0 },
      ],
      { start: '2026-10-01', end: '2026-11-01' },
    )
    expect(rows.map((row) => row.date)).toEqual(['2026-10-26'])
  })
})
