import { describe, expect, it } from 'vitest'
import { abcClassFromCode, abcProductsForClass, buildAbcClassRows, isAbcClass } from './abc'
import type { ABCAnalysis, ABCProduct, ABCSummary } from '@/types/bi'

const SUMMARY: ABCSummary = {
  total_products: 21,
  total_value: 1234500,
  class_a_count: 1,
  class_a_value: 1000000,
  class_a_value_pct: 81,
  class_b_count: 2,
  class_b_value: 200000,
  class_b_value_pct: 16.2,
  class_c_count: 18,
  class_c_value: 34500,
  class_c_value_pct: 2.8,
}

const product = (id: string, klass: 'A' | 'B' | 'C'): ABCProduct => ({
  product_id: id,
  product_name: `Producto ${id}`,
  sku: id,
  category_name: 'MODA',
  product_type: 'PHYSICAL',
  class: klass,
  total_sales: 100,
  sales_percentage: 10,
  cumulative_pct: 10,
  units_sold: 2,
  current_stock: 5,
  stock_value: 1000,
  turnover_rate: 0,
  rank: 1,
})

const ANALYSIS = {
  generated_at: '2026-10-20T12:00:00Z',
  period: { start_date: '2026-10-01T00:00:00Z', end_date: '2026-11-01T00:00:00Z' },
  summary: SUMMARY,
  class_a: [product('P-A', 'A')],
  class_b: [product('P-B1', 'B'), product('P-B2', 'B')],
  class_c: null,
} as ABCAnalysis

describe('inventory abc', () => {
  it('usa los montos del summary sin reconstruirlos desde el total', () => {
    expect(buildAbcClassRows(SUMMARY)).toEqual([
      { class: 'A', count: 1, value: 1000000, percentage: 81 },
      { class: 'B', count: 2, value: 200000, percentage: 16.2 },
      { class: 'C', count: 18, value: 34500, percentage: 2.8 },
    ])
    expect(buildAbcClassRows(null)).toEqual([])
  })

  it('devuelve los productos de la clase pedida y normaliza null', () => {
    expect(abcProductsForClass(ANALYSIS, 'A')).toHaveLength(1)
    expect(abcProductsForClass(ANALYSIS, 'B')).toHaveLength(2)
    expect(abcProductsForClass(ANALYSIS, 'C')).toEqual([])
    expect(abcProductsForClass(null, 'A')).toEqual([])
  })

  it('normaliza el código de clase y valida el tipo', () => {
    expect(abcClassFromCode('A')).toBe('A')
    expect(abcClassFromCode('B')).toBe('B')
    expect(abcClassFromCode('C')).toBe('C')
    expect(abcClassFromCode(null)).toBe('C')
    expect(isAbcClass('A')).toBe(true)
    expect(isAbcClass('D')).toBe(false)
  })
})
