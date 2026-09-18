import { describe, expect, it } from 'vitest'
import { buildAbcItems } from './abc'

const SUMMARY = {
  class_a_value_pct: 80,
  class_b_value_pct: 15,
  class_c_value_pct: 5,
  class_a_count: 12,
  class_b_count: 30,
  class_c_count: 58,
}

describe('buildAbcItems', () => {
  it('[] sin resumen ABC', () => {
    expect(buildAbcItems(null, 1000)).toEqual([])
    expect(buildAbcItems(undefined, 1000)).toEqual([])
  })

  it('3 clases con valor PYG sobre el total y descripciones del legado', () => {
    const items = buildAbcItems(SUMMARY, 1000000)
    expect(items.map((i) => i.class)).toEqual(['A', 'B', 'C'])
    expect(items[0]).toEqual({
      class: 'A',
      label: 'Clase A (Alta Rotación/Valor)',
      percentage: 80,
      count: 12,
      value: 'Gs. 800.000',
      description: 'Productos que representan el 80% del valor total.',
    })
    expect(items[1].value).toBe('Gs. 150.000')
    expect(items[2].value).toBe('Gs. 50.000')
  })

  it('trata total faltante como 0', () => {
    const items = buildAbcItems(SUMMARY, null)
    expect(items[0].value).toBe('Gs. 0')
  })
})
