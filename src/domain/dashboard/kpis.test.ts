import { describe, expect, it } from 'vitest'
import type { DashboardKPIs } from '@/types/bi'
import { buildKpiGroups } from './kpis'

const KPIS: DashboardKPIs = {
  sales_kpis: {
    average_ticket: 68970,
    sales_per_day: 1.2,
    conversion_rate: 0,
    repeat_customer_rate: 12.5,
  },
  inventory_kpis: {
    turnover_rate: 0.0137,
    days_of_inventory: 2192.78,
    stockout_rate: 4.2,
  },
  financial_kpis: {
    gross_margin: 43.26,
    net_margin: 42.68,
    operating_expense_ratio: 0.58,
  },
  customer_kpis: {
    new_customers: 0,
    active_customers: 3,
    total_customers: 40,
    average_purchase_frequency: 1.5,
  },
  budget_kpis: {
    budget_to_sale_conversion: 25,
    average_budget_value: 150000,
    expired_budgets: 2,
  },
}

describe('buildKpiGroups', () => {
  it('devuelve los 5 grupos en orden', () => {
    expect(buildKpiGroups(KPIS).map((group) => group.key)).toEqual([
      'sales',
      'inventory',
      'financial',
      'customer',
      'budget',
    ])
  })

  it('asigna la unidad correcta a cada KPI (sin inventar fórmulas)', () => {
    const groups = buildKpiGroups(KPIS)
    const byId = new Map(
      groups.flatMap((group) => group.items.map((item) => [item.id, item] as const)),
    )

    expect(byId.get('average_ticket')).toEqual({ id: 'average_ticket', value: 68970, kind: 'money' })
    expect(byId.get('conversion_rate')?.kind).toBe('percent')
    expect(byId.get('turnover_rate')?.kind).toBe('ratio')
    expect(byId.get('days_of_inventory')?.kind).toBe('days')
    expect(byId.get('total_customers')?.kind).toBe('count')
    expect(byId.get('average_budget_value')?.kind).toBe('money')
  })

  it('conserva los ceros reales del backend', () => {
    const sales = buildKpiGroups(KPIS)[0]
    expect(sales?.items.find((item) => item.id === 'conversion_rate')?.value).toBe(0)
  })

  it('devuelve [] sin payload', () => {
    expect(buildKpiGroups(null)).toEqual([])
    expect(buildKpiGroups(undefined)).toEqual([])
  })

  it('tolera grupos ausentes en runtime sin lanzar', () => {
    const partial = { sales_kpis: KPIS.sales_kpis } as unknown as DashboardKPIs
    const groups = buildKpiGroups(partial)
    const inventory = groups.find((group) => group.key === 'inventory')
    expect(inventory?.items.every((item) => item.value === 0)).toBe(true)
  })
})
