import { describe, expect, it } from 'vitest'
import { translatePriority, translateStatus } from './statusLabels'

describe('translateStatus', () => {
  it.each([
    ['OVERDUE', 'VENCIDO'],
    ['PENDING', 'PENDIENTE'],
    ['PARTIAL', 'PARCIAL'],
    ['PAID', 'PAGADO'],
    ['overdue', 'VENCIDO'], // case-insensitive
    ['UNKNOWN', 'UNKNOWN'], // pasa tal cual en mayúsculas
    [null, 'PENDIENTE'],
    [undefined, 'PENDIENTE'],
    ['', 'PENDIENTE'],
  ])('%s → %s', (status, expected) => {
    expect(translateStatus(status)).toBe(expected)
  })
})

describe('translatePriority', () => {
  it.each([
    ['URGENT', 'ALTA'],
    ['HIGH', 'ALTA'],
    ['MEDIUM', 'MEDIA'],
    ['LOW', 'BAJA'],
    ['low', 'BAJA'],
    ['CRITICAL', 'CRITICAL'],
    [null, 'MEDIA'],
    [undefined, 'MEDIA'],
  ])('%s → %s', (priority, expected) => {
    expect(translatePriority(priority)).toBe(expected)
  })
})
