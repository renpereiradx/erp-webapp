/**
 * MovementForm — borrador persistido + guard de salida.
 *
 * Flujo cubierto: restauración del borrador al montar (scoping por operador),
 * write-through a localStorage, diálogo de salida con las tres salidas
 * (Guardar y salir / Salir sin guardar / Seguir editando) ejercitando el
 * guard real de window.history, y limpieza del borrador tras el submit.
 *
 * Mocks en la frontera: hook del feature (useStockMovements), ProductSearchModal,
 * unitConversionsService e i18n (firma real, fallback español). El draft store y
 * el auth store son REALES (se manejan vía getState/setState).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => {
  return {
    registerBatch: vi.fn(),
    getAll: vi.fn<() => Promise<unknown[]>>(),
    product: {
      id: 'PROD_KG',
      name: 'PAPA KG',
      base_unit: 'kg',
      stock_quantity: 50,
      image_url: '',
    } as Record<string, unknown>,
  }
})

vi.mock('@/lib/i18n', () => ({
  // Firma real (i18n/index.js): t(key, fallback?, vars?) aceptando t(key, vars).
  useI18n: () => ({
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars = typeof fallbackOrVars === 'string' ? maybeVars : fallbackOrVars
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('../hooks/useStockMovements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useStockMovements')>()
  return {
    ...actual,
    useStockMovements: () => ({
      operator: 'USER_OP',
      registerBatch: mocks.registerBatch,
      loading: false,
      error: null,
      clearError: vi.fn(),
    }),
  }
})

vi.mock('@/features/unit-conversions/services/unitConversionsService', () => ({
  unitConversionsService: { getAll: () => mocks.getAll() },
}))

vi.mock('../components/ProductSearchModal', () => ({
  ProductSearchModal: ({ onSelect }: { onSelect: (p: unknown) => void }) => (
    <button data-testid="mock-search" onClick={() => onSelect({ ...mocks.product })}>
      buscar
    </button>
  ),
}))

import { MovementForm } from '../components/MovementForm'
import { useStockMovementsDraftStore } from '@/store/useStockMovementsDraftStore'
import useAuthStore from '@/store/useAuthStore'
import type { MovementRowUI } from '../types'

const draftRow = (): MovementRowUI => ({
  product: { id: 'PROD_KG', name: 'PAPA KG', base_unit: 'kg', stock_quantity: 50, image_url: '' },
  variants: [],
  selectedVariantId: '',
  mode: 'target',
  value: '5',
  unit: 'kg',
  reasonCategory: 'INVENTORY_COUNT',
  reason: '',
})

const storedDraft = () => {
  const raw = localStorage.getItem('stock-movements-draft')
  return raw ? (JSON.parse(raw).state as { userId: string | null; rows: MovementRowUI[] }) : null
}

/** Render + una fila agregada desde el buscador (cierra el modal de edición). */
const renderWithRow = async () => {
  const user = userEvent.setup()
  render(<MovementForm />)
  await user.click(screen.getByTestId('mock-search'))
  await screen.findByText('Editar movimiento')
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  return user
}

describe('MovementForm — borrador y guard de salida', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAll.mockResolvedValue([])
    mocks.registerBatch.mockResolvedValue([])
    localStorage.clear()
    useStockMovementsDraftStore.setState({ userId: null, rows: [], savedAt: null })
    useAuthStore.setState({ user: { id: 'USER_OP' } as never })
    // Tests previos pudieron navegar: volver a la raíz (sin parches tras cleanup).
    window.history.replaceState(null, '', '/')
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
    useAuthStore.setState({ user: null })
  })

  it('restaura el borrador del operador al montar y muestra el badge', () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_OP', [draftRow()])
    render(<MovementForm />)

    expect(screen.getByText('PAPA KG')).toBeInTheDocument()
    expect(screen.getByTestId('stock-movements-draft-badge')).toBeInTheDocument()
  })

  it('NO restaura el borrador de otro operador (terminales compartidas)', () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_OTHER', [draftRow()])
    render(<MovementForm />)

    expect(screen.getByText('No hay productos en la cola.')).toBeInTheDocument()
    expect(screen.queryByTestId('stock-movements-draft-badge')).not.toBeInTheDocument()
  })

  it('agregar una fila persiste el borrador (write-through a localStorage)', async () => {
    await renderWithRow()

    await waitFor(() => expect(storedDraft()?.rows).toHaveLength(1))
    expect(storedDraft()?.userId).toBe('USER_OP')
  })

  it('el badge permite descartar el borrador', async () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_OP', [draftRow()])
    const user = userEvent.setup()
    render(<MovementForm />)

    await user.click(screen.getByRole('button', { name: 'Descartar borrador' }))
    expect(screen.getByText('No hay productos en la cola.')).toBeInTheDocument()
    await waitFor(() => expect(storedDraft()?.rows).toEqual([]))
  })

  it('"Guardar y salir" conserva el borrador y permite la navegación', async () => {
    const user = await renderWithRow()
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByRole('button', { name: 'Guardar y salir' }))

    expect(window.location.pathname).toBe('/dashboard')
    expect(screen.queryByTestId('stock-movements-exit-dialog')).not.toBeInTheDocument()
    expect(storedDraft()?.rows).toHaveLength(1)
  })

  it('"Salir sin guardar" limpia el borrador y permite la navegación', async () => {
    const user = await renderWithRow()
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByRole('button', { name: 'Salir sin guardar' }))

    expect(window.location.pathname).toBe('/dashboard')
    expect(storedDraft()?.rows).toEqual([])
  })

  it('"Seguir editando" cancela y la guardia sigue bloqueando', async () => {
    const user = await renderWithRow()
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })

    await user.click(screen.getByRole('button', { name: 'Seguir editando' }))
    expect(window.location.pathname).not.toBe('/dashboard')
    expect(screen.queryByTestId('stock-movements-exit-dialog')).not.toBeInTheDocument()

    // Segundo intento: sigue bloqueado (cancel no abre la barrera).
    act(() => {
      expect(() => window.history.pushState({}, '', '/dashboard')).toThrow(/Navigation blocked/)
    })
    expect(screen.getByTestId('stock-movements-exit-dialog')).toBeInTheDocument()
  })

  it('el submit exitoso limpia el borrador', async () => {
    const user = userEvent.setup()
    render(<MovementForm />)
    await user.click(screen.getByTestId('mock-search'))
    await screen.findByText('Editar movimiento')
    await user.type(screen.getByLabelText('Stock objetivo'), '5')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await user.click(screen.getByRole('button', { name: /Registrar movimiento/ }))

    await waitFor(() => expect(mocks.registerBatch).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(storedDraft()?.rows).toEqual([]))
  })
})
