import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PAYABLES_SORT,
  EMPTY_PAYABLES_FILTERS,
  PAYABLES_SORT_DEFAULT_ORDER,
  ariaSortFor,
  hasActivePayablesFilters,
  isInvalidDateRange,
  nextPayablesSort,
} from './listing'

describe('payables/listing', () => {
  it('arranca en vencimiento ascendente, como el BE', () => {
    expect(DEFAULT_PAYABLES_SORT).toEqual({ by: 'due_date', order: 'ASC' })
    expect(PAYABLES_SORT_DEFAULT_ORDER.amount).toBe('DESC')
    expect(PAYABLES_SORT_DEFAULT_ORDER.supplier).toBe('ASC')
  })

  it('alterna la misma columna y estrena dirección en una nueva', () => {
    expect(nextPayablesSort({ by: 'amount', order: 'DESC' }, 'amount')).toEqual({
      by: 'amount',
      order: 'ASC',
    })
    expect(nextPayablesSort({ by: 'amount', order: 'DESC' }, 'supplier')).toEqual({
      by: 'supplier',
      order: 'ASC',
    })
  })

  it('expone aria-sort de la columna activa', () => {
    expect(ariaSortFor({ by: 'date', order: 'DESC' }, 'date')).toBe('descending')
    expect(ariaSortFor({ by: 'date', order: 'ASC' }, 'date')).toBe('ascending')
    expect(ariaSortFor({ by: 'date', order: 'ASC' }, 'amount')).toBe('none')
  })

  it('detecta rango inválido solo con ambas fechas', () => {
    expect(isInvalidDateRange('2026-10-05', '2026-10-01')).toBe(true)
    expect(isInvalidDateRange('2026-10-01', '2026-10-05')).toBe(false)
    expect(isInvalidDateRange('2026-10-01', '')).toBe(false)
    expect(isInvalidDateRange('', '')).toBe(false)
  })

  it('detecta filtros activos', () => {
    expect(hasActivePayablesFilters(EMPTY_PAYABLES_FILTERS)).toBe(false)
    expect(
      hasActivePayablesFilters({ ...EMPTY_PAYABLES_FILTERS, search: '  ' }),
    ).toBe(false)
    expect(
      hasActivePayablesFilters({ ...EMPTY_PAYABLES_FILTERS, priority: 'URGENT' }),
    ).toBe(true)
    expect(
      hasActivePayablesFilters({ ...EMPTY_PAYABLES_FILTERS, endDate: '2026-10-01' }),
    ).toBe(true)
  })
})
