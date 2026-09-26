/**
 * Sheet primitives (ui/sheet.jsx) — contrato CSS mínimo.
 *
 * Los primitives Radix no traen estilos propios: si .sheet-content-* pierde
 * su `position: fixed`, el sheet se monta pero renderiza in-flow al final
 * del body (invisible, fuera de pantalla). Este test fija el contrato para
 * no reintroducir el bug del panel "Gestionar Roles" (2026-09: abría con
 * GET /roles 200 pero no se veía nada).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'src', 'index.css'),
  'utf8',
)

const block = (selector: string): string => {
  const escaped = selector.replace('.', '\\.')
  const m = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  if (!m) throw new Error(`selector ${selector} no definido en src/index.css`)
  return m[1]
}

describe('sheet primitives — contrato CSS', () => {
  it('overlay y content están posicionados fixed con z-index', () => {
    expect(block('.sheet-overlay')).toMatch(/position:\s*fixed/)
    expect(block('.sheet-content')).toMatch(/position:\s*fixed/)
    expect(block('.sheet-content')).toMatch(/z-index:\s*100/)
  })

  it('las variantes laterales anclan al borde correcto', () => {
    expect(block('.sheet-content--right')).toMatch(/right:\s*0/)
    expect(block('.sheet-content--left')).toMatch(/left:\s*0/)
  })

  it('el botón close del primitive está posicionado absoluto', () => {
    expect(block('.sheet-close')).toMatch(/position:\s*absolute/)
  })
})
