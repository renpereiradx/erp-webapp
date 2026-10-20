/**
 * F4 — gate de i18n: el namespace `salesAnalytics`, las claves nav.* del grupo
 * y TODAS las claves estáticas usadas en la feature/páginas de F4 existen en es
 * y en con las mismas claves y sin valores vacíos
 * (regla 3 de PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { salesAnalytics as es } from '../es/salesAnalytics'
import { salesAnalytics as en } from '../en/salesAnalytics'
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
  'nav.salesAnalytics',
  'nav.salesDashboard',
  'nav.salesProductsCategories',
  'nav.salesInsights',
  'nav.salesTrendsVelocity',
  'nav.salesPeriodComparison',
  'nav.salesDiscounts',
  'nav.relationalBuyers',
  'nav.relationalCustomerTop',
]

const walk = (dir: string): string[] => {
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry) ? [full] : []
  })
}

/** Claves estáticas `salesAnalytics.*` usadas en el código de F4. */
const usedKeys = (): string[] => {
  const roots = [
    resolve(process.cwd(), 'src/features/sales-analytics'),
    resolve(process.cwd(), 'src/pages/sales-analytics'),
    resolve(process.cwd(), 'src/domain/sales-analytics'),
  ]
  const found = new Set<string>()
  for (const root of roots) {
    for (const file of walk(root)) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/salesAnalytics\.([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g)) {
        found.add(`salesAnalytics.${match[1]}`)
      }
    }
  }
  return [...found]
}

describe('salesAnalytics locale (F4)', () => {
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

  it('toda clave estática usada en el código de F4 existe en el locale', () => {
    // Las claves construidas con template literal (`salesAnalytics.days.${key}`)
    // aparecen como prefijo sin hoja: se aceptan si existe alguna clave debajo.
    const isNamespacePrefix = (key: string) =>
      [...esKeys].some((candidate) => candidate.startsWith(`${key}.`))
    const missing = usedKeys().filter(
      (key) => !esKeys.has(key) && !isNamespacePrefix(key),
    )
    expect(missing).toEqual([])
  })
})
