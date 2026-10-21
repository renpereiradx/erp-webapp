import { describe, expect, it } from 'vitest'
import { financialRange, formatFinancialRange } from './reportPeriod'

describe('finance/reportPeriod', () => {
  it('expone el rango del payload y muestra el fin inclusivo', () => {
    const period = {
      start_date: '2026-10-01T00:00:00-03:00',
      end_date: '2026-11-01T00:00:00-03:00',
    }
    expect(financialRange(period)).toEqual({
      start: '2026-10-01T00:00:00-03:00',
      end: '2026-11-01T00:00:00-03:00',
    })
    const label = formatFinancialRange(period, 'es')
    expect(label).toContain('01 oct 2026')
    expect(label).toContain('31 oct 2026')
  })

  it('un rango inválido o el cero de Go no inventa fechas', () => {
    expect(financialRange(null)).toBeNull()
    expect(
      financialRange({ start_date: '0001-01-01T00:00:00Z', end_date: '0001-01-01T00:00:00Z' }),
    ).toBeNull()
    expect(formatFinancialRange(null)).toBe('—')
  })
})
