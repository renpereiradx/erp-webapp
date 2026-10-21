import { describe, expect, it } from 'vitest'
import {
  formatCount,
  formatDate,
  formatMoney,
  formatPercent,
  formatRatio,
  formatSignedMoney,
  formatUtcMonth,
  isMissingDate,
  toLocalDateInput,
  toNumberOrNull,
} from './format'

describe('finance/format', () => {
  it('distingue ausencia de cero', () => {
    expect(toNumberOrNull(null)).toBeNull()
    expect(toNumberOrNull('')).toBeNull()
    expect(toNumberOrNull('12.5')).toBe(12.5)
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(0)).toBe('Gs. 0')
    expect(formatMoney(0.38)).toContain('0,38')
    expect(formatSignedMoney(-500)).toMatch(/^-Gs\./)
    expect(formatCount(1200)).toContain('1.200')
    expect(formatRatio(4.5104)).toBe('4,51×')
  })

  it('no muestra 0 % cuando el valor real es >0', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(0.0156)).toBe('<0,1%')
    expect(formatPercent(0.004, 2)).toBe('<0,01%')
    expect(formatPercent(35.9539)).toBe('36%')
  })

  it('trata el cero de Go como fecha ausente', () => {
    expect(isMissingDate('0001-01-01T00:00:00Z')).toBe(true)
    expect(formatDate('0001-01-01T00:00:00Z')).toBe('—')
    expect(formatUtcMonth('2026-10-01T00:00:00Z', 'es')).toContain('2026')
    expect(toLocalDateInput('2026-10-20T15:00:00-03:00')).toBe('2026-10-20')
    expect(toLocalDateInput('0001-01-01T00:00:00Z')).toBe('')
  })
})
