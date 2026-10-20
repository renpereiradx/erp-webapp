import { describe, expect, it } from 'vitest'
import {
  daysSince,
  formatCount,
  formatDays,
  formatIsoDate,
  formatMoney,
  formatPercent,
  formatPeriodRange,
  formatSignedPercent,
  formatTrendDate,
  formatUnits,
  inclusiveEndDate,
  isMissingDate,
  roundPercent,
  toNumberOrNull,
} from './format'

describe('toNumberOrNull / roundPercent', () => {
  it('trata null, undefined, "" y NaN como ausentes', () => {
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
    expect(toNumberOrNull('')).toBeNull()
    expect(toNumberOrNull('abc')).toBeNull()
    expect(toNumberOrNull('12.5')).toBe(12.5)
  })

  it('redondea a la cantidad de decimales pedida', () => {
    expect(roundPercent(35.95391392748221)).toBe(36)
    expect(roundPercent(35.95391392748221, 2)).toBe(35.95)
    expect(roundPercent(null)).toBeNull()
  })
})

describe('formatMoney', () => {
  it.each([
    [1475500, 'Gs. 1.475.500'],
    [0, 'Gs. 0'],
    [-10000, 'Gs. -10.000'],
    [null, '—'],
    [undefined, '—'],
    [Number.NaN, '—'],
  ])('%s → %s', (value, expected) => {
    expect(formatMoney(value)).toBe(expected)
  })
})

describe('formatPercent / formatSignedPercent', () => {
  it('redondea y agrega el símbolo', () => {
    expect(formatPercent(35.95391392748221)).toBe('36%')
    expect(formatPercent(35.95391392748221, 2)).toBe('35,95%')
    expect(formatPercent(null)).toBe('—')
  })

  it('firma solo los valores positivos', () => {
    expect(formatSignedPercent(51.1417)).toBe('+51,1%')
    expect(formatSignedPercent(-2.1917)).toBe('-2,2%')
    expect(formatSignedPercent(0)).toBe('0%')
    expect(formatSignedPercent(null)).toBe('—')
  })
})

describe('conteos, unidades, días y fechas', () => {
  it('formatea conteos con separador de miles', () => {
    expect(formatCount(1234)).toBe('1.234')
    expect(formatCount(null)).toBe('—')
  })

  it('formatUnits trata 0/negativo como ausente (base qty no normalizada)', () => {
    expect(formatUnits(4)).toBe('4')
    expect(formatUnits(0)).toBe('—')
    expect(formatUnits(-1)).toBe('—')
    expect(formatUnits(null)).toBe('—')
  })

  it('formatDays conserva el 0 real', () => {
    expect(formatDays(0)).toBe('0')
    expect(formatDays(30)).toBe('30')
    expect(formatDays(null)).toBe('—')
  })

  it('detecta fechas inválidas o el cero de Go', () => {
    expect(isMissingDate(null)).toBe(true)
    expect(isMissingDate('0001-01-01T00:00:00Z')).toBe(true)
    expect(isMissingDate('no-es-fecha')).toBe(true)
    expect(isMissingDate('2026-10-01T00:00:00Z')).toBe(false)
  })

  it('formatIsoDate devuelve — para fechas ausentes', () => {
    expect(formatIsoDate(null)).toBe('—')
    expect(formatIsoDate('2026-10-20T12:00:00Z', 'es')).toContain('2026')
  })
})

describe('fechas date-only (UTC)', () => {
  it('formatea el día/mes del bucket sin corrimiento de huso', () => {
    expect(formatTrendDate('2026-10-01T00:00:00Z', 'daily', 'es')).toBe('01 oct')
    expect(formatTrendDate('2026-10-01T00:00:00Z', 'weekly', 'es')).toBe('01 oct')
  })

  it('formatea el mes del bucket mensual', () => {
    expect(formatTrendDate('2026-10-01T00:00:00Z', 'monthly', 'es')).toBe('oct 2026')
  })

  it('inclusiveEndDate resta un día porque el fin del BE es exclusivo', () => {
    expect(inclusiveEndDate('2026-11-01T00:00:00-03:00', 'es')).toBe('31 oct 2026')
    expect(inclusiveEndDate(null)).toBe('—')
  })

  it('formatPeriodRange muestra el rango aplicado con fin inclusivo', () => {
    expect(
      formatPeriodRange(
        { start_date: '2026-10-01T00:00:00-03:00', end_date: '2026-11-01T00:00:00-03:00' },
        'es',
      ),
    ).toBe('01 oct 2026 – 31 oct 2026')
    expect(formatPeriodRange(null, 'es')).toBe('—')
  })
})

describe('daysSince', () => {
  it('cuenta días calendario completos, no el componente día', () => {
    const now = new Date(2026, 9, 20, 9, 0, 0)
    const last = new Date(2026, 8, 14, 23, 30, 0)
    expect(daysSince(last.toISOString(), now)).toBe(36)
  })

  it('0 el mismo día y null sin fecha', () => {
    const now = new Date(2026, 9, 20, 9, 0, 0)
    expect(daysSince(new Date(2026, 9, 20, 1, 0, 0).toISOString(), now)).toBe(0)
    expect(daysSince(null, now)).toBeNull()
  })
})
