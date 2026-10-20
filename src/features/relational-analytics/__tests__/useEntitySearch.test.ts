/**
 * Mappers del picker de entidades (F3): resultados Core → opciones de dos
 * líneas, sin inventar nombre/documento y dedupeando el nombre de variante.
 */
import { describe, expect, it } from 'vitest'
import { mapPartySearchResults, toSellableUnitOptions } from '../hooks/useEntitySearch'
import type { SellableUnitOption } from '@/features/catalog/sellableUnitSearch'

describe('mapPartySearchResults', () => {
  it('mappea clientes con nombre + documento y filtra resultados sin id', () => {
    const options = mapPartySearchResults([
      { id: 'CLI-1', first_name: 'Maria', last_name: 'Gomez', document_id: '1234567' },
      { name: 'Sin id' },
      null,
    ])
    expect(options).toEqual([
      { id: 'CLI-1', label: 'Maria Gomez', sub: '1234567' },
    ])
  })

  it('aplana el envelope {data: {...}} de algunos endpoints Core', () => {
    const options = mapPartySearchResults([{ data: { id: 'SUP-1', business_name: 'ACME' } }])
    expect(options).toEqual([{ id: 'SUP-1', label: 'ACME' }])
  })
})

describe('toSellableUnitOptions', () => {
  const base = (overrides: Partial<SellableUnitOption>): SellableUnitOption => ({
    id: 'PRD-1',
    name: 'Camiseta Adidas',
    variant_id: null,
    variant_name: null,
    sku: 'AD-R-M',
    price: 150000,
    stock: 12,
    base_unit: 'unit',
    ...overrides,
  })

  it('compone nombre + variante y conserva variantId/SKU', () => {
    const [option] = toSellableUnitOptions([
      base({ variant_id: 'VAR-1', variant_name: 'Rojo M' }),
    ])
    expect(option).toEqual({
      id: 'PRD-1',
      label: 'Camiseta Adidas · Rojo M',
      sub: 'AD-R-M',
      variantId: 'VAR-1',
    })
  })

  it('no duplica el nombre del producto cuando la variante ya lo embebe', () => {
    const [option] = toSellableUnitOptions([
      base({ variant_name: 'Camiseta Adidas Rojo M' }),
    ])
    expect(option.label).toBe('Camiseta Adidas Rojo M')
  })

  it('la fila base queda sin variante y sin sub si no hay SKU', () => {
    const [option] = toSellableUnitOptions([base({ sku: undefined })])
    expect(option).toEqual({ id: 'PRD-1', label: 'Camiseta Adidas', variantId: null })
  })
})
