import { describe, expect, it } from 'vitest'
import {
  buildReorderSummary,
  realDaysUntilStockout,
  reorderPriorityKey,
  reorderPriorityTone,
  reorderRows,
} from './reorder'
import type { ReorderAnalysis, ReorderProduct, ReorderSummary } from '@/types/bi'

const row = (id: string, priority: ReorderProduct['priority']): ReorderProduct => ({
  product_id: id,
  product_name: `Producto ${id}`,
  sku: id,
  category_name: 'MODA',
  product_type: 'PHYSICAL',
  current_stock: 2,
  min_stock: 5,
  reorder_point: 5,
  reorder_quantity: 8,
  estimated_cost: 1000,
  days_until_stockout: 5,
  priority,
})

const ANALYSIS = {
  generated_at: '2026-10-20T12:00:00Z',
  summary: {
    total_needing_reorder: 3,
    urgent_count: 2,
    soon_count: 1,
    estimated_cost: 3000,
    average_lead_time_days: 0,
  },
  urgent_reorders: [row('U-1', 'URGENT'), row('U-2', 'HIGH')],
  soon_reorders: [row('S-1', 'MEDIUM')],
  by_supplier: null,
} as ReorderAnalysis

describe('inventory reorder', () => {
  it('mapea prioridades y tonos', () => {
    expect(reorderPriorityKey('URGENT')).toBe('urgent')
    expect(reorderPriorityKey('HIGH')).toBe('high')
    expect(reorderPriorityKey('MEDIUM')).toBe('medium')
    expect(reorderPriorityKey('LOW')).toBe('low')
    expect(reorderPriorityKey(undefined)).toBe('low')
    expect(reorderPriorityTone('URGENT')).toBe('error')
    expect(reorderPriorityTone('HIGH')).toBe('warning')
    expect(reorderPriorityTone('MEDIUM')).toBe('primary')
    expect(reorderPriorityTone('LOW')).toBe('secondary')
  })

  it('el centinela 999 es "sin ventas", no 999 días', () => {
    expect(realDaysUntilStockout(999)).toBeNull()
    expect(realDaysUntilStockout(0)).toBe(0)
    expect(realDaysUntilStockout(12)).toBe(12)
  })

  it('no presenta Gs. 0 cuando hay pendientes sin costo unitario', () => {
    const summary: ReorderSummary = {
      total_needing_reorder: 2,
      urgent_count: 1,
      soon_count: 1,
      estimated_cost: 0,
      average_lead_time_days: 0,
    }
    expect(buildReorderSummary(summary)).toEqual({
      total: 2,
      urgent: 1,
      soon: 1,
      estimatedCost: null,
      hasMissingCost: true,
    })
    expect(buildReorderSummary(ANALYSIS.summary)).toMatchObject({
      estimatedCost: 3000,
      hasMissingCost: false,
    })
  })

  it('combina urgentes y próximos en ese orden', () => {
    expect(reorderRows(ANALYSIS).map((item) => item.product_id)).toEqual(['U-1', 'U-2', 'S-1'])
    expect(reorderRows(null)).toEqual([])
  })
})
