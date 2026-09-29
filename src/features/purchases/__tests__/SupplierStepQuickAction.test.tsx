/**
 * SupplierStep — acción rápida "Nuevo proveedor" del wizard de compras.
 *
 * Contrato UI (espejo de ClientStep en ventas):
 * - Con `parties:write`/`suppliers:write`: el botón abre QuickSupplierModal.
 * - Sin permisos: el botón no renderiza (WithPermission fail-closed).
 * - Al crear (`onCreated` con proveedor con id): se cierra el modal y se
 *   autoselecciona vía onSupplierSelect para continuar el checkout sin salir
 *   del wizard.
 *
 * QuickSupplierModal se mockea (frontera del módulo consumido): su unidad ya
 * está cubierta por QuickSupplierModal.test.tsx. lucide-react NO se mockea.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { createRef } from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import { SupplierStep } from '../components/steps/SupplierStep'

const quickModalMock = vi.hoisted(() => ({
  onCreated: vi.fn() as (supplier: any) => void,
}))

vi.mock('@/features/party/components/QuickSupplierModal', () => ({
  default: ({ isOpen, onCreated }: { isOpen: boolean; onCreated: (s: any) => void }) => {
    quickModalMock.onCreated = onCreated
    return isOpen ? (
      <div data-testid="quick-supplier-modal-stub">quick-supplier-stub</div>
    ) : null
  },
}))

const baseProps = () => ({
  selectedSupplier: null as any,
  supplierSearch: '',
  setSupplierSearch: vi.fn(),
  supplierResults: [] as any[],
  searchingSuppliers: false,
  showSupplierDropdown: false,
  setShowSupplierDropdown: vi.fn(),
  activeSupplierIndex: -1,
  setActiveSupplierIndex: vi.fn(),
  onSupplierSelect: vi.fn(),
  onClearSupplier: vi.fn(),
  onSearchKeyDown: vi.fn(),
  searchRef: createRef<HTMLDivElement>(),
  getSupplierName: (s: any) => s?.first_name || s?.name || '',
})

const renderStep = (allowed = true, props: Partial<ReturnType<typeof baseProps>> = {}) => {
  const authValue = {
    hasPermission: vi.fn(() => allowed),
    hasAnyPermission: vi.fn(() => allowed),
  }
  render(
    <AuthContext.Provider value={authValue as any}>
      <SupplierStep {...baseProps()} {...props} />
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('SupplierStep — acción rápida Nuevo proveedor', () => {
  it('muestra el botón y abre QuickSupplierModal al hacer click', () => {
    renderStep(true)

    fireEvent.click(screen.getByRole('button', { name: /Nuevo proveedor/i }))
    expect(screen.getByTestId('quick-supplier-modal-stub')).toBeTruthy()
  })

  it('al crear: cierra el modal y autoselecciona vía onSupplierSelect', () => {
    const onSupplierSelect = vi.fn()
    renderStep(true, { onSupplierSelect })

    fireEvent.click(screen.getByRole('button', { name: /Nuevo proveedor/i }))
    const created = { id: 'S9', first_name: 'Proveedor Test', tax_id: '80012345-6' }

    act(() => quickModalMock.onCreated(created))

    expect(onSupplierSelect).toHaveBeenCalledTimes(1)
    expect(onSupplierSelect).toHaveBeenCalledWith(created)
    // El paso cerró el modal tras la creación.
    expect(screen.queryByTestId('quick-supplier-modal-stub')).toBeNull()
  })

  it('sin permisos de escritura el botón no renderiza (fail-closed)', () => {
    renderStep(false)
    expect(screen.queryByRole('button', { name: /Nuevo proveedor/i })).toBeNull()
    expect(screen.queryByTestId('quick-supplier-modal-stub')).toBeNull()
  })
})
