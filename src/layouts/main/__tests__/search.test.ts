/**
 * F7/F8 — el buscador global solo ofrece la lista de CxC con pack BI y
 * `receivables:read`, y la de CxP con `payables:read`: una entrada que expulsa
 * al usuario es una affordance muerta (misma regla que los drill-downs de F3).
 */
import { describe, expect, it } from 'vitest'
import { buildSearchableItems } from '../search'
import type { NavigationItem, TFn } from '../types'

const t = ((key: string, fallback?: string) => fallback ?? key) as unknown as TFn
const navigation: NavigationItem[] = []

const hrefs = (options: {
  biEnabled?: boolean
  permissions?: string[]
  reservationsEnabled?: boolean
}) =>
  buildSearchableItems(
    navigation,
    t,
    options.reservationsEnabled ?? false,
    options.biEnabled ?? true,
    (permission) => (options.permissions ?? []).includes(permission),
  ).map((item) => item.href)

describe('search — gate de rutas BI (F7/F8)', () => {
  it('con pack + receivables:read ofrece /receivables/list', () => {
    expect(hrefs({ permissions: ['receivables:read'] })).toContain('/receivables/list')
  })

  it('sin pack BI no ofrece la ruta aunque tenga el permiso', () => {
    expect(hrefs({ biEnabled: false, permissions: ['receivables:read'] })).not.toContain(
      '/receivables/list',
    )
  })

  it('con pack pero sin receivables:read no ofrece la ruta', () => {
    expect(hrefs({ permissions: ['analytics:read'] })).not.toContain('/receivables/list')
  })

  it('la entrada no se degrada como BI (categoría de finanzas)', () => {
    expect(hrefs({ permissions: ['receivables:read'] })).toContain('/receivables/list')
  })

  it('con pack + payables:read ofrece /payables/invoices', () => {
    expect(hrefs({ permissions: ['payables:read'] })).toContain('/payables/invoices')
  })

  it('sin pack BI no ofrece la lista de CxP aunque tenga el permiso', () => {
    expect(hrefs({ biEnabled: false, permissions: ['payables:read'] })).not.toContain(
      '/payables/invoices',
    )
  })

  it('con pack pero sin payables:read no ofrece la lista de CxP', () => {
    expect(hrefs({ permissions: ['receivables:read'] })).not.toContain('/payables/invoices')
  })
})
