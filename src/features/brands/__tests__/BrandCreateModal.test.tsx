/**
 * BrandCreateModal — alta rápida de marca desde el formulario de productos.
 *
 * Reemplaza al window.prompt nativo: modal propio del design system con
 * validación Zod (límites espejo del backend: name max=150, description
 * max=500) y autoselección vía onCreated.
 *
 * El servicio se mockea en la frontera del módulo consumido
 * (@/services/brandService): el modal solo usa brandService.create.
 * i18n: fakeT global del vitest.setup — resuelve los fallbacks en español
 * que pasan los componentes, así que los asserts usan esas cadenas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrandCreateModal } from '../components/BrandCreateModal'

const brandServiceMock = vi.hoisted(() => ({
  create: vi.fn(),
}))

vi.mock('@/services/brandService', () => ({
  brandService: brandServiceMock,
}))

const renderModal = (props: Partial<Parameters<typeof BrandCreateModal>[0]> = {}) => {
  const onClose = vi.fn()
  const onCreated = vi.fn()
  render(<BrandCreateModal isOpen={true} onClose={onClose} onCreated={onCreated} {...props} />)
  return { onClose, onCreated }
}

describe('BrandCreateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enfoca el campo Nombre al abrir', async () => {
    renderModal()
    // EnhancedModal enfoca el contenedor en su propio efecto; el modal
    // re-enfoca el input con un tick de 60ms.
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByLabelText(/Nombre de la marca/i)),
    )
  })

  it('valida el nombre obligatorio y no llama al servicio', async () => {
    const { onCreated } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: /Crear marca/i }))

    await waitFor(() =>
      expect(screen.getByText(/El nombre de la marca es obligatorio/i)).toBeTruthy(),
    )
    expect(brandServiceMock.create).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('valida el límite de 150 caracteres del backend', async () => {
    renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre de la marca/i), {
      target: { value: 'x'.repeat(151) },
    })
    fireEvent.click(screen.getByRole('button', { name: /Crear marca/i }))

    await waitFor(() =>
      expect(screen.getByText(/no puede exceder 150 caracteres/i)).toBeTruthy(),
    )
    expect(brandServiceMock.create).not.toHaveBeenCalled()
  })

  it('crea la marca y notifica onCreated con id y nombre', async () => {
    brandServiceMock.create.mockResolvedValueOnce({
      id: 42,
      name: 'Logitech',
      slug: 'logitech',
      isActive: true,
    })

    const { onCreated } = renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre de la marca/i), {
      target: { value: 'Logitech' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Crear marca/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    // description vacía se omite del payload (validator omitempty del backend).
    expect(brandServiceMock.create).toHaveBeenCalledWith({ name: 'Logitech' })
    expect(onCreated).toHaveBeenCalledWith({ id: 42, name: 'Logitech' })
  })

  it('envía la descripción solo cuando tiene contenido', async () => {
    brandServiceMock.create.mockResolvedValueOnce({ id: 7, name: 'Genius' })

    renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre de la marca/i), {
      target: { value: 'Genius' },
    })
    fireEvent.change(screen.getByLabelText(/Descripción \(opcional\)/i), {
      target: { value: 'Periféricos' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Crear marca/i }))

    await waitFor(() =>
      expect(brandServiceMock.create).toHaveBeenCalledWith({
        name: 'Genius',
        description: 'Periféricos',
      }),
    )
  })

  it('muestra el mensaje del backend cuando create falla y no notifica onCreated', async () => {
    brandServiceMock.create.mockRejectedValueOnce({
      response: { data: { error: { code: 'REQUEST_ERROR', message: 'La marca ya existe' } } },
    })

    const { onCreated } = renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre de la marca/i), {
      target: { value: 'Logitech' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Crear marca/i }))

    await waitFor(() => expect(screen.getByText(/La marca ya existe/i)).toBeTruthy())
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('muestra el error genérico cuando el fallo no trae mensaje del backend', async () => {
    brandServiceMock.create.mockRejectedValueOnce(new Error('Network Error'))

    renderModal()

    fireEvent.change(screen.getByLabelText(/Nombre de la marca/i), {
      target: { value: 'Logitech' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Crear marca/i }))

    await waitFor(() =>
      expect(screen.getByText(/No se pudo crear la marca/i)).toBeTruthy(),
    )
  })

  it('Escape cierra el modal sin crear marca', () => {
    const { onClose } = renderModal()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(brandServiceMock.create).not.toHaveBeenCalled()
  })
})
