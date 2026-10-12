/**
 * MovementForm — selector de unidad por fila (PLAN_UNITS_V2_COMPLETACION F4).
 *
 * - Elegir una unidad ≠ base muestra el hint del factor (1 unidad = factor base)
 *   o el hint de error cuando no hay conversión; sin factor Guardar no cierra.
 * - Guardar con conversión persiste la fila y el submit entrega al hook
 *   `unitFactor` (el mismo resolveUnitFactor que usa el dominio para el preview).
 *
 * Mocks en la frontera: hook del feature (useStockMovements), ProductSearchModal
 * (modal pesado: botón que invoca onSelect), unitConversionsService e i18n
 * (firma real, fallback español). lucide-react NO se mockea.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
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
      registerBatch: mocks.registerBatch.mockResolvedValue([]),
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
    <button data-testid="mock-search" onClick={() => onSelect(mocks.product)}>
      buscar
    </button>
  ),
}))

import { MovementForm } from '../components/MovementForm'

const renderForm = () => {
  render(<MovementForm />)
  return userEvent.setup()
}

/** Agrega la fila kg y abre el modal de edición. */
const addRowAndOpenEdit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId('mock-search'))
  await screen.findByText('Editar movimiento')
}

describe('MovementForm — unidad por fila (PLAN_UNITS_V2 F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAll.mockResolvedValue([])
    mocks.product = { id: 'PROD_KG', name: 'PAPA KG', base_unit: 'kg', stock_quantity: 50, image_url: '' }
  })
  afterEach(() => cleanup())

  it('elegir Caja sin conversiones muestra el hint de error y Guardar no cierra', async () => {
    const user = await (async () => {
      const u = renderForm()
      await addRowAndOpenEdit(u)
      return u
    })()

    await user.click(screen.getByRole('combobox', { name: 'Unidad de la cantidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))

    expect(await screen.findByTestId('movement-unit-no-conversion')).toHaveTextContent(
      'Sin conversión de Caja a Kilogramo (kg)',
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    // Guardar es no-op sin factor: el modal sigue abierto.
    expect(screen.getByText('Editar movimiento')).toBeInTheDocument()
    expect(mocks.registerBatch).not.toHaveBeenCalled()
  })

  it('con conversión global muestra el hint del factor y guarda la fila', async () => {
    mocks.getAll.mockResolvedValue([{ from_unit: 'box', to_unit: 'kg', factor: 10, product_id: null }])
    const user = renderForm()
    await addRowAndOpenEdit(user)

    await user.click(screen.getByRole('combobox', { name: 'Unidad de la cantidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))

    expect(await screen.findByTestId('movement-unit-hint')).toHaveTextContent('1 Caja = 10 Kilogramo (kg)')

    await user.type(screen.getByLabelText('Stock objetivo'), '2')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByText('Editar movimiento')).not.toBeInTheDocument())
  })

  it('el submit entrega unit + unitFactor al hook (2 box con factor 10)', async () => {
    mocks.getAll.mockResolvedValue([{ from_unit: 'box', to_unit: 'kg', factor: 10, product_id: null }])
    const user = renderForm()
    await addRowAndOpenEdit(user)

    await user.click(screen.getByRole('combobox', { name: 'Unidad de la cantidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))
    // Modo target: 2 box de stock objetivo (50 kg actuales = 5 box).
    await user.type(screen.getByLabelText('Stock objetivo'), '2')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await user.click(screen.getByRole('button', { name: /Registrar movimiento/ }))

    await waitFor(() => expect(mocks.registerBatch).toHaveBeenCalledTimes(1))
    const [rows] = mocks.registerBatch.mock.calls[0]
    expect(rows).toHaveLength(1)
    expect(rows[0].form.unit).toBe('box')
    expect(rows[0].form.targetStock).toBe(2)
    expect(rows[0].unitFactor).toBe(10)
    expect(rows[0].currentStock).toBe(50)
  })

  it('1,5 en unidad entera se trunca a 1 al guardar (auditoría A3)', async () => {
    mocks.getAll.mockResolvedValue([{ from_unit: 'box', to_unit: 'kg', factor: 10, product_id: null }])
    const user = renderForm()
    await addRowAndOpenEdit(user)

    await user.click(screen.getByRole('combobox', { name: 'Unidad de la cantidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))
    await user.type(screen.getByLabelText('Stock objetivo'), '1.5')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByText('Editar movimiento')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Registrar movimiento/ }))

    await waitFor(() => expect(mocks.registerBatch).toHaveBeenCalledTimes(1))
    const [rows] = mocks.registerBatch.mock.calls[0]
    expect(rows[0].form.targetStock).toBe(1)
  })

  it('0,5 en unidad entera bloquea el registro (no se pierde silenciosamente)', async () => {
    mocks.getAll.mockResolvedValue([{ from_unit: 'box', to_unit: 'kg', factor: 10, product_id: null }])
    const user = renderForm()
    await addRowAndOpenEdit(user)

    await user.click(screen.getByRole('combobox', { name: 'Unidad de la cantidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))
    await user.type(screen.getByLabelText('Stock objetivo'), '0.5')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByText('Editar movimiento')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Registrar movimiento/ }))

    // Bloqueado por la guardia de unidad entera: nada viaja al hook
    // (mismo patrón que el bloqueo por sin-conversión de transferencias).
    expect(mocks.registerBatch).not.toHaveBeenCalled()
  })
})
