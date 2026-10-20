import { describe, expect, it } from 'vitest'
import { performanceKey, performanceTone } from './performance'
import {
  contributionAvailable,
  isUnprofitable,
  nextProductSort,
  productAriaSort,
  productRows,
} from './products'
import { customerContributionAvailable, customerName, customerRecencyDays, customerRows, segmentKey, segmentTone } from './customers'
import { categoryExtremes, categoryRows, categoryShareAvailable } from './categories'
import { sellerContributionAvailable, sellerName, sellerRows } from './sellers'

describe('performance', () => {
  it.each([
    ['EXCELLENT', 'excellent', 'success'],
    ['GOOD', 'good', 'primary'],
    ['AVERAGE', 'average', 'neutral'],
    ['POOR', 'poor', 'warning'],
    ['LOSS', 'loss', 'error'],
  ] as const)('%s → %s / %s', (raw, key, tone) => {
    expect(performanceKey(raw)).toBe(key)
    expect(performanceTone(key)).toBe(tone)
  })

  it('desconocido o vacío → null (no se muestra)', () => {
    expect(performanceKey('UNKNOWN')).toBeNull()
    expect(performanceKey(null)).toBeNull()
    expect(performanceKey('')).toBeNull()
  })
})

describe('productos', () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    product_id: 'P-1',
    product_name: 'Producto',
    sku: '',
    category_id: '1',
    category_name: 'Cat',
    units_sold: 1,
    revenue: 1000,
    cost: 600,
    gross_profit: 400,
    gross_margin_pct: 40,
    average_price: 1000,
    average_cost: 600,
    markup: 66.7,
    contribution_pct: 10,
    profit_per_unit: 400,
    rank: 1,
    performance: 'GOOD',
    ...overrides,
  })

  it('normaliza null a []', () => {
    expect(productRows(null)).toEqual([])
    expect(productRows([row() as never])).toHaveLength(1)
  })

  it('la contribución solo se ofrece con beneficio total positivo', () => {
    expect(contributionAvailable(530500)).toBe(true)
    expect(contributionAvailable(0)).toBe(false)
    expect(contributionAvailable(null)).toBe(false)
  })

  it('marca pérdida por performance o por beneficio negativo', () => {
    expect(isUnprofitable(row({ performance: 'LOSS' }) as never)).toBe(true)
    expect(isUnprofitable(row({ gross_profit: -10 }) as never)).toBe(true)
    expect(isUnprofitable(row() as never)).toBe(false)
  })

  it('el toggling conserva el orden natural de cada columna', () => {
    expect(nextProductSort({ by: 'name', order: 'ASC' }, 'name')).toEqual({
      by: 'name',
      order: 'DESC',
    })
    expect(productAriaSort({ by: 'name', order: 'ASC' }, 'name')).toBe('ascending')
  })
})

describe('clientes', () => {
  const row = {
    customer_id: 'CL-1',
    customer_name: '',
    customer_type: 'REGULAR',
    total_purchases: 2,
    total_revenue: 1000,
    total_cost: 600,
    gross_profit: 400,
    gross_margin_pct: 40,
    average_ticket: 500,
    average_profit_per_tx: 200,
    contribution_pct: 100,
    first_purchase: '2026-10-01T00:00:00Z',
    last_purchase: '2026-10-14T12:00:00Z',
    days_since_last_purchase: 0,
    segment: 'PLATINUM',
    rank: 1,
  }

  it('nombre visible cae al id si el BE manda first_name vacío', () => {
    expect(customerName(row as never)).toBe('CL-1')
    expect(customerName({ ...row, customer_name: ' Erika ' } as never)).toBe('Erika')
  })

  it('normaliza null a []', () => {
    expect(customerRows(null)).toEqual([])
    expect(customerRows([row as never])).toHaveLength(1)
  })

  it('deriva la antigüedad desde la fecha real (no usa el campo del BE)', () => {
    const now = new Date(2026, 9, 20, 9, 0, 0)
    expect(customerRecencyDays(row as never, now)).toBe(6)
  })

  it('segmentos traducidos con tono', () => {
    expect(segmentKey('PLATINUM')).toBe('platinum')
    expect(segmentKey('BRONZE')).toBe('bronze')
    expect(segmentKey('REGULAR')).toBeNull()
    expect(segmentTone('platinum')).toBe('primary')
    expect(segmentTone('gold')).toBe('warning')
  })

  it('contribución disponible solo con beneficio total positivo', () => {
    expect(customerContributionAvailable(530500)).toBe(true)
    expect(customerContributionAvailable(-1)).toBe(false)
    expect(customerContributionAvailable(null)).toBe(false)
  })
})

describe('categorías', () => {
  const rows = [
    { category_id: '18', category_name: 'Electrónicos', gross_profit: 300000 },
    { category_id: '1', category_name: 'Alquiler', gross_profit: 181000 },
    { category_id: '7', category_name: 'Bebidas', gross_profit: 2400 },
  ]

  it('mejor/peor se derivan del orden real del BE', () => {
    const extremes = categoryExtremes({ categories: rows } as never)
    expect(extremes.best?.category_id).toBe('18')
    expect(extremes.worst?.category_id).toBe('7')
    expect(extremes.hasMultiple).toBe(true)
  })

  it('una sola categoría no inventa un "peor"', () => {
    const extremes = categoryExtremes({ categories: [rows[0]] } as never)
    expect(extremes.best?.category_id).toBe('18')
    expect(extremes.worst).toBeNull()
    expect(extremes.hasMultiple).toBe(false)
  })

  it('lista vacía/null', () => {
    expect(categoryRows(null)).toEqual([])
    expect(categoryExtremes(null)).toEqual({ best: null, worst: null, hasMultiple: false })
    expect(categoryShareAvailable(530500)).toBe(true)
    expect(categoryShareAvailable(0)).toBe(false)
  })
})

describe('vendedores', () => {
  it('nombre cae al id y normaliza null', () => {
    expect(sellerName({ seller_id: 'U-1', seller_name: '' } as never)).toBe('U-1')
    expect(sellerName({ seller_id: 'U-1', seller_name: 'ADMIN' } as never)).toBe('ADMIN')
    expect(sellerRows(null)).toEqual([])
    expect(sellerContributionAvailable(530500)).toBe(true)
    expect(sellerContributionAvailable(0)).toBe(false)
  })
})
