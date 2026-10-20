import { describe, expect, it } from 'vitest'
import { alertKey, alertTone, alertValueKind, alertViews } from './alerts'

const alert = (type: string, severity = 'HIGH', value = 10) => ({
  type,
  category: 'X',
  message: 'Mensaje en español del servidor',
  value,
  threshold: 15,
  severity,
})

describe('alertKey', () => {
  it.each([
    ['LOW_MARGIN', 'lowMargin'],
    ['DECLINING_PROFIT', 'decliningProfit'],
    ['UNPROFITABLE_PRODUCTS', 'unprofitableProducts'],
    ['PROFIT_GROWTH', 'profitGrowth'],
  ] as const)('%s → %s', (raw, key) => {
    expect(alertKey(raw)).toBe(key)
  })

  it('desconocido → null (no se renderiza el mensaje crudo)', () => {
    expect(alertKey('SOMETHING_ELSE')).toBeNull()
    expect(alertKey(null)).toBeNull()
    expect(alertKey('')).toBeNull()
  })
})

describe('alertTone / alertValueKind', () => {
  it('tonos por tipo y formato del valor', () => {
    expect(alertTone('lowMargin')).toBe('error')
    expect(alertTone('decliningProfit')).toBe('warning')
    expect(alertTone('unprofitableProducts')).toBe('warning')
    expect(alertTone('profitGrowth')).toBe('success')
    expect(alertValueKind('lowMargin')).toBe('percent')
    expect(alertValueKind('decliningProfit')).toBe('signedPercent')
    expect(alertValueKind('profitGrowth')).toBe('signedPercent')
    expect(alertValueKind('unprofitableProducts')).toBe('count')
  })
})

describe('alertViews', () => {
  it('descarta tipos desconocidos y ordena por severidad', () => {
    const views = alertViews([
      alert('PROFIT_GROWTH', 'LOW'),
      alert('UNKNOWN_TYPE', 'CRITICAL'),
      alert('LOW_MARGIN', 'MEDIUM'),
    ])
    expect(views.map((view) => view.key)).toEqual(['lowMargin', 'profitGrowth'])
  })

  it('expone value/threshold numéricos y no usa el message del BE', () => {
    const [view] = alertViews([alert('LOW_MARGIN', 'HIGH', 12.5)])
    expect(view.value).toBe(12.5)
    expect(view.threshold).toBe(15)
    expect('message' in view).toBe(false)
  })

  it('null → []', () => {
    expect(alertViews(null)).toEqual([])
    expect(alertViews(undefined)).toEqual([])
  })
})
