/**
 * F3 — gate de i18n: el namespace `relationalAnalytics` y las claves `nav.*`
 * de los drill-downs existen en es y en, con las mismas claves y sin valores
 * vacíos (regla 3 de PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, expect, it } from 'vitest'
import { relationalAnalytics as es } from '../es/relationalAnalytics'
import { relationalAnalytics as en } from '../en/relationalAnalytics'
import { shell as shellEs } from '../es/shell'
import { shell as shellEn } from '../en/shell'

const flatten = (value: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(value).flatMap(([key, entry]) =>
    entry && typeof entry === 'object' && !Array.isArray(entry)
      ? flatten(entry as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )

const NAV_KEYS = [
  'nav.salesAnalytics',
  'nav.purchaseAnalytics',
  'nav.relationalBuyers',
  'nav.relationalCustomerTop',
  'nav.relationalSupplierTop',
  'nav.relationalProductSuppliers',
]

describe('relationalAnalytics locale (F3)', () => {
  it('es y en exponen las mismas claves', () => {
    expect(flatten(en).sort()).toEqual(flatten(es).sort())
  })

  it('tiene contenido en todas las claves (sin strings vacíos)', () => {
    const empty = flatten(es).filter((key) => {
      const value = key.split('.').reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        es,
      )
      return typeof value !== 'string' || value.trim() === ''
    })
    expect(empty).toEqual([])
  })

  it('las claves nav.* de los drill-downs existen en ambos shells', () => {
    for (const key of NAV_KEYS) {
      expect(shellEs[key as keyof typeof shellEs]).toBeTruthy()
      expect(shellEn[key as keyof typeof shellEn]).toBeTruthy()
    }
  })
})
