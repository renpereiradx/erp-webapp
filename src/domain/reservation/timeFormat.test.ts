import { describe, expect, it } from 'vitest'
import { formatSlotRangeEnd, formatSlotTime } from './timeFormat'

describe('formatSlotTime', () => {
  it('extrae HH:mm de un ISO con T', () => {
    expect(formatSlotTime('2026-10-14T16:00:00Z')).toBe('16:00')
    expect(formatSlotTime('2026-10-14T09:30:00Z')).toBe('09:30')
  })

  it('cae a substring para formatos sin T', () => {
    expect(formatSlotTime('2026-10-14 16:00:00')).toBe('16:00')
  })

  it('devuelve vacío para entrada vacía', () => {
    expect(formatSlotTime('')).toBe('')
  })
})

describe('formatSlotRangeEnd', () => {
  it('suma la duración en horas al inicio', () => {
    expect(formatSlotRangeEnd('2026-10-14T16:00:00Z', 2)).toBe('18:00')
  })

  it('cruza la medianoche sin desfase', () => {
    expect(formatSlotRangeEnd('2026-10-14T23:00:00Z', 2)).toBe('01:00')
  })

  it('devuelve vacío sin inicio', () => {
    expect(formatSlotRangeEnd('', 1)).toBe('')
  })
})
