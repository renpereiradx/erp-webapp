/**
 * BranchModal — guardado por contexto de pestaña (DESIGN §6.10).
 *
 * Cada tab gestiona un recurso distinto: "info" es un formulario con Guardar
 * explícito; "fiscal" y "access" son acciones inmediatas por fila, así que su
 * footer muestra el hint + Cerrar y NUNCA un Guardar. Con cambios sin guardar
 * en "info", cerrar o cambiar de tab exige confirmación; descartar revierte.
 *
 * Mocks en la frontera: branchService, userService e i18n (firma real
 * t(key, fallback?, vars?), fallback español). useToast es autocontenido.
 * lucide-react y EnhancedModal NO se mockean (PLAN_TEST_DESIGN_FRONTEND).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BranchModal from '../components/BranchModal'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      if (!fallback) return key
      return fallback
        .replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? `{{${k}}}`))
        .replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
    },
  }),
}))

const getUsers = vi.fn<() => Promise<unknown>>()
const getFiscalConfigs = vi.fn<() => Promise<unknown>>()
const getAccesses = vi.fn<() => Promise<unknown>>()
const updateBranch = vi.fn<() => Promise<unknown>>()

vi.mock('@/services/userService', () => ({
  userService: {
    getUsers: (...args: unknown[]) => getUsers(...(args as [])),
  },
}))

vi.mock('@/features/branches/services/branchService', () => ({
  branchService: {
    getFiscalConfigs: (...args: unknown[]) => getFiscalConfigs(...(args as [])),
    getAccesses: (...args: unknown[]) => getAccesses(...(args as [])),
    createBranch: vi.fn(),
    updateBranch: (...args: unknown[]) => updateBranch(...(args as [])),
    grantAccess: vi.fn(),
    updateAccess: vi.fn(),
    revokeAccess: vi.fn(),
    createFiscalConfig: vi.fn(),
    deleteFiscalConfig: vi.fn(),
    setFiscalEnabled: vi.fn(),
  },
}))

const branch = {
  id: 1,
  code: 'MAIN',
  name: 'Nombre Sucursal',
  branch_type: 'HEADQUARTERS',
  is_active: true,
  is_warehouse: false,
  allows_sales: true,
  allows_purchases: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const renderModal = (props: Partial<Parameters<typeof BranchModal>[0]> = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onClose = vi.fn()
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <BranchModal isOpen onClose={onClose} branch={branch} {...props} />
    </QueryClientProvider>,
  )
  return { onClose, ...rendered }
}

beforeEach(() => {
  getUsers.mockResolvedValue({ data: [] })
  getFiscalConfigs.mockResolvedValue({ configs: [] })
  getAccesses.mockResolvedValue({ access: [] })
  updateBranch.mockResolvedValue(branch)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('BranchModal — footer contextual por pestaña', () => {
  it('en Información General muestra Cancelar + Guardar y no el hint de acción inmediata', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /Guardar Cambios/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.queryByText(/se aplican de inmediato/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument()
  })

  it('en Config. Fiscal muestra hint de acción inmediata + Cerrar y NUNCA Guardar', async () => {
    renderModal({ initialTab: 'fiscal' })
    expect(await screen.findByText(/se aplican de inmediato/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guardar Cambios/ })).not.toBeInTheDocument()
  })

  it('en Accesos muestra hint de acción inmediata + Cerrar y NUNCA Guardar', async () => {
    renderModal({ initialTab: 'access' })
    expect(await screen.findByText(/se aplican de inmediato/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Guardar Cambios/ })).not.toBeInTheDocument()
  })

  it('Cerrar en una pestaña limpia cierra el modal sin confirmación', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal({ initialTab: 'fiscal' })
    await screen.findByText(/se aplican de inmediato/)
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('BranchModal — guardar el tab Información General', () => {
  it('Guardar envía el formData al servicio (PUT updateBranch)', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }))
    await waitFor(() => expect(updateBranch).toHaveBeenCalledTimes(1))
    expect(updateBranch).toHaveBeenCalledWith(1, expect.objectContaining({ code: 'MAIN', name: 'Nombre Sucursal' }))
  })

  it('tras guardar, cerrar no pide confirmación (el snapshot se actualizó)', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }))
    await waitFor(() => expect(updateBranch).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument()
  })
})

describe('BranchModal — guardia de cambios sin guardar', () => {
  // El texto "Cambios sin guardar" vive dos veces (sr-only del tab + título
  // del confirm): el assert ancla en la descripción, única del confirm.
  const confirmDescription = () => screen.findByText(/Hay cambios sin guardar en Información General/)

  const editName = () => {
    fireEvent.change(screen.getByPlaceholderText('Ej: Sucursal Central'), { target: { value: 'Otro Nombre' } })
  }

  it('cerrar con cambios sin guardar pide confirmación; Descartar cierra', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    editName()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await confirmDescription()).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Seguir editando mantiene el modal abierto con los cambios', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    editName()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(await screen.findByRole('button', { name: 'Seguir editando' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Guardar Cambios/ })).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('Otro Nombre'),
    ).toBeInTheDocument()
  })

  it('cambiar de pestaña con cambios sin guardar pide confirmación; Descartar revierte y navega', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    editName()
    await user.click(screen.getByRole('tab', { name: /Config\. Fiscal/ }))
    expect(await confirmDescription()).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }))

    // Quedó en Config. Fiscal (hint visible) y el form volvió al snapshot.
    expect(await screen.findByText(/se aplican de inmediato/)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Información General/ }))
    expect(screen.getByDisplayValue('Nombre Sucursal')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Otro Nombre')).not.toBeInTheDocument()
  })

  it('el tab Información General anuncia los cambios sin guardar para lectores de pantalla', () => {
    renderModal()
    editName()
    expect(screen.getByText('Cambios sin guardar', { selector: '.sr-only' })).toBeInTheDocument()
  })
})
