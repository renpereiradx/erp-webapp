// ===========================================================================
// Tests de PaymentMethodGrid (patrón compartido de wizards §6.9).
// Grilla de tarjetas con hotkeys [1..9]: selección sin mouse, guard de campos
// de texto y semántica radiogroup. i18n mockeado.
// ===========================================================================

import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

import { PaymentMethodGrid } from '../PaymentMethodGrid'

const methods = [
  { id: 1, name: 'Efectivo' },
  { id: 2, name: 'Tarjeta de Crédito' },
  { id: 3, name: 'Transferencia Bancaria' },
]

afterEach(cleanup)

const renderGrid = (overrides: Partial<Parameters<typeof PaymentMethodGrid>[0]> = {}) => {
  const onSelect = vi.fn()
  const props = {
    methods,
    selectedId: '1',
    onSelect,
    labelledbyId: 'test-method-label',
    ...overrides,
  }
  render(
    <>
      <span id="test-method-label">Método de pago</span>
      <PaymentMethodGrid {...props} />
    </>,
  )
  return { onSelect }
}

describe('PaymentMethodGrid — grilla de métodos de pago (§6.9)', () => {
  it('renderiza un radio por método con su hotkey [n]', () => {
    renderGrid()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveTextContent('[1]')
    expect(radios[0]).toHaveTextContent('Efectivo')
    expect(radios[2]).toHaveTextContent('[3]')
  })

  it('marca aria-checked en el método seleccionado', () => {
    renderGrid({ selectedId: '2' })
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'false')
  })

  it('click selecciona el método (id como string)', () => {
    const { onSelect } = renderGrid({ selectedId: '' })
    fireEvent.click(screen.getByTestId('payment-method-3'))
    expect(onSelect).toHaveBeenCalledWith('3')
  })

  it('hotkey 1..9 selecciona el método de esa posición', () => {
    const { onSelect } = renderGrid({ selectedId: '' })
    fireEvent.keyDown(window, { key: '3' })
    expect(onSelect).toHaveBeenCalledWith('3')
  })

  it('hotkey fuera de rango (0, 9+ cuando hay 3 métodos) no selecciona', () => {
    const { onSelect } = renderGrid({ selectedId: '' })
    fireEvent.keyDown(window, { key: '0' })
    fireEvent.keyDown(window, { key: '4' })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('hotkey ignorado cuando el foco está en un input', () => {
    const { onSelect } = renderGrid({ selectedId: '' })
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: '2' })
    expect(onSelect).not.toHaveBeenCalled()
    input.remove()
  })

  it('hotkey ignorado con un dropdown (listbox) abierto bajo el foco', () => {
    const { onSelect } = renderGrid({ selectedId: '' })
    const option = document.createElement('div')
    option.setAttribute('role', 'option')
    document.body.appendChild(option)
    option.focus()
    fireEvent.keyDown(option, { key: '2' })
    expect(onSelect).not.toHaveBeenCalled()
    option.remove()
  })

  it('sin métodos muestra el mensaje de vacío y nada es seleccionable', () => {
    renderGrid({ methods: [] })
    expect(screen.getByText('No hay métodos de pago disponibles')).toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })

  it('usa labelFor cuando se provee (ej. label del API de compras)', () => {
    renderGrid({ labelFor: (m: any) => `API ${m.name}` })
    expect(screen.getAllByRole('radio')[0]).toHaveTextContent('API Efectivo')
  })
})
