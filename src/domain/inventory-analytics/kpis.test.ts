import { describe, expect, it } from 'vitest'
import { buildInventoryDashboardKpis, buildTurnoverKpis } from './kpis'
import type { InventoryAnalyticsDashboard, InventoryOverview, TurnoverMetrics } from '@/types/bi'

const dashboard = (overrides: Partial<InventoryAnalyticsDashboard['kpis']> = {}) =>
  ({
    generated_at: '2026-10-20T12:00:00Z',
    kpis: {
      total_value: 37532095,
      value_change_pct: 0,
      turnover_rate: 0.06,
      turnover_change_pct: 0,
      days_of_inventory: 500,
      stockout_rate: 4.1,
      fill_rate: 95.9,
      dead_stock_pct: 31.31,
      ...overrides,
    },
    stock_status: {
      in_stock: 16,
      low_stock: 4,
      out_of_stock: 1,
      overstock: 12,
      in_stock_pct: 64.8,
      low_stock_pct: 16.2,
      out_of_stock_pct: 4.1,
      overstock_pct: 48.6,
    },
    top_movers: [],
    slow_movers: [],
    reorder_alerts: [],
    dead_stock_value: 2149350,
    trends: [],
    abc_summary: {
      total_products: 21,
      total_value: 0,
      class_a_count: 0,
      class_a_value: 0,
      class_a_value_pct: 0,
      class_b_count: 0,
      class_b_value: 0,
      class_b_value_pct: 0,
      class_c_count: 0,
      class_c_value: 0,
      class_c_value_pct: 0,
    },
    alerts: [],
  }) as InventoryAnalyticsDashboard

const overview = {
  generated_at: '2026-10-20T12:00:00Z',
  total_products: 21,
  total_units: 40,
  total_value: 37532095,
  total_cost: 22881350,
  potential_profit: 14650745,
  stock_status: dashboard().stock_status,
  valuation: {
    total_cost_value: 22881350,
    total_retail_value: 37532095,
    potential_margin: 14650745,
    potential_margin_pct: 39,
    average_cost: 1089588,
    average_retail: 1787242,
  },
  turnover: {
    turnover_rate: 0.06,
    days_of_inventory: 500,
    stockout_rate: 4.1,
    fill_rate: 95.9,
  },
  alerts: [],
} as InventoryOverview

describe('inventory kpis', () => {
  it('dashboard: 6 filas, sin chips de variación (los pct del BE son 0)', () => {
    const rows = buildInventoryDashboardKpis(dashboard(), overview)
    expect(rows.map((row) => row.id)).toEqual([
      'totalValue',
      'potentialProfit',
      'turnoverRate',
      'daysOfInventory',
      'stockoutRate',
      'deadStockPct',
    ])
    expect(rows[0]).toMatchObject({ kind: 'money', value: 37532095, secondaryMoney: 22881350 })
    expect(rows[1]).toMatchObject({ kind: 'money', value: 14650745 })
  })

  it('dashboard: sin overview no inventa ganancia potencial', () => {
    const rows = buildInventoryDashboardKpis(dashboard(), null)
    expect(rows.map((row) => row.id)).not.toContain('potentialProfit')
  })

  it('dashboard: days_of_inventory 0 se marca sin base', () => {
    const rows = buildInventoryDashboardKpis(dashboard({ days_of_inventory: 0 }), overview)
    expect(rows.find((row) => row.id === 'daysOfInventory')?.unavailable).toBe(true)
  })

  it('dashboard: sin payload devuelve []', () => {
    expect(buildInventoryDashboardKpis(null, overview)).toEqual([])
  })

  it('turnover: average_inventory se expone como inventario a costo', () => {
    const overall: TurnoverMetrics = {
      turnover_rate: 0.01,
      days_of_inventory: 2839,
      average_inventory: 22881350,
      cost_of_goods_sold: 241800,
      inventory_efficiency: 0,
    }
    expect(buildTurnoverKpis(overall).map((row) => row.id)).toEqual([
      'turnoverRate',
      'daysOfInventory',
      'inventoryCost',
      'cogs',
    ])
    expect(buildTurnoverKpis(overall)[2]).toMatchObject({ kind: 'money', value: 22881350 })
  })

  it('turnover: sin COGS los días no son un cero real', () => {
    const overall: TurnoverMetrics = {
      turnover_rate: 0,
      days_of_inventory: 0,
      average_inventory: 1000,
      cost_of_goods_sold: 0,
      inventory_efficiency: 0,
    }
    expect(buildTurnoverKpis(overall)[1].unavailable).toBe(true)
  })
})
