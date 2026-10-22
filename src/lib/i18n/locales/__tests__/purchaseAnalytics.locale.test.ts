/**
 * PLAN_ANALITICA_COMPRAS — gate de i18n: el namespace `purchaseAnalytics`,
 * las claves nav.* del grupo y TODAS las claves estáticas usadas en la
 * feature/páginas existen en es y en con las mismas claves y sin valores
 * vacíos (regla 3 de PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { purchaseAnalytics as es } from '../es/purchaseAnalytics'
import { purchaseAnalytics as en } from '../en/purchaseAnalytics'
import { shell as shellEs } from '../es/shell'
import { shell as shellEn } from '../en/shell'

const flatten = (value: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(value).flatMap(([key, entry]) =>
    entry && typeof entry === 'object' && !Array.isArray(entry)
      ? flatten(entry as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )

const esKeys = new Set(flatten(es))

const NAV_KEYS = [
  'nav.purchaseAnalytics',
  'nav.purchaseDashboard',
  'nav.purchaseProductsCategories',
  'nav.purchaseInsights',
  'nav.purchaseTrends',
  'nav.purchasePeriodComparison',
  'nav.relationalSupplierTop',
  'nav.relationalProductSuppliers',
]

const walk = (dir: string): string[] => {
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry) ? [full] : []
  })
}

/** Claves estáticas `purchaseAnalytics.*` usadas en el código del grupo. */
const usedKeys = (): string[] => {
  const roots = [
    resolve(process.cwd(), 'src/features/purchase-analytics'),
    resolve(process.cwd(), 'src/pages/purchase-analytics'),
    resolve(process.cwd(), 'src/domain/purchase-analytics'),
  ]
  const found = new Set<string>()
  for (const root of roots) {
    for (const file of walk(root)) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/purchaseAnalytics\.([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g)) {
        found.add(`purchaseAnalytics.${match[1]}`)
      }
    }
  }
  return [...found]
}

describe('purchaseAnalytics locale (PLAN_ANALITICA_COMPRAS)', () => {
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

  it('las claves nav.* del grupo existen en ambos shells', () => {
    for (const key of NAV_KEYS) {
      expect(shellEs[key as keyof typeof shellEs]).toBeTruthy()
      expect(shellEn[key as keyof typeof shellEn]).toBeTruthy()
    }
  })

  it('toda clave estática usada en el código existe en el locale', () => {
    // Las claves construidas con template literal (`purchaseAnalytics.trend.${key}`)
    // aparecen como prefijo sin hoja: se aceptan si existe alguna clave debajo.
    const isNamespacePrefix = (key: string) =>
      [...esKeys].some((candidate) => candidate.startsWith(`${key}.`))
    const missing = usedKeys().filter(
      (key) => !esKeys.has(key) && !isNamespacePrefix(key),
    )
    expect(missing).toEqual([])
  })
})
