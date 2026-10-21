import { describe, expect, it } from 'vitest'
import {
  daysSince,
  formatCount,
  formatDate,
  formatDays,
  formatMoney,
  formatPercent,
  formatRange,
  formatSignedMoney,
  formatUtcDate,
  formatUtcDayMonth,
  isMissingDate,
  parseStatisticsRange,
  previousDay,
  roundPercent,
  toNumberOrNull,
  toUtcDateKey,
} from './format'

describe('payables/format', () => {
  it('distingue ausencia de cero', () => {
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
    expect(toNumberOrNull('')).toBeNull()
    expect(toNumberOrNull('12.5')).toBe(12.5)
    expect(toNumberOrNull('nope')).toBeNull()
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(0)).toBe('Gs. 0')
  })

  it('muestra sub-unidad con 2 decimales en vez de redondear a Gs. 0', () => {
    expect(formatMoney(0.38)).toContain('0,38')
    expect(formatMoney(-0.5)).toContain('-')
  })

  it('redondea porcentajes y días', () => {
    expect(roundPercent(35.95391392748221)).toBe(36)
    expect(formatPercent(93.75, 1)).toBe('93,8%')
    expect(formatPercent(0)).toBe('0%')
    // Un valor real >0 que redondea a 0 no se muestra como cero.
    expect(formatPercent(0.02)).toBe('<0,1%')
    expect(formatPercent(0.004, 2)).toBe('<0,01%')
    expect(formatPercent(null)).toBe('—')
    expect(formatDays(0)).toBe('0')
    expect(formatDays(null)).toBe('—')
    expect(formatCount(1200)).toContain('1.200')
  })

  it('firma montos negativos', () => {
    expect(formatSignedMoney(-41860)).toMatch(/^-Gs\./)
    expect(formatSignedMoney(0)).toBe('Gs. 0')
  })

  it('trata el cero de Go y las fechas inválidas como ausentes', () => {
    expect(isMissingDate('0001-01-01T00:00:00Z')).toBe(true)
    expect(isMissingDate('')).toBe(true)
    expect(isMissingDate('2026-10-20T10:00:00Z')).toBe(false)
    expect(formatDate('0001-01-01T00:00:00Z')).toBe('—')
    expect(formatUtcDate('2026-09-28T00:00:00Z', 'es')).toContain('2026')
    expect(formatUtcDayMonth('2026-09-28T00:00:00Z', 'es')).toContain('28')
  })

  it('parsea el rango de estadísticas (fin exclusivo) y lo muestra inclusivo', () => {
    expect(parseStatisticsRange('2026-09-01 - 2026-10-01')).toEqual({
      start: '2026-09-01',
      end: '2026-10-01',
    })
    expect(parseStatisticsRange('nope')).toBeNull()
    expect(previousDay('2026-10-01')).toBe('2026-09-30')
    expect(formatRange('2026-09-01', '2026-10-01', 'es')).toContain('30')
  })

  it('deriva días calendario sin arrastrar la hora', () => {
    const now = new Date('2026-10-20T23:30:00-03:00')
    expect(daysSince('2026-10-19T01:00:00-03:00', now)).toBe(1)
    expect(daysSince('2026-10-25T01:00:00-03:00', now)).toBe(0)
    expect(daysSince('0001-01-01T00:00:00Z', now)).toBeNull()
  })

  it('normaliza una fecha date-only a su clave UTC', () => {
    expect(toUtcDateKey('2026-10-05T00:00:00Z')).toBe('2026-10-05')
    expect(toUtcDateKey('0001-01-01T00:00:00Z')).toBeNull()
  })
})
