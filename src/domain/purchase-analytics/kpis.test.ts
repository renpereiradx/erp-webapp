import { describe, expect, it } from 'vitest'
import { buildPurchaseKpiHints, buildPurchaseKpiRows } from './kpis'
import type { PurchasePerformance } from '@/types/bi'

const performance = (overrides: Partial<PurchasePerformance> = {}): PurchasePerformance => ({
  period: { start_date: '2026-10-01', end_date: '2026-11-01' },
  total_purchases: 275000,
  total_transactions: 2,
  average_order: 137500,
  total_units: 40,
  unique_suppliers: 1,
  pending_orders: 1,
  pending_amount: 50000,
  excluded_other_currency: 2,
  ...overrides,
})

describe('buildPurchaseKpiRows', () => {
  it('deriva las 5 métricas en orden fijo sin comparación', () => {
    const rows = buildPurchaseKpiRows(performance())
    expect(rows.map((row) => row.id)).toEqual([
      'purchases',
      'orders',
      'avgOrder',
      'units',
      'suppliers',
    ])
    expect(rows.map((row) => row.value)).toEqual([275000, 2, 137500, 40, 1])
    // Unidades y proveedores no traen comparación del BE: sin chip inventado.
    expect(rows[3].trend).toBeNull()
    expect(rows[4].trend).toBeNull()
  })

  it('usa el crecimiento real de comparison cuando viene', () => {
    const rows = buildPurchaseKpiRows(
      performance({
        comparison: {
          previous_period: { start_date: '2026-09-01', end_date: '2026-10-01' },
          purchases_change: 75000,
          purchases_change_pct: 37.5,
          transactions_change: 1,
          transactions_change_pct: 100,
          order_change: -12500,
          order_change_pct: -8.33,
        },
      }),
    )
    expect(rows[0].trend).toEqual({ direction: 'up', percentage: 37.5, change: 75000 })
    expect(rows[1].trend?.direction).toBe('up')
    expect(rows[2].trend?.direction).toBe('down')
  })

  it('sin base previa (pct 0 con cambio ≠ 0) no muestra chip', () => {
    const rows = buildPurchaseKpiRows(
      performance({
        comparison: {
          previous_period: { start_date: '2026-09-01', end_date: '2026-10-01' },
          purchases_change: 100000,
          purchases_change_pct: 0,
          transactions_change: 0,
          transactions_change_pct: 0,
          order_change: 0,
          order_change_pct: 0,
        },
      }),
    )
    expect(rows[0].trend).toBeNull()
  })

  it('payload nulo → lista vacía', () => {
    expect(buildPurchaseKpiRows(null)).toEqual([])
  })
})

describe('buildPurchaseKpiHints', () => {
  it('expone pendientes y excluidos por moneda por separado', () => {
    expect(buildPurchaseKpiHints(performance())).toEqual({
      pendingOrders: 1,
      pendingAmount: 50000,
      excludedOtherCurrency: 2,
    })
  })
})
