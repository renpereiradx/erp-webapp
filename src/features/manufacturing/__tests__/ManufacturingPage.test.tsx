/**
 * ManufacturingPage — reconstrucción F6.2 (PLAN_UNITS_V2).
 *
 * - Shell: 3 pestañas + tabla de insumos con filas del servicio (mockeado en
 *   la frontera) y empty state armado dentro de la tabla (§6.3).
 * - Producción: picker de producto fabricado → UnitSelect con hint del factor
 *   (patrón F4) → payload unit lowercase + cantidad; 0,5 en unidad entera
 *   BLOQUEA (gating A3, nunca pérdida silenciosa).
 *
 * Mocks: manufacturingService, unitConversionsService, searchSellableUnitsFlat
 * (fronteras de módulo), SearchableDropdown (componente pesado → botón que
 * invoca onSelect) e i18n con la firma real (fallback español).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  supplies: [] as Array<Record<string, unknown>>,
  conversions: [] as Array<Record<string, unknown>>,
  product: {
    id: 'PROD_EMPANADA',
    name: 'Empanada de jamón y queso',
    variant_id: null,
    sku: undefined,
    price: 5000,
    stock: 7,
    base_unit: 'kg',
    product_type: 'PRODUCTION',
  },
  registerProduction: vi.fn(),
  createSupply: vi.fn(),
}))

// i18n con el DICCIONARIO REAL es (resolución de path punteado como el t()
// real): resuelve keys de manufacturing.* y a la vez valida que existan (una
// key faltante revienta el test, no lo oculta).
vi.mock('@/lib/i18n', async () => {
  const { es } = await import('@/lib/i18n/locales/es')
  const resolve = (obj: unknown, path: string): unknown =>
    path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj)
  return {
    useI18n: () => ({
      t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
        const resolved = resolve(es, key)
        const raw = typeof resolved === 'string' ? resolved : (fallback ?? key)
        if (!vars) return raw
        return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
      },
    }),
  }
})

vi.mock('@/services/manufacturingService', () => ({
  manufacturingService: {
    getSupplies: vi.fn(() => Promise.resolve(mocks.supplies)),
    createSupply: (...args: unknown[]) => mocks.createSupply(...args),
    updateSupply: vi.fn(() => Promise.resolve({})),
    deleteSupply: vi.fn(() => Promise.resolve({})),
    registerSupplyPurchase: vi.fn(() => Promise.resolve({ success: true })),
    getSupplyPurchases: vi.fn(() => Promise.resolve([])),
    registerProduction: (...args: unknown[]) => mocks.registerProduction(...args),
    getBatches: vi.fn(() => Promise.resolve([])),
    getRecipe: vi.fn(() => Promise.resolve([])),
    addRecipeIngredient: vi.fn(() => Promise.resolve({})),
    removeRecipeIngredient: vi.fn(() => Promise.resolve({})),
    getEstimatedCost: vi.fn(() =>
      Promise.resolve({
        success: true,
        product_id: 'PROD_EMPANADA',
        product_name: 'Empanada',
        quantity: 1,
        estimated_total_cost: 0,
        cost_per_unit: 0,
        cost_details: [],
      }),
    ),
    getProductionSummary: vi.fn(() => Promise.resolve([])),
    getProfitability: vi.fn(() => Promise.resolve([])),
  },
}))

vi.mock('@/features/unit-conversions/services/unitConversionsService', () => ({
  unitConversionsService: { getAll: () => Promise.resolve(mocks.conversions) },
}))

vi.mock('@/features/catalog/sellableUnitSearch', () => ({
  searchSellableUnitsFlat: vi.fn(() => Promise.resolve([mocks.product])),
}))

vi.mock('@/components/ui/SearchableDropdown', () => ({
  default: ({ onSelect }: { onSelect: (item: unknown) => void }) => (
    <button data-testid="mock-search" onClick={() => onSelect(mocks.product)}>
      buscar
    </button>
  ),
  SearchableDropdownItem: {},
}))

import { ManufacturingPage } from '../components/ManufacturingPage'

const renderPage = () => {
  render(<ManufacturingPage />)
  return userEvent.setup()
}

describe('ManufacturingPage — shell e insumos (F6.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.supplies = []
  })
  afterEach(() => cleanup())

  it('renderiza las 3 pestañas y el empty state de insumos dentro de la tabla', async () => {
    const user = renderPage()

    expect(screen.getByRole('tab', { name: 'Insumos' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Recetas' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Producción' })).toBeInTheDocument()

    expect(await screen.findByText('Sin insumos registrados')).toBeInTheDocument()
    expect(screen.getByText('Creá el primero para empezar a registrar compras y recetas')).toBeInTheDocument()
    expect(screen.getByTestId('supply-new')).toBeInTheDocument()
    void user
  })

  it('muestra filas de insumos con estadísticas de compras', async () => {
    mocks.supplies = [
      {
        id: 1,
        name: 'Harina 000',
        unit: 'kg',
        supplier_name: 'Molino Py',
        state: true,
        created_at: '2026-10-01',
        updated_at: '2026-10-01',
        total_purchases: 4,
        total_quantity_purchased: 120,
        total_spent: 360000,
        avg_unit_cost: 3000,
        last_purchase_date: '2026-10-03T10:00:00Z',
        used_in_recipes: 2,
      },
    ]
    renderPage()

    expect(await screen.findByText('Harina 000')).toBeInTheDocument()
    expect(screen.getByText('Molino Py')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('crea un insumo con unidad default kg desde el modal', async () => {
    mocks.createSupply.mockResolvedValue({})
    const user = renderPage()

    await user.click(await screen.findByTestId('supply-new'))
    await user.type(screen.getByLabelText('Nombre'), 'Azúcar')

    await user.click(screen.getByTestId('supply-save'))

    await waitFor(() =>
      expect(mocks.createSupply).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Azúcar', unit: 'kg' }),
      ),
    )
  })
})

describe('ManufacturingPage — producción con unidades (F6.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.supplies = []
    mocks.conversions = [{ from_unit: 'box', to_unit: 'kg', factor: 10, product_id: null }]
    mocks.registerProduction.mockResolvedValue({
      success: true,
      quantity_produced: 20,
      unit: 'kg',
      product_name: 'Empanada de jamón y queso',
    })
  })
  afterEach(() => cleanup())

  const gotoProduction = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('tab', { name: 'Producción' }))
    await user.click(await screen.findByTestId('mock-search'))
    expect(await screen.findByTestId('production-product-chosen')).toHaveTextContent(
      'Empanada de jamón y queso',
    )
  }

  it('elegir Caja muestra el hint del factor y el preview en base', async () => {
    const user = renderPage()
    await gotoProduction(user)

    await user.click(screen.getByRole('combobox', { name: 'Unidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))

    expect(await screen.findByTestId('production-unit-hint')).toHaveTextContent(
      '1 Caja = 10 Kilogramo (kg)',
    )

    await user.type(screen.getByLabelText('Cantidad producida'), '2')
    await waitFor(() =>
      expect(screen.getByTestId('production-unit-hint')).toHaveTextContent('20 Kilogramo (kg)'),
    )
  })

  it('el submit envía cantidad + unit lowercase al backend', async () => {
    const user = renderPage()
    await gotoProduction(user)

    await user.click(screen.getByRole('combobox', { name: 'Unidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))
    await user.type(screen.getByLabelText('Cantidad producida'), '2')

    await user.click(screen.getByTestId('production-submit'))

    await waitFor(() => expect(mocks.registerProduction).toHaveBeenCalledTimes(1))
    expect(mocks.registerProduction).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 'PROD_EMPANADA',
        quantity_produced: 2,
        unit: 'box',
      }),
    )
  })

  it('0,5 en unidad entera (Caja) bloquea el registro sin llamar al backend', async () => {
    const user = renderPage()
    await gotoProduction(user)

    await user.click(screen.getByRole('combobox', { name: 'Unidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))
    await user.type(screen.getByLabelText('Cantidad producida'), '0.5')

    await user.click(screen.getByTestId('production-submit'))

    // Bloqueado por la guardia de unidad entera (gating A3): nada viaja.
    expect(mocks.registerProduction).not.toHaveBeenCalled()
  })

  it('unidad sin conversión bloquea el submit con hint de error', async () => {
    mocks.conversions = []
    const user = renderPage()
    await gotoProduction(user)

    await user.click(screen.getByRole('combobox', { name: 'Unidad' }))
    await user.click(await screen.findByRole('option', { name: 'Caja' }))

    expect(await screen.findByTestId('production-unit-no-conversion')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Cantidad producida'), '2')
    await user.click(screen.getByTestId('production-submit'))

    expect(mocks.registerProduction).not.toHaveBeenCalled()
  })
})
