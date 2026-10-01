// ===========================================================================
// Tests del badge de stock en el carrito (FASE 5 — stock visible en caja).
// Ítems de un pedido de mostrador viajan con `stock` resuelto al leer; si ya
// no alcanza, la fila lo marca antes del error del checkout. i18n mockeado.
// ===========================================================================

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

import { SalesCartGrid } from '../components/SalesCartGrid'

const baseItem = {
  id: 'item-1',
  productId: 'PROD-1',
  name: 'Coca 2L',
  quantity: 2,
  unit: 'unit',
  price: 91000,
  originalPrice: 91000,
  discount: 0,
  isFromPendingSale: false,
}

const noopProps = {
  onEditItem: vi.fn(),
  onRemoveItem: vi.fn(),
  getItemBaseUnitPrice: () => 91000,
  getItemLineDiscount: () => 0,
  getItemLineTotal: () => 182000,
}

afterEach(cleanup)

describe('SalesCartGrid — badge de stock (FASE 5)', () => {
  // El grid renderiza dos vistas en el DOM (tabla desktop + tarjetas móviles):
  // el badge aparece una vez en cada una → getAllByTestId.
  it('stock 0 < cantidad → badge Sin stock', () => {
    render(<SalesCartGrid items={[{ ...baseItem, stock: 0 }]} {...noopProps} />)
    const badges = screen.getAllByTestId('sales-cart-stock-item-1')
    expect(badges.length).toBeGreaterThanOrEqual(1)
    for (const badge of badges) expect(badge).toHaveTextContent('Sin stock')
  })

  it('stock menor que la cantidad → badge Stock insuficiente con el disponible', () => {
    render(<SalesCartGrid items={[{ ...baseItem, stock: 1 }]} {...noopProps} />)
    const badges = screen.getAllByTestId('sales-cart-stock-item-1')
    for (const badge of badges) expect(badge).toHaveTextContent('Stock insuficiente: 1')
  })

  it('stock suficiente o sin dato → sin badge', () => {
    render(
      <SalesCartGrid
        items={[{ ...baseItem, stock: 10 }, { ...baseItem, id: 'item-2', productId: 'P2', name: 'Sin dato' }]}
        {...noopProps}
      />,
    )
    expect(screen.queryByTestId('sales-cart-stock-item-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sales-cart-stock-item-2')).not.toBeInTheDocument()
  })
})

describe('SalesCartGrid — columna SKU universal (ANALYSIS_UUID_SKU_PRODUCTS F3)', () => {
  it('muestra el sku de la unidad vendible y el header SKU', () => {
    render(<SalesCartGrid items={[{ ...baseItem, sku: 'COC-2L' }]} {...noopProps} />)
    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getAllByText('COC-2L').length).toBeGreaterThanOrEqual(1)
  })

  it('sin sku (venta pendiente vieja) cae al id de producto', () => {
    render(<SalesCartGrid items={[baseItem]} {...noopProps} />)
    expect(screen.getAllByText('PROD-1').length).toBeGreaterThanOrEqual(1)
  })
})

describe('SalesCartGrid — selección persistente (navegación ↑↓ del POS)', () => {
  // La selección alimenta Alt+Q/Alt+X: salir de la fila con el mouse NO la
  // limpia (los atajos siempre tienen un ítem al que operar).
  it('mouse enter selecciona la fila y mouse leave NO la limpia', () => {
    const onActiveItemChange = vi.fn()
    render(
      <SalesCartGrid
        items={[baseItem]}
        {...noopProps}
        activeItemId="item-1"
        onActiveItemChange={onActiveItemChange}
      />,
    )
    const row = screen.getByTestId('sales-cart-row-item-1')
    fireEvent.mouseEnter(row)
    expect(onActiveItemChange).toHaveBeenLastCalledWith('item-1')
    fireEvent.mouseLeave(row)
    expect(onActiveItemChange).not.toHaveBeenCalledWith(null)
  })

  it('filas accionables y de ventas procesadas exponen testid para ↑↓', () => {
    render(
      <SalesCartGrid
        items={[baseItem, { ...baseItem, id: 'item-2', productId: 'P2', name: 'Procesada', isFromPendingSale: true }]}
        {...noopProps}
      />,
    )
    expect(screen.getByTestId('sales-cart-row-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('sales-cart-row-item-2')).toBeInTheDocument()
  })
})
