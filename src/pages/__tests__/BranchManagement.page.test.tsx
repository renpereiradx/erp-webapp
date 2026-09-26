/**
 * BranchManagement — tabla de sucursales, columna Acciones.
 *
 * Contrato cubierto (bug 2026-09-26: el trigger ⋯ se renderizaba como botón
 * fantasma sin borde ni nombre accesible — invisible en la tabla aunque el
 * menú abría al tantear la celda):
 * - Cada fila expone un botón nombrado "Acciones" con icono visible (svg).
 * - Al pulsarlo abre el menú con las 4 entradas (editar, fiscal, accesos,
 *   desactivar) y "Desactivar Sucursal" abre el diálogo de confirmación.
 *
 * Mocks en la frontera: branchService e i18n (firma real t(key, fallback?,
 * vars?), fallback español). useToast es autocontenido (sin provider).
 * BranchModal no se renderiza hasta abrir edición: sin stub.
 * lucide-react NO se mockea (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BranchManagement from '../BranchManagement'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
    },
  }),
}))

const getBranches = vi.fn<() => Promise<unknown>>()
const updateBranch = vi.fn<() => Promise<unknown>>()

vi.mock('@/features/branches/services/branchService', () => ({
  branchService: {
    getBranches: (...args: unknown[]) => getBranches(...(args as [])),
    updateBranch: (...args: unknown[]) => updateBranch(...(args as [])),
  },
}))

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <BranchManagement />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getBranches.mockResolvedValue({
    branches: [
      {
        id: 1,
        code: 'MAIN',
        name: 'Nombre Sucursal',
        branch_type: 'HEADQUARTERS',
        city: null,
        is_active: true,
        is_warehouse: false,
      },
    ],
  })
})

afterEach(() => cleanup())

describe('BranchManagement — columna Acciones', () => {
  it('cada fila expone un botón "Acciones" nombrado y con icono visible', async () => {
    renderPage()

    expect(await screen.findByText('Nombre Sucursal')).toBeInTheDocument()

    const trigger = screen.getByRole('button', { name: /acciones/i })
    expect(trigger).toBeVisible()
    // Sin icono el botón fantasma es un círculo vacío imposible de ver.
    expect(trigger.querySelector('svg')).not.toBeNull()
  })

  it('abrir el trigger muestra las 4 entradas del menú', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /acciones/i }))

    expect(await screen.findByRole('menuitem', { name: /editar información/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /configuración fiscal/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /control de accesos/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /desactivar sucursal/i })).toBeInTheDocument()
  })

  it('"Desactivar Sucursal" abre el diálogo de confirmación con el nombre', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /acciones/i }))
    await user.click(await screen.findByRole('menuitem', { name: /desactivar sucursal/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Nombre Sucursal')).toBeInTheDocument()
  })
})
