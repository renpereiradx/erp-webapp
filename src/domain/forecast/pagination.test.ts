import { describe, expect, it } from 'vitest'
import { paginateRows } from './pagination'

const rows = Array.from({ length: 23 }, (_, index) => index + 1)

describe('forecast/pagination', () => {
  it('recorta la página con totales reales', () => {
    const first = paginateRows(rows, 1, 10)
    expect(first.rows).toHaveLength(10)
    expect(first.rows[0]).toBe(1)
    expect(first.totalItems).toBe(23)
    expect(first.totalPages).toBe(3)
    expect(first.page).toBe(1)

    const last = paginateRows(rows, 3, 10)
    expect(last.rows).toEqual([21, 22, 23])
  })

  it('clampea la página pedida al rango real', () => {
    expect(paginateRows(rows, 99, 10).page).toBe(3)
    expect(paginateRows(rows, 0, 10).page).toBe(1)
    expect(paginateRows(rows, -2, 10).page).toBe(1)
  })

  it('una lista vacía sigue teniendo una página', () => {
    const empty = paginateRows([], 1, 10)
    expect(empty.rows).toEqual([])
    expect(empty.totalPages).toBe(1)
    expect(empty.totalItems).toBe(0)
  })
})
