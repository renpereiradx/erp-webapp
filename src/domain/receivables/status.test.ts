import { describe, expect, it } from 'vitest'
import {
  HIGH_PRIORITY_DAYS,
  RECEIVABLE_STATUS_TONE,
  RECEIVABLES_STATUS_FILTERS,
  receivableStatusKey,
  receivablesPriorityKey,
  toStatusParam,
} from './status'

describe('receivables/status (F7)', () => {
  it('normaliza los estados que devuelve el BE y tolera desconocidos', () => {
    expect(receivableStatusKey('OVERDUE')).toBe('overdue')
    expect(receivableStatusKey('pending')).toBe('pending')
    expect(receivableStatusKey('PARTIAL')).toBe('partial')
    expect(receivableStatusKey('PAID')).toBe('paid')
    expect(receivableStatusKey('CANCELLED')).toBe('unknown')
    expect(receivableStatusKey(null)).toBe('unknown')
    expect(RECEIVABLE_STATUS_TONE.overdue).toBe('error')
  })

  it('solo ofrece los tres filtros que el BE reconoce (más "todas")', () => {
    expect(RECEIVABLES_STATUS_FILTERS).toEqual(['ALL', 'PENDING', 'PARTIAL', 'OVERDUE'])
    // El sentinela ALL no viaja: el enum del BE no lo acepta.
    expect(toStatusParam('ALL')).toBeUndefined()
    expect(toStatusParam('OVERDUE')).toBe('OVERDUE')
  })

  it('prioriza con el mismo umbral que high_priority_count (>60 días)', () => {
    expect(HIGH_PRIORITY_DAYS).toBe(60)
    expect(receivablesPriorityKey(61)).toBe('high')
    expect(receivablesPriorityKey(60)).toBe('medium')
    expect(receivablesPriorityKey(31)).toBe('medium')
    expect(receivablesPriorityKey(30)).toBe('low')
    expect(receivablesPriorityKey(1)).toBe('low')
    expect(receivablesPriorityKey(0)).toBe('none')
    expect(receivablesPriorityKey(null)).toBe('none')
  })
})
