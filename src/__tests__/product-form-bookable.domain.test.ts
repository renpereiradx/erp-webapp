/**
 * Tests for the product form's bookable validation (pure Zod schema).
 *
 * D-SR-4: `is_bookable` is only allowed for SERVICE products — the same
 * invariant the backend enforces in internal/catalog's service.
 */

import { describe, it, expect } from 'vitest'
import { productSchema } from '../features/products/hooks/useProductForm'

const validBase = {
  name: 'Cancha 01',
  category: '3',
  productType: 'SERVICE',
  description: 'Cancha de beach tennis',
  base_unit: 'unit',
  is_variable_measure: false,
  is_bookable: false,
}

describe('productSchema is_bookable rules', () => {
  it('accepts a bookable SERVICE product', () => {
    const result = productSchema.safeParse({ ...validBase, is_bookable: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_bookable).toBe(true)
  })

  it('rejects is_bookable on PHYSICAL products with an is_bookable issue', () => {
    const result = productSchema.safeParse({
      ...validBase,
      productType: 'PHYSICAL',
      is_bookable: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.errors.find((e) => e.path.includes('is_bookable'))
      expect(issue).toBeDefined()
    }
  })

  it('rejects is_bookable on PRODUCTION products', () => {
    const result = productSchema.safeParse({
      ...validBase,
      productType: 'PRODUCTION',
      is_bookable: true,
    })
    expect(result.success).toBe(false)
  })

  it('defaults is_bookable to false when omitted', () => {
    const result = productSchema.safeParse({ ...validBase, is_bookable: undefined })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.is_bookable).toBe(false)
  })
})
