import { describe, expect, it } from 'vitest'
import {
  cashFlowDays,
  cashFlowMovementDays,
  cashFlowTotals,
  coverageRatio,
  coverageStatus,
} from './cashFlow'
import type { CashFlowProjection } from '@/types/bi'

const projection: CashFlowProjection = {
  period: '30 days',
  expected_inflows: 616380,
  expected_outflows: 1000,
  net_cash_flow: 615380,
  cumulative_flow: 615380,
  projection_days: [
    {
      date: '2026-10-21',
      inflows: 0,
      outflows: 1000,
      net_flow: -1000,
      cumulative_flow: -1000,
    },
    {
      date: '2026-10-20',
      inflows: 0,
      outflows: 0,
      net_flow: 0,
      cumulative_flow: 0,
    },
    {
      date: '2026-10-22',
      inflows: 616380,
      outflows: 0,
      net_flow: 616380,
      cumulative_flow: 615380,
    },
  ],
}

describe('payables/cashFlow', () => {
  it('ordena la serie por fecha y conserva los días en cero', () => {
    expect(cashFlowDays(projection).map((day) => day.date)).toEqual([
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
    ])
    expect(cashFlowDays(null)).toEqual([])
  })

  it('la tabla solo muestra días con movimiento', () => {
    expect(cashFlowMovementDays(projection).map((day) => day.date)).toEqual([
      '2026-10-21',
      '2026-10-22',
    ])
  })

  it('deriva la cobertura y devuelve null sin pagos esperados', () => {
    expect(coverageRatio(projection)).toBeCloseTo(61638)
    expect(
      coverageRatio({ ...projection, expected_outflows: 0 }),
    ).toBeNull()
    expect(coverageRatio(null)).toBeNull()
  })

  it('aplica los umbrales del BE (80/100)', () => {
    expect(coverageStatus(79.9)).toBe('critical')
    expect(coverageStatus(80)).toBe('warning')
    expect(coverageStatus(99.9)).toBe('warning')
    expect(coverageStatus(100)).toBe('healthy')
    expect(coverageStatus(null)).toBeNull()
  })

  it('toma los totales del payload', () => {
    expect(cashFlowTotals(projection)).toEqual({
      inflows: 616380,
      outflows: 1000,
      net: 615380,
      cumulative: 615380,
    })
    expect(cashFlowTotals(null)).toEqual({ inflows: 0, outflows: 0, net: 0, cumulative: 0 })
  })
})
