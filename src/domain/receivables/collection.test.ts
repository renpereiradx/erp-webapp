import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RECEIVABLES_SORT,
  RECEIVABLES_SORT_DEFAULT_ORDER,
  RECEIVABLES_SORT_FIELDS,
  ariaSortFor,
  collectionTrendRows,
  nextReceivablesSort,
} from './collection'

describe('receivables/collection (F7)', () => {
  it('solo expone la whitelist de orden del BE', () => {
    expect(RECEIVABLES_SORT_FIELDS).toEqual(['date', 'amount', 'client', 'days_overdue'])
    expect(DEFAULT_RECEIVABLES_SORT).toEqual({ by: 'date', order: 'DESC' })
  })

  it('al cambiar de columna usa su dirección por defecto', () => {
    expect(nextReceivablesSort({ by: 'date', order: 'DESC' }, 'client')).toEqual({
      by: 'client',
      order: 'ASC',
    })
    expect(nextReceivablesSort({ by: 'client', order: 'ASC' }, 'amount')).toEqual({
      by: 'amount',
      order: 'DESC',
    })
    expect(RECEIVABLES_SORT_DEFAULT_ORDER.days_overdue).toBe('DESC')
  })

  it('al clickear la misma columna invierte el orden', () => {
    expect(nextReceivablesSort({ by: 'amount', order: 'DESC' }, 'amount')).toEqual({
      by: 'amount',
      order: 'ASC',
    })
    expect(nextReceivablesSort({ by: 'amount', order: 'ASC' }, 'amount')).toEqual({
      by: 'amount',
      order: 'DESC',
    })
  })

  it('aria-sort refleja la columna activa', () => {
    expect(ariaSortFor({ by: 'client', order: 'ASC' }, 'client')).toBe('ascending')
    expect(ariaSortFor({ by: 'client', order: 'DESC' }, 'client')).toBe('descending')
    expect(ariaSortFor({ by: 'client', order: 'ASC' }, 'date')).toBe('none')
  })

  it('descarta el bucket posterior al fin del rango y ordena por fecha', () => {
    const rows = collectionTrendRows(
      [
        { date: '2026-10-12', billed: 75400, collected: 117260, balance: -41860 },
        { date: '2026-09-28', billed: 1254100, collected: 1254100, balance: 0 },
        { date: '2026-11-02', billed: 0, collected: 0, balance: -41860 },
        { date: '2026-10-05', billed: 26000, collected: 26000, balance: 0 },
      ],
      { start: '2026-10-01', end: '2026-11-01' },
    )
    expect(rows.map((row) => row.date)).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
    ])
    expect(rows[0].balance).toBe(0)
  })

  it('sin rango conserva la serie y sin datos devuelve lista vacía', () => {
    expect(
      collectionTrendRows([{ date: '2026-10-05', billed: 1, collected: 1, balance: 0 }], null),
    ).toHaveLength(1)
    expect(collectionTrendRows(null, null)).toEqual([])
  })
})
