import { describe, expect, it } from 'vitest'
import {
  buildCashFlowView,
  clampNumber,
  formatSignedPYG,
  getBalancePosition,
  toDateLabel,
  toNumber,
} from './cashFlow'

describe('toNumber', () => {
  it.each([
    ['5', 5],
    [5.7, 5.7],
    ['abc', 0],
    [null, 0],
    [undefined, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])('%s → %s', (value, expected) => {
    expect(toNumber(value)).toBe(expected)
  })
})

describe('clampNumber', () => {
  it('satura en los límites', () => {
    expect(clampNumber(5, 2, 100)).toBe(5)
    expect(clampNumber(1, 2, 100)).toBe(2)
    expect(clampNumber(150, 2, 100)).toBe(100)
  })
})

describe('toDateLabel', () => {
  it('formatea es-PY dd mmm', () => {
    expect(toDateLabel('2026-09-18')).toContain('sep')
  })

  it('devuelve el valor crudo con fecha inválida y - con null', () => {
    expect(toDateLabel('not-a-date')).toBe('not-a-date')
    expect(toDateLabel(null)).toBe('-')
    expect(toDateLabel('')).toBe('-')
  })
})

describe('formatSignedPYG', () => {
  it('prefija + solo a positivos', () => {
    expect(formatSignedPYG(1000)).toBe('+Gs. 1.000')
    expect(formatSignedPYG(0)).toBe('Gs. 0')
    expect(formatSignedPYG(-500)).toBe('Gs. -500')
  })
})

describe('buildCashFlowView', () => {
  it('vista en ceros con payload vacío', () => {
    const view = buildCashFlowView(null)
    expect(view).toMatchObject({
      beginningCash: 0,
      endingCash: 0,
      netCashChange: 0,
      totalInflows: 0,
      totalOutflows: 0,
      operatingNet: 0,
      investingNet: 0,
      financingNet: 0,
      dailyData: [],
      maxBarValue: 1,
    })
    expect(view.minBalance).toBe(0)
    expect(view.maxBalance).toBe(0)
    expect(view.operatingRows).toHaveLength(5)
    expect(view.investingRows[0].concept).toBe('Compra de equipos')
  })

  const SOURCE = {
    beginning_cash: 1000,
    operating_activities: {
      cash_from_sales: 500,
      cash_from_receivables: '300',
      cash_paid_to_suppliers: 200,
      cash_paid_for_expenses: 100,
      cash_paid_for_salaries: 50,
      net_operating_cash_flow: 0, // fuerza el cómputo por actividades
    },
    investing_activities: { equipment_purchases: 400 },
    financing_activities: { loan_payments: 150 },
    daily_breakdown: Array.from({ length: 9 }, (_, i) => ({
      date: `2026-09-${10 + i}`,
      inflows: 100 + i,
      outflows: 50,
      net_flow: 50 + i,
      balance: 2000 + i,
    })),
  }

  it('normaliza el desglose diario a las últimas 7 entradas', () => {
    const view = buildCashFlowView(SOURCE)
    expect(view.dailyData).toHaveLength(7)
    expect(view.dailyData[0].date).toContain('sep') // 2026-09-11 recortado desde el 10
    expect(view.dailyData[6].inflows).toBe(108)
  })

  it('resuelve totales desde el diario cuando existe y cae a actividades si no', () => {
    const view = buildCashFlowView(SOURCE)
    const dailyInflows = view.dailyData.reduce((s, r) => s + r.inflows, 0)
    expect(view.totalInflows).toBe(dailyInflows)

    const withoutDaily = buildCashFlowView({ ...SOURCE, daily_breakdown: [] })
    expect(withoutDaily.totalInflows).toBe(800) // 500 + 300
    expect(withoutDaily.totalOutflows).toBe(900) // 200+100+50+400+150
  })

  it('net/ending caen a derivados cuando el BE no los reporta', () => {
    const view = buildCashFlowView({ ...SOURCE, daily_breakdown: [] })
    expect(view.netCashChange).toBe(800 - 900) // -100
    expect(view.endingCash).toBe(1000 + (800 - 900)) // 900
  })

  it('nets por categoría: reportado si viene, si no computado con signo', () => {
    const view = buildCashFlowView({ ...SOURCE, daily_breakdown: [] })
    expect(view.operatingNet).toBe(800 - 350) // computado (campo reportado en 0)
    expect(view.investingNet).toBe(-400) // -Math.abs
    expect(view.financingNet).toBe(-150)

    const reported = buildCashFlowView({
      operating_activities: { net_operating_cash_flow: 999 },
      investing_activities: { equipment_purchases: 10, net_investing_cash_flow: -10 },
      financing_activities: { loan_payments: 5, net_financing_cash_flow: -5 },
    })
    expect(reported.operatingNet).toBe(999)
    expect(reported.investingNet).toBe(-10)
    expect(reported.financingNet).toBe(-5)
  })

  it('min/max de balance y maxBarValue (con piso 1)', () => {
    const view = buildCashFlowView(SOURCE)
    expect(view.minBalance).toBe(2006) // primeras 2 filas recortadas (2000, 2001 fuera)
    expect(view.maxBalance).toBe(2012)
    expect(view.maxBarValue).toBe(108)
    expect(buildCashFlowView(null).maxBarValue).toBe(1)
  })
})

describe('getBalancePosition', () => {
  it('50 con rango plano', () => {
    expect(getBalancePosition(7, 7, 7)).toBe(50)
  })

  it('clamp 5-95 dentro del rango', () => {
    expect(getBalancePosition(2006, 2006, 2012)).toBe(5)
    expect(getBalancePosition(2012, 2006, 2012)).toBe(95)
    expect(getBalancePosition(2009, 2006, 2012)).toBe(50)
    expect(getBalancePosition(0, 2006, 2012)).toBe(5)
  })
})
