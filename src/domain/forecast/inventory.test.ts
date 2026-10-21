import { describe, expect, it } from 'vitest'
import type { InventoryForecast } from '@/types/bi'
import {
  inventoryAlertCounts,
  inventoryAlertViews,
  inventoryHasVelocity,
  inventoryKpis,
  inventoryPagination,
  inventoryRiskRows,
  inventoryStockoutDays,
} from './inventory'

const inventoryForecast = (overrides: Partial<InventoryForecast> = {}): InventoryForecast => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: {
    start_date: '2026-10-21T00:00:00-03:00',
    end_date: '2026-11-20T00:00:00-03:00',
  },
  products: [
    {
      product_id: 'P1',
      product_name: 'Lavado de auto',
      current_stock: 0,
      average_daily_sales: 2,
      projected_demand: 60,
      days_until_stockout: 0,
      reorder_point: 14,
      suggested_reorder: 88,
      safety_stock: 28,
      stockout_risk: 'HIGH',
      reorder_date: '2026-10-21T00:00:00Z',
      trend: 'INCREASING',
    },
    {
      product_id: 'P2',
      product_name: 'Sin ventas',
      current_stock: 10,
      average_daily_sales: 0,
      projected_demand: 0,
      days_until_stockout: 999,
      reorder_point: 0,
      suggested_reorder: 0,
      safety_stock: 0,
      stockout_risk: 'NONE',
      trend: 'STABLE',
    },
  ],
  summary: {
    total_products: 2,
    high_risk_products: 1,
    medium_risk_products: 0,
    low_risk_products: 0,
    total_projected_demand: 60,
    total_current_stock: 10,
    overall_coverage: 36.07,
  },
  alerts: [
    {
      type: 'STOCKOUT_IMMINENT',
      severity: 'HIGH',
      product_id: 'P1',
      product_name: 'Lavado de auto',
      message: 'Stock se agotara en 0 dias',
      days_to_act: 0,
    },
    {
      type: 'LOW_STOCK',
      severity: 'MEDIUM',
      product_id: 'P3',
      product_name: 'Shampoo',
      message: 'Stock bajo: 5 dias de cobertura',
      days_to_act: 2,
    },
  ],
  pagination: { page: 1, page_size: 10, total_items: 18, total_pages: 2 },
  ...overrides,
})

describe('forecast/inventory', () => {
  it('expone los KPIs del summary completo del BE', () => {
    const kpis = Object.fromEntries(
      inventoryKpis(inventoryForecast()).map((row) => [row.id, row]),
    )
    expect(kpis.coverage.value).toBe(36.07)
    expect(kpis.currentStock.value).toBe(10)
    expect(kpis.projectedDemand.value).toBe(60)
    expect(kpis.highRisk.value).toBe(1)
    expect(kpis.mediumRisk.value).toBe(0)
    expect(kpis.totalProducts.value).toBe(2)
  })

  it('trata 999 como centinela de "sin ventas", no como días reales', () => {
    const [active, idle] = inventoryForecast().products ?? []
    expect(inventoryStockoutDays(active)).toBe(0)
    expect(inventoryStockoutDays(idle)).toBeNull()
    expect(inventoryHasVelocity(active)).toBe(true)
    expect(inventoryHasVelocity(idle)).toBe(false)
  })

  it('traduce alertas sin usar el message español', () => {
    const views = inventoryAlertViews(inventoryForecast())
    expect(views).toHaveLength(2)
    expect(views[0]).toMatchObject({
      productName: 'Lavado de auto',
      type: 'STOCKOUT_IMMINENT',
      severity: 'HIGH',
      daysToAct: 0,
    })
    expect(views[0]).not.toHaveProperty('message')
    expect(inventoryAlertCounts(inventoryForecast())).toEqual({ total: 2, high: 1, medium: 1 })
  })

  it('limita la lista de alertas sin ocultar el total', () => {
    const alerts = Array.from({ length: 9 }, (_, index) => ({
      type: 'LOW_STOCK',
      severity: 'MEDIUM',
      product_id: `P${index}`,
      product_name: `Producto ${index}`,
      message: '',
      days_to_act: index,
    }))
    const forecast = inventoryForecast({ alerts })
    expect(inventoryAlertViews(forecast, 3)).toHaveLength(3)
    expect(inventoryAlertCounts(forecast).total).toBe(9)
  })

  it('cuenta riesgos del summary y pagina con defaults seguros', () => {
    expect(inventoryRiskRows(inventoryForecast())).toEqual([
      { id: 'HIGH', value: 1 },
      { id: 'MEDIUM', value: 0 },
      { id: 'LOW', value: 0 },
      { id: 'NONE', value: 1 },
    ])
    expect(inventoryPagination(inventoryForecast())).toEqual({
      page: 1,
      totalPages: 2,
      totalItems: 18,
    })
    expect(inventoryPagination(inventoryForecast({ pagination: null }))).toEqual({
      page: 1,
      totalPages: 1,
      totalItems: 0,
    })
  })
})
