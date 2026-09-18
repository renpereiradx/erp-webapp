import { describe, expect, it } from 'vitest'
import { calculateStats, getPriority, getRiskLevel, getRiskStyles } from './risk'

describe('getPriority', () => {
  it.each([
    [-5, 'Low'],
    [0, 'Low'],
    [30, 'Low'], // borde: 30 no es > 30
    [31, 'Medium'],
    [60, 'Medium'], // borde: 60 no es > 60
    [61, 'High'],
    [120, 'High'],
    [null, 'Low'],
    [undefined, 'Low'],
  ])('%s días → %s', (days, expected) => {
    expect(getPriority(days as number)).toBe(expected)
  })
})

describe('calculateStats', () => {
  it('devuelve ceros con lista vacía', () => {
    expect(calculateStats([])).toEqual({
      totalOverdue: 0,
      atRisk: 0,
      efficiency: 0,
      totalAccounts: 0,
    })
  })

  it('suma montos, cuenta High y calcula eficiencia redondeada', () => {
    const accounts = [
      { amount: 100, priority: 'High', originalAmount: 100, paidAmount: 50 },
      { amount: 200, priority: 'Medium', originalAmount: 300, paidAmount: 150 },
      { amount: 50, priority: 'High', originalAmount: 0, paidAmount: 0 },
    ]
    expect(calculateStats(accounts)).toEqual({
      totalOverdue: 350,
      atRisk: 2,
      efficiency: Math.round((200 / 400) * 100), // 50
      totalAccounts: 3,
    })
  })

  it('eficiencia 0 cuando no hay montos originales (evita división por cero)', () => {
    expect(calculateStats([{ amount: 10, priority: 'Low', originalAmount: 0, paidAmount: 0 }]).efficiency).toBe(0)
  })
})

describe('getRiskStyles', () => {
  it.each([
    ['low', 'Riesgo Bajo'],
    ['bajo', 'Riesgo Bajo'],
    ['high', 'Riesgo Alto'],
    ['alto', 'Riesgo Alto'],
    ['medium', 'Riesgo Medio'],
    ['unknown', 'Riesgo Medio'],
    [null, 'Riesgo Medio'],
    [undefined, 'Riesgo Medio'],
  ])('nivel %s → %s', (lvl, label) => {
    expect(getRiskStyles(lvl).label).toBe(label)
  })

  it('cada nivel tiene sus 4 claves de estilo', () => {
    for (const lvl of ['low', 'high', 'medium']) {
      expect(Object.keys(getRiskStyles(lvl)).sort()).toEqual(['bg', 'color', 'dot', 'label'])
    }
  })
})

describe('getRiskLevel', () => {
  it.each([
    [{ days_30_60: 0, days_60_90: 0, over_90_days: 100, total: 500 }, 'Crítico'], // +90 aunque sea poco %
    [{ days_30_60: 200, days_60_90: 0, over_90_days: 0, total: 500 }, 'Moderado'], // 40% vencido
    [{ days_30_60: 100, days_60_90: 0, over_90_days: 0, total: 500 }, 'Mínimo'], // 20% vencido
    [{ days_30_60: 150, days_60_90: 0, over_90_days: 0, total: 500 }, 'Mínimo'], // borde: 30% no es > 30
    [{ days_30_60: 151, days_60_90: 0, over_90_days: 0, total: 500 }, 'Moderado'], // 30.2%
    [{ days_30_60: 0, days_60_90: 0, over_90_days: 0, total: 0 }, 'Mínimo'], // total 0 → NaN% → Mínimo
  ])('%j → %s', (client, expected) => {
    expect(getRiskLevel(client)).toBe(expected)
  })
})
