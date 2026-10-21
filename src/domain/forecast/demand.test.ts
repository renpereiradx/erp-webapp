import { describe, expect, it } from 'vitest'
import type { DemandForecast } from '@/types/bi'
import {
  demandCategoryRows,
  demandCommonConfidence,
  demandKpis,
  demandPagination,
  demandTopGrowthCategory,
  demandTopProduct,
  demandUnitTotals,
} from './demand'

const demandForecast = (overrides: Partial<DemandForecast> = {}): DemandForecast => ({
  generated_at: '2026-10-21T15:03:05-03:00',
  forecast_period: {
    start_date: '2026-10-21T00:00:00-03:00',
    end_date: '2027-01-21T00:00:00-03:00',
  },
  categories: [
    {
      category_id: 'C1',
      category_name: 'Moda',
      historical_units: 31,
      forecast_units: 54,
      growth_rate: 250,
      trend: 'INCREASING',
      confidence: 75,
    },
    {
      category_id: 'C2',
      category_name: 'Alquiler',
      historical_units: 18,
      forecast_units: 3,
      growth_rate: -66.67,
      trend: 'DECREASING',
      confidence: 75,
    },
  ],
  top_products: [
    {
      product_id: 'P1',
      product_name: 'Camiseta Adidas',
      category_name: 'Moda',
      historical_units: 87,
      forecast_units: 90,
      growth_rate: 12.5,
      trend: 'INCREASING',
      confidence: 70,
    },
    {
      product_id: 'P2',
      product_name: 'Pantalón',
      category_name: 'Moda',
      historical_units: 40,
      forecast_units: 30,
      growth_rate: -10,
      trend: 'DECREASING',
      confidence: 70,
    },
  ],
  trends: null,
  pagination: { page: 1, page_size: 10, total_items: 2, total_pages: 1 },
  ...overrides,
})

describe('forecast/demand', () => {
  it('suma unidades sobre el set completo de categorías', () => {
    expect(demandUnitTotals(demandForecast())).toEqual({ historical: 49, forecast: 57 })
    expect(demandCategoryRows(demandForecast())).toHaveLength(2)
  })

  it('elige la categoría de mayor crecimiento y el producto más proyectado de la página', () => {
    expect(demandTopGrowthCategory(demandForecast())?.category_name).toBe('Moda')
    expect(demandTopProduct(demandForecast())?.product_name).toBe('Camiseta Adidas')
    expect(demandTopGrowthCategory(demandForecast({ categories: null }))).toBeNull()
    expect(demandTopProduct(demandForecast({ top_products: null }))).toBeNull()
  })

  it('expone la confianza única del modelo y no inventa una por fila', () => {
    expect(demandCommonConfidence(demandForecast().categories)).toBe(75)
    const mixed = demandForecast().categories?.map((row, index) => ({
      ...row,
      confidence: index === 0 ? 60 : 75,
    }))
    expect(demandCommonConfidence(mixed)).toBeNull()
    expect(demandCommonConfidence(null)).toBeNull()
  })

  it('arma los KPIs del ledger con las cifras del payload', () => {
    const kpis = Object.fromEntries(demandKpis(demandForecast()).map((row) => [row.id, row]))
    expect(kpis.categories.value).toBe(2)
    expect(kpis.historicalUnits.value).toBe(49)
    expect(kpis.forecastUnits.value).toBe(57)
    expect(kpis.topCategoryGrowth.value).toBe(250)
    expect(kpis.topProductUnits.value).toBe(90)
    expect(kpis.confidence.value).toBe(75)
  })

  it('pagina con defaults seguros', () => {
    expect(demandPagination(demandForecast())).toEqual({
      page: 1,
      totalPages: 1,
      totalItems: 2,
    })
    expect(demandPagination(demandForecast({ pagination: null }))).toEqual({
      page: 1,
      totalPages: 1,
      totalItems: 0,
    })
  })
})
