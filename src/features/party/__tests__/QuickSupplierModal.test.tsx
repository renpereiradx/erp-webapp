/**
 * QuickSupplierModal — regresión de stacking + flujo de registro rápido.
 *
 * Espejo de QuickClientModal para el paso de proveedor del
 * PurchaseCheckoutWizard: el modal se abre apilado dentro del wizard
 * (overlay z-[150]) pero EnhancedModal monta su overlay en z-50 → sin
 * overlayClassName="!z-[200]" el modal queda DETRÁS y el botón
 * "Nuevo proveedor" parece muerto.
 *
 * El store de proveedores se mockea en la frontera del módulo consumido
 * (useSupplierDirectoryStore): el modal solo usa createSupplier +
 * refreshAfterMutation. i18n: fakeT global del vitest.setup (locales reales es).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickSupplierModal from '../components/QuickSupplierModal'

const storeMock = vi.hoisted(() => ({
  createSupplier: vi.fn(),
  refreshAfterMutation: vi.fn(),
}))

vi.mock('@/store/useSupplierDirectoryStore', () => ({
  default: () => storeMock,
}))

const renderModal = (props: Partial<Parameters<typeof QuickSupplierModal>[0]> = {}) => {
  const onClose = vi.fn()
  const onCreated = vi.fn()
  render(
    <QuickSupplierModal isOpen={true} onClose={onClose} onCreated={onCreated} {...props} />,
  )
  return { onClose, onCreated }
}

describe('QuickSupplierModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeMock.refreshAfterMutation.mockResolvedValue(undefined)
  })

  it('apila el overlay por encima del wizard de checkout (clase !z-[200])', () => {
    renderModal()
    // El wizard de compra usa overlay z-[150]; sin el fix el overlay queda en
    // z-50. La clase es el contrato de stacking (jsdom no aplica Tailwind,
    // así que se aserta su presencia, no el computed style).
    expect(screen.getByTestId('quick-supplier-modal-overlay').className).toContain('!z-[200]')
  })

  it('crea el proveedor y notifica onCreated con el proveedor autoseleccionable', async () => {
    storeMock.createSupplier.mockResolvedValueOnce({
      success: true,
      data: { id: 'S1', first_name: 'Distribuciones del Pacífico' },
    })

    const { onCreated } = renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre del proveedor/i), {
      target: { value: 'Distribuciones del Pacífico' },
    })
    fireEvent.change(screen.getByLabelText(/RUC \/ Tax ID/i), {
      target: { value: '80012345-6' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Registrar proveedor/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    const created = onCreated.mock.calls[0][0]
    expect(created.id).toBe('S1')
    expect(created.name).toBe('Distribuciones del Pacífico')
    expect(created.first_name).toBe('Distribuciones del Pacífico')
    expect(created.tax_id).toBe('80012345-6')
    expect(created.taxId).toBe('80012345-6')
    expect(storeMock.createSupplier).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Distribuciones del Pacífico',
        tax_id: '80012345-6',
      }),
    )
  })

  it('valida los campos obligatorios y no llama a createSupplier', async () => {
    const { onCreated } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: /Registrar proveedor/i }))

    await waitFor(() =>
      expect(screen.getByText(/El nombre es obligatorio/i)).toBeTruthy(),
    )
    expect(storeMock.createSupplier).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('Escape cierra el modal sin crear proveedor', () => {
    const { onClose } = renderModal()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(storeMock.createSupplier).not.toHaveBeenCalled()
  })

  it('muestra el error del backend cuando createSupplier falla', async () => {
    storeMock.createSupplier.mockResolvedValueOnce({
      success: false,
      error: 'El RUC ya está registrado',
    })

    renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre del proveedor/i), {
      target: { value: 'Distribuciones del Pacífico' },
    })
    fireEvent.change(screen.getByLabelText(/RUC \/ Tax ID/i), {
      target: { value: '80012345-6' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Registrar proveedor/i }))

    expect(await screen.findByText(/El RUC ya está registrado/)).toBeTruthy()
  })
})
