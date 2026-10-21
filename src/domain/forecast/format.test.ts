import { describe, expect, it } from 'vitest'
import {
  formatCount,
  formatDateTime,
  formatDecimal,
  formatForecastKpiValue,
  formatHistoryRange,
  formatMoney,
  formatMonthYear,
  formatPercent,
  formatSignedMoney,
  formatSignedPercent,
  formatUtcDate,
  isMissingDate,
  toIntlLocale,
  toNumberOrNull,
} from './format'

describe('forecast/format', () => {
  it('distingue ausencia de cero', () => {
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull(undefined)).toBeNull()
    expect(toNumberOrNull('')).toBeNull()
    expect(toNumberOrNull('12.5')).toBe(12.5)
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(0)).toBe('Gs. 0')
    expect(formatCount(0)).toBe('0')
    expect(formatCount(1200)).toContain('1.200')
  })

  it('conserva centavos en montos proyectados menores a 1', () => {
    expect(formatMoney(0.38)).toContain('0,38')
    expect(formatSignedMoney(-500)).toMatch(/^-Gs\./)
  })

  it('no muestra 0 % cuando el valor real es > 0', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(0.0156)).toBe('<0,1%')
    expect(formatPercent(35.9539)).toBe('36%')
    expect(formatPercent(null)).toBe('—')
  })

  it('firma las variaciones', () => {
    expect(formatSignedPercent(58.79)).toBe('+58,8%')
    expect(formatSignedPercent(-66.67)).toBe('-66,7%')
    expect(formatSignedPercent(0)).toBe('0%')
    expect(formatSignedPercent(null)).toBe('—')
  })

  it('formatea buckets date-only en UTC y no corre el mes', () => {
    expect(formatMonthYear('2026-10-01T00:00:00Z', 'es')).toContain('2026')
    expect(formatMonthYear('2026-10-01T00:00:00Z', 'es').toLowerCase()).toContain('oct')
    expect(formatMonthYear('2026-10-01T00:00:00Z', 'en').toLowerCase()).toContain('oct')
    expect(formatUtcDate('2026-10-01T00:00:00Z', 'es')).toMatch(/^01 oct\.? 2026$/)
    expect(formatMonthYear('0001-01-01T00:00:00Z', 'es')).toBe('—')
  })

  it('trata el cero de Go como fecha ausente', () => {
    expect(isMissingDate('0001-01-01T00:00:00Z')).toBe(true)
    expect(isMissingDate('2026-10-21T15:03:05-03:00')).toBe(false)
    expect(formatDateTime('0001-01-01T00:00:00Z', 'es')).toBe('—')
    expect(formatDateTime('2026-10-21T15:03:05-03:00', 'es')).toContain('2026')
  })

  it('muestra el rango de historial tal como lo devuelve el BE', () => {
    expect(
      formatHistoryRange(
        { start_date: '2025-10-21T00:00:00-03:00', end_date: '2026-10-21T00:00:00-03:00' },
        'es',
      ),
    ).toMatch(/^21 oct\.? 2025 – 21 oct\.? 2026$/)
    expect(formatHistoryRange(null, 'es')).toBe('—')
  })

  it('formatea KPIs según su tipo', () => {
    expect(formatForecastKpiValue({ id: 'a', kind: 'money', value: 1500000 })).toBe(
      'Gs. 1.500.000',
    )
    expect(formatForecastKpiValue({ id: 'b', kind: 'percentSigned', value: 12.34 })).toBe(
      '+12,3%',
    )
    expect(formatForecastKpiValue({ id: 'c', kind: 'decimal', value: 36.07 })).toBe('36,1')
    expect(formatForecastKpiValue({ id: 'd', kind: 'ratio', value: 0.07 })).toBe('0,07')
    expect(formatForecastKpiValue({ id: 'e', kind: 'text', value: null, text: 'Ene, Feb' })).toBe(
      'Ene, Feb',
    )
    expect(formatForecastKpiValue({ id: 'f', kind: 'text', value: null })).toBe('—')
    expect(formatForecastKpiValue({ id: 'g', kind: 'count', value: null })).toBe('—')
  })

  it('mapea el locale de la UI', () => {
    expect(toIntlLocale('es')).toBe('es-PY')
    expect(toIntlLocale('en')).toBe('en-US')
    expect(toIntlLocale('pt-BR')).toBe('pt-BR')
    expect(toIntlLocale()).toBeUndefined()
    expect(formatDecimal(6.857822432766058, 2)).toBe('6,86')
  })
})
