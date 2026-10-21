import { describe, expect, it } from 'vitest'
import {
  addLocalDays,
  formatCount,
  formatDate,
  formatDateTime,
  formatDecimal,
  formatDuration,
  formatHour,
  formatPercent,
  formatAuditPeriodRange,
  formatSuccessRate,
  formatUtcDate,
  formatUtcDayMonth,
  isMissingDate,
  roundPercent,
  toLocalDateKey,
  toNumberOrNull,
} from './format'

describe('audit/format', () => {
  it('distingue ausencia de cero', () => {
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
    expect(toNumberOrNull('')).toBeNull()
    expect(toNumberOrNull('12.5')).toBe(12.5)
    expect(toNumberOrNull('nope')).toBeNull()
    expect(formatCount(null)).toBe('—')
    expect(formatCount(0)).toBe('0')
    expect(formatCount(8818)).toBe('8.818')
    expect(formatDecimal(null)).toBe('—')
    expect(formatDecimal(0.446575)).toBe('0,45')
  })

  it('redondea porcentajes y marca el sub-0,1% real', () => {
    expect(roundPercent(94.44444444444444)).toBe(94.4)
    expect(formatPercent(94.44444444444444)).toBe('94,4%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(0.044)).toBe('<0,1%')
    expect(formatPercent(null)).toBe('—')
  })

  it('la tasa de éxito sin acciones es n/d, no 0%', () => {
    expect(formatSuccessRate(0, 0, 0)).toBe('n/d')
    expect(formatSuccessRate(null)).toBe('n/d')
    expect(formatSuccessRate(180, 170, 94.4444)).toBe('94,4%')
    expect(formatSuccessRate(4, 3)).toBe('75%')
    expect(formatSuccessRate(4, null)).toBe('n/d')
  })

  it('hora pico y duración', () => {
    expect(formatHour(19)).toBe('19:00')
    expect(formatHour(0)).toBe('00:00')
    expect(formatHour(24)).toBe('—')
    expect(formatHour(null)).toBe('—')
    expect(formatDuration(36)).toBe('36 ms')
    expect(formatDuration(0)).toBe('0 ms')
    expect(formatDuration(null)).toBe('—')
  })

  it('fechas date-only en UTC vs timestamps locales', () => {
    expect(formatUtcDayMonth('2026-10-20T00:00:00Z', 'es')).toBe('20 oct')
    expect(formatUtcDate('2026-10-20T00:00:00Z', 'es')).toBe('20 oct 2026')
    expect(formatUtcDayMonth('0001-01-01T00:00:00Z', 'es')).toBe('—')
    expect(isMissingDate(undefined)).toBe(true)
    expect(isMissingDate('nope')).toBe(true)
    expect(isMissingDate('0001-01-01T00:00:00Z')).toBe(true)
    expect(isMissingDate('2026-10-20T12:00:00-03:00')).toBe(false)
    expect(formatDate('2026-10-20T12:00:00-03:00', 'es')).toContain('2026')
    expect(formatDateTime('nope', 'es')).toBe('—')
  })

  it('llaves de día local y aritmética de días', () => {
    const now = new Date(2026, 9, 21, 12, 0, 0)
    expect(toLocalDateKey(now)).toBe('2026-10-21')
    expect(toLocalDateKey(addLocalDays(now, -29))).toBe('2026-09-22')
    expect(toLocalDateKey(addLocalDays(now, 1))).toBe('2026-10-22')
  })

  it('rango del período con fin exclusivo mostrado inclusive', () => {
    const range = formatAuditPeriodRange(
      {
        start_date: '2026-10-01T12:00:00-03:00',
        end_date: '2026-10-21T12:00:00-03:00',
      },
      'es',
    )
    expect(range).toContain('01')
    expect(range).toContain('20')
    expect(range).toContain('2026')
    expect(formatAuditPeriodRange(null, 'es')).toBe('—')
    expect(formatAuditPeriodRange({ start_date: 'nope', end_date: '' }, 'es')).toBe('—')
  })
})
