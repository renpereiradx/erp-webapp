import { describe, expect, it } from 'vitest'
import {
  RISK_LEVEL_TONE,
  hasPaymentHistory,
  overdueRatioPercent,
  paymentBehaviorKey,
  riskLevelKey,
  riskSignals,
} from './risk'
import type { ClientRisk } from '@/types/bi'

const RISK = (overrides: Partial<ClientRisk> = {}): ClientRisk => ({
  client_id: 'CL-1',
  risk_level: 'HIGH',
  payment_behavior: 'EXCELLENT',
  total_pending_orders: 1,
  total_pending_amount: 314600,
  total_overdue_amount: 314600,
  total_over_90_amount: 314600,
  overdue_ratio: 1,
  max_days_overdue: 141,
  avg_days_outstanding: 141,
  avg_days_to_pay: 0,
  total_payments: 7,
  collection_rate: 286.9,
  analyzed_at: '2026-10-20T20:52:34-03:00',
  ...overrides,
})

describe('receivables/risk (F7)', () => {
  it('normaliza el nivel de riesgo y no renderiza desconocidos', () => {
    expect(riskLevelKey('HIGH')).toBe('high')
    expect(riskLevelKey('medium')).toBe('medium')
    expect(riskLevelKey('LOW')).toBe('low')
    expect(riskLevelKey('CRITICAL')).toBeNull()
    expect(riskLevelKey(null)).toBeNull()
    expect(RISK_LEVEL_TONE.high).toBe('error')
  })

  it('normaliza el comportamiento de pago', () => {
    expect(paymentBehaviorKey('EXCELLENT')).toBe('excellent')
    expect(paymentBehaviorKey('GOOD')).toBe('good')
    expect(paymentBehaviorKey('REGULAR')).toBe('regular')
    expect(paymentBehaviorKey('POOR')).toBe('poor')
    expect(paymentBehaviorKey('')).toBeNull()
  })

  it('oculta el comportamiento cuando no hay pagos registrados', () => {
    expect(hasPaymentHistory(RISK())).toBe(true)
    expect(hasPaymentHistory(RISK({ total_payments: 0 }))).toBe(false)
    expect(hasPaymentHistory(null)).toBe(false)
  })

  it('convierte el ratio 0-1 a porcentaje sin clampear', () => {
    expect(overdueRatioPercent(1)).toBe(100)
    expect(overdueRatioPercent(0.25)).toBe(25)
    expect(overdueRatioPercent(null)).toBeNull()
    // El BE puede devolver >1 si los datos lo producen: se muestra el dato.
    expect(overdueRatioPercent(1.2)).toBeCloseTo(120)
  })

  it('deriva las señales que explican el nivel con las reglas del BE', () => {
    expect(riskSignals(RISK())).toEqual({
      over90Debt: true,
      ratioOver50: true,
      ratioOver30: true,
      maxAgeOver60: true,
    })
    expect(
      riskSignals(
        RISK({
          total_over_90_amount: 0,
          overdue_ratio: 0.2,
          max_days_overdue: 30,
        }),
      ),
    ).toEqual({
      over90Debt: false,
      ratioOver50: false,
      ratioOver30: false,
      maxAgeOver60: false,
    })
    expect(riskSignals(null)).toEqual({
      over90Debt: false,
      ratioOver50: false,
      ratioOver30: false,
      maxAgeOver60: false,
    })
  })
})
