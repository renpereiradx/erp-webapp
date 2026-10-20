import { describe, expect, it } from 'vitest'
import {
  buildDiscountSummaryView,
  DEFAULT_DISCOUNT_GROUP,
  defaultDiscountRange,
  DISCOUNT_GROUPS,
  isDiscountGroup,
  validateDiscountRange,
} from './discounts'

describe('rango del reporte de descuentos', () => {
  it('arranca en los últimos 30 días con hoy incluido', () => {
    expect(defaultDiscountRange(new Date(2026, 9, 20))).toEqual({
      start_date: '2026-09-21',
      end_date: '2026-10-20',
    })
  })

  it('valida fechas y orden', () => {
    expect(validateDiscountRange('2026-09-01', '2026-09-30')).toBe(true)
    expect(validateDiscountRange('2026-09-30', '2026-09-01')).toBe(false)
    expect(validateDiscountRange('', '2026-09-30')).toBe(false)
  })

  it('solo acepta las agrupaciones del BE y usa aplicador por defecto', () => {
    expect(DISCOUNT_GROUPS).toEqual(['seller', 'applier', 'branch'])
    expect(isDiscountGroup('branch')).toBe(true)
    expect(isDiscountGroup('product')).toBe(false)
    expect(DEFAULT_DISCOUNT_GROUP).toBe('applier')
  })
})

describe('buildDiscountSummaryView', () => {
  it('suma totales y calcula la participación de cada grupo', () => {
    const view = buildDiscountSummaryView([
      { group_key: 'u1', group_name: 'ADMIN', discount_count: 3, total_discount: 9310 },
      { group_key: 'u2', group_name: 'CAJERO', discount_count: 1, total_discount: 5690 },
    ])
    expect(view.totalDiscount).toBe(15000)
    expect(view.totalCount).toBe(4)
    expect(view.groups[0].share).toBeCloseTo(62.0667, 3)
    expect(view.groups[1].share).toBeCloseTo(37.9333, 3)
  })

  it('sin nombre cae a la clave del grupo; sin descuentos no divide por cero', () => {
    const view = buildDiscountSummaryView([
      { group_key: 'sin-sucursal', group_name: '', discount_count: 0, total_discount: 0 },
    ])
    expect(view.groups[0].group_name).toBe('sin-sucursal')
    expect(view.groups[0].share).toBe(0)
    expect(view.totalDiscount).toBe(0)
  })

  it('tolera null (slice nil de Go)', () => {
    expect(buildDiscountSummaryView(null)).toEqual({
      groups: [],
      totalDiscount: 0,
      totalCount: 0,
    })
  })
})
