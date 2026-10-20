import { describe, expect, it } from 'vitest'
import {
  buildCategoryKpis,
  buildCustomerKpis,
  buildDashboardKpis,
  buildProductKpis,
  buildSellerKpis,
  buildTrendKpis,
  formatKpiValue,
} from './kpis'

describe('buildDashboardKpis', () => {
  it('mapea los 8 KPIs del dashboard y formatea con los helpers', () => {
    const rows = buildDashboardKpis({
      total_revenue: 1475500,
      total_profit: 530500,
      gross_margin_pct: 35.95391392748221,
      net_margin_pct: 35.95391392748221,
      roi: 56.13756613756614,
      profit_per_transaction: 88416.66666666667,
      revenue_growth: 60.35516141477702,
      profit_growth: -2.1917044261468384,
      margin_change: -2.1917044261468384,
    })
    expect(rows.map((row) => row.id)).toEqual([
      'revenue',
      'profit',
      'grossMargin',
      'roi',
      'profitPerTransaction',
      'revenueGrowth',
      'profitGrowth',
      'marginChange',
    ])
    expect(formatKpiValue(rows[0])).toBe('Gs. 1.475.500')
    expect(formatKpiValue(rows[2])).toBe('36%')
    expect(formatKpiValue(rows[4])).toBe('Gs. 88.417')
    expect(formatKpiValue(rows[5])).toBe('+60,4%')
    expect(formatKpiValue(rows[6])).toBe('-2,2%')
  })

  it('sin payload devuelve — en todas las filas', () => {
    const rows = buildDashboardKpis(null)
    expect(rows).toHaveLength(8)
    for (const row of rows) expect(formatKpiValue(row)).toBe('—')
  })
})

describe('buildProductKpis', () => {
  it('deriva el margen global de profit/revenue y respeta el promedio simple', () => {
    const rows = buildProductKpis({
      total_products: 6,
      profitable_products: 6,
      unprofitable_products: 0,
      average_margin: 45.05494505494506,
      total_profit: 530500,
      total_revenue: 1475500,
    })
    const byId = Object.fromEntries(rows.map((row) => [row.id, formatKpiValue(row)]))
    expect(byId.totalProducts).toBe('6')
    expect(byId.globalMargin).toBe('36%')
    expect(byId.averageMargin).toBe('45,1%')
    expect(byId.totalProfit).toBe('Gs. 530.500')
  })

  it('margen global null sin ingresos (no inventa 0 %)', () => {
    const rows = buildProductKpis({
      total_products: 0,
      profitable_products: 0,
      unprofitable_products: 0,
      average_margin: 0,
      total_profit: 0,
      total_revenue: 0,
    })
    expect(formatKpiValue(rows.find((row) => row.id === 'globalMargin')!)).toBe('—')
  })
})

describe('buildCustomerKpis', () => {
  it('calcula el beneficio promedio por cliente', () => {
    const rows = buildCustomerKpis({
      total_customers: 2,
      active_customers: 2,
      profitable_customers: 2,
      average_customer_value: 265250,
      total_profit: 530500,
      top_customers_pct: 0,
    })
    const byId = Object.fromEntries(rows.map((row) => [row.id, formatKpiValue(row)]))
    expect(byId.totalCustomers).toBe('2')
    expect(byId.unprofitableCustomers).toBe('0')
    // average_customer_value del BE es beneficio promedio por cliente.
    expect(byId.averageCustomerValue).toBe('Gs. 265.250')
    // No se expone el Pareto (siempre 0 del BE) ni el activo (espeja el total).
    expect(rows.map((row) => row.id)).not.toContain('topCustomersPct')
    expect(rows.map((row) => row.id)).not.toContain('activeCustomers')
    expect(rows.map((row) => row.id)).not.toContain('averageProfitPerCustomer')
  })

  it('sin clientes el promedio es — (no "Gs. 0")', () => {
    const rows = buildCustomerKpis({
      total_customers: 0,
      active_customers: 0,
      profitable_customers: 0,
      average_customer_value: 0,
      total_profit: 0,
      top_customers_pct: 0,
    })
    expect(formatKpiValue(rows.find((row) => row.id === 'averageCustomerValue')!)).toBe('—')
  })
})

describe('buildCategoryKpis / buildSellerKpis / buildTrendKpis', () => {
  it('categorías: conteo, beneficio total y margen promedio', () => {
    const rows = buildCategoryKpis({
      total_categories: 4,
      most_profitable_id: '18',
      most_profitable_name: 'Electrónicos',
      least_profitable_id: '7',
      least_profitable_name: 'Bebidas',
      average_margin: 40.12681631165043,
      total_profit: 530500,
    })
    expect(rows.map((row) => formatKpiValue(row))).toEqual([
      '4',
      'Gs. 530.500',
      '40,1%',
    ])
  })

  it('vendedores: conteo, beneficio y promedio por vendedor', () => {
    const rows = buildSellerKpis({
      total_sellers: 1,
      total_profit: 530500,
      average_profit_per_seller: 530500,
      top_seller_id: 'jJkV4F6HR',
      top_seller_name: 'ADMINISTRADOR ADMINISTRADOR',
    })
    expect(rows.map((row) => formatKpiValue(row))).toEqual([
      '1',
      'Gs. 530.500',
      'Gs. 530.500',
    ])
  })

  it('tendencias: suma real de la serie y unidades', () => {
    const rows = buildTrendKpis([
      { date: '2026-10-01T00:00:00Z', label: '01 Oct', revenue: 1254100, cost: 907000, gross_profit: 347100, gross_margin_pct: 27.7, net_profit: 347100, net_margin_pct: 27.7, transactions: 1, units_sold: 3 },
      { date: '2026-10-05T00:00:00Z', label: '05 Oct', revenue: 26000, cost: 10000, gross_profit: 16000, gross_margin_pct: 61.5, net_profit: 16000, net_margin_pct: 61.5, transactions: 1, units_sold: 0 },
    ])
    expect(rows.map((row) => formatKpiValue(row))).toEqual([
      '2',
      'Gs. 1.280.100',
      'Gs. 363.100',
      '3',
    ])
  })
})
