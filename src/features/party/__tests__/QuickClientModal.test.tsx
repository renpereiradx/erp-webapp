/**
 * QuickClientModal — regresión de stacking + flujo de registro rápido.
 *
 * Bug: el modal se abre apilado dentro del SaleCheckoutWizard (overlay
 * z-[150]) pero EnhancedModal monta su overlay en z-50 → el modal quedaba
 * DETRÁS del wizard y el botón "Nuevo cliente" parecía muerto. El fix pasa
 * overlayClassName="!z-[200]" (important gana sobre la clase base z-50).
 *
 * El store de clientes se mockea en la frontera del módulo consumido
 * (useClientStore): el modal solo usa createClient + normalizeClient.
 * i18n: se usa el fakeT global del vitest.setup (fallbacks en español).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickClientModal from '../components/QuickClientModal'

const storeMock = vi.hoisted(() => ({
  createClient: vi.fn(),
  normalizeClient: vi.fn((c: Record<string, unknown>) => ({
    ...c,
    displayName: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
  })),
}))

vi.mock('@/store/useClientStore', () => ({
  default: () => storeMock,
  normalizeClient: storeMock.normalizeClient,
}))

const renderModal = (props: Partial<Parameters<typeof QuickClientModal>[0]> = {}) => {
  const onClose = vi.fn()
  const onCreated = vi.fn()
  render(
    <QuickClientModal isOpen={true} onClose={onClose} onCreated={onCreated} {...props} />,
  )
  return { onClose, onCreated }
}

describe('QuickClientModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('apila el overlay por encima del wizard de checkout (clase !z-[200])', () => {
    renderModal()
    // El wizard de venta usa overlay z-[150]; sin el fix el overlay queda en
    // z-50. La clase es el contrato de stacking (jsdom no aplica Tailwind,
    // así que se aserta su presencia, no el computed style).
    expect(screen.getByTestId('quick-client-modal-overlay').className).toContain('!z-[200]')
  })

  it('crea el cliente y notifica onCreated con el cliente normalizado', async () => {
    const created = { id: 'P1', first_name: 'Maria', last_name: 'Perez' }
    storeMock.createClient.mockResolvedValueOnce({ success: true, data: created })

    const { onCreated } = renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Maria' } })
    fireEvent.change(screen.getByLabelText(/Apellido/i), { target: { value: 'Perez' } })
    fireEvent.change(screen.getByLabelText(/Número de documento/i), {
      target: { value: '1234567' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Registrar cliente/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(storeMock.createClient).toHaveBeenCalledWith({
      first_name: 'Maria',
      last_name: 'Perez',
      document_type: 'CI',
      document_id: '1234567',
    })
  })

  it('Escape cierra el modal sin crear cliente', () => {
    const { onClose } = renderModal()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(storeMock.createClient).not.toHaveBeenCalled()
  })

  it('muestra el error del backend cuando createClient falla', async () => {
    storeMock.createClient.mockResolvedValueOnce({
      success: false,
      error: 'El documento ya está registrado',
    })

    renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Maria' } })
    fireEvent.change(screen.getByLabelText(/Apellido/i), { target: { value: 'Perez' } })
    fireEvent.change(screen.getByLabelText(/Número de documento/i), {
      target: { value: '1234567' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Registrar cliente/i }))

    expect(await screen.findByText(/El documento ya está registrado/)).toBeTruthy()
  })
})
