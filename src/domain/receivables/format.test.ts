import { describe, expect, it } from 'vitest'
import {
  daysSince,
  formatCount,
  formatDate,
  formatDateTime,
  formatDays,
  formatMoney,
  formatPercent,
  formatRange,
  formatSignedMoney,
  formatUtcDayMonth,
  formatUtcDate,
  isMissingDate,
  parseStatisticsRange,
  previousDay,
  roundPercent,
  toNumberOrNull,
} from './format'

describe('receivables/format (F7)', () => {
  it('toNumberOrNull distingue ausente de cero y descarta NaN', () => {
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
    expect(toNumberOrNull('')).toBeNull()
    expect(toNumberOrNull('abc')).toBeNull()
    expect(toNumberOrNull(0)).toBe(0)
    expect(toNumberOrNull('314600')).toBe(314600)
  })

  it('redondea porcentajes sin exponer floats crudos', () => {
    expect(roundPercent(35.95391392748221)).toBe(36)
    expect(roundPercent(286.900826446281)).toBe(286.9)
    expect(roundPercent(null)).toBeNull()
  })

  it('formatea montos en PYG y usa — cuando el campo no existe', () => {
    expect(formatMoney(1475500)).toBe('Gs. 1.475.500')
    expect(formatMoney(0)).toBe('Gs. 0')
    expect(formatMoney(315250.38)).toBe('Gs. 315.250')
    expect(formatMoney(0.38)).toBe('Gs. 0,38')
    expect(formatMoney(null)).toBe('—')
  })

  it('formatea saldos con signo sin prefijar el monto negativo', () => {
    expect(formatSignedMoney(-41860)).toBe('-Gs. 41.860')
    expect(formatSignedMoney(-0.38)).toBe('-Gs. 0,38')
    expect(formatSignedMoney(0)).toBe('Gs. 0')
    expect(formatSignedMoney(null)).toBe('—')
  })

  it('formatea porcentajes, conteos y días', () => {
    expect(formatPercent(35.95391392748221)).toBe('36%')
    expect(formatPercent(286.900826446281)).toBe('286,9%')
    expect(formatPercent(null)).toBe('—')
    expect(formatCount(3)).toBe('3')
    expect(formatCount(undefined)).toBe('—')
    expect(formatDays(115.86206896551724)).toBe('116')
    expect(formatDays(0)).toBe('0')
    expect(formatDays(null)).toBe('—')
  })

  it('el cero de Go y una fecha inválida no son fechas reales', () => {
    expect(isMissingDate('0001-01-01T00:00:00Z')).toBe(true)
    expect(isMissingDate('')).toBe(true)
    expect(isMissingDate('no-es-fecha')).toBe(true)
    expect(isMissingDate('2026-10-20T12:00:00Z')).toBe(false)
  })

  it('formatea timestamps locales y fechas date-only en UTC', () => {
    expect(formatDate('2026-10-20T15:00:00Z', 'es')).toBe('20 oct 2026')
    expect(formatDate('0001-01-01T00:00:00Z', 'es')).toBe('—')
    expect(formatUtcDate('2026-10-01', 'es')).toBe('01 oct 2026')
    expect(formatUtcDayMonth('2026-09-28', 'es')).toBe('28 sept')
    expect(formatDateTime('2026-10-20T15:04:00Z', 'es')).toContain('20 oct 2026')
  })

  it('parsea el rango de statistics (fin exclusivo) y lo muestra inclusivo', () => {
    expect(parseStatisticsRange('2026-10-01 - 2026-11-01')).toEqual({
      start: '2026-10-01',
      end: '2026-11-01',
    })
    expect(parseStatisticsRange('basura')).toBeNull()
    expect(previousDay('2026-11-01')).toBe('2026-10-31')
    expect(previousDay('2026-03-01')).toBe('2026-02-28')
    expect(formatRange('2026-10-01', '2026-11-01', 'es')).toBe('01 oct 2026 – 31 oct 2026')
    expect(formatRange(null, '2026-11-01', 'es')).toBe('—')
  })

  it('daysSince cuenta días calendario desde la venta', () => {
    const now = new Date('2026-10-20T20:00:00-03:00')
    expect(daysSince('2026-10-01T10:00:00Z', now)).toBe(19)
    expect(daysSince('2026-10-21T10:00:00Z', now)).toBe(0)
    expect(daysSince(null, now)).toBeNull()
  })
})
