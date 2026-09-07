/**
 * ProductsTable — contract tests.
 * Reemplaza a ProductGrid.a11y / ProductGrid.keyboard / inlineEdit (los
 * componentes ProductGrid y ProductCard se retiraron con la migración
 * Feature-Sliced; el listado hoy es una tabla accesible).
 *
 * Contrato accesible: tabla con encabezados, nombre de producto clicable
 * (detalles), botón de edición con aria-label y data-testid por producto.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductsTable } from '../ProductsTable'
import type { ProductEnriched } from '@/domain/products/models'

// Patrón i18n canónico para tests: respeta t(key, defaultValue?, vars?) y
// resuelve con el fallback en español (o la key si no hay fallback).
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: any, vars?: any) => {
      const hasVars = typeof fallback === 'object' && fallback !== null
      let template = hasVars ? key : (fallback || key)
      const v: any = hasVars ? fallback : vars
      if (v) {
        template = template.replace(/\{(\w+)\}/g, (_: string, k: string) =>
          v[k] !== undefined ? String(v[k]) : `{${k}}`)
      }
      return template
    },
  }),
}))

// PLAN_CATALOGO_VENDEDOR 3.4: la tabla gatea costo/margen tras useAuth;
// por defecto las pruebas ven la tabla completa (hasPermission → true).
const mockHasPermission = vi.fn<(permission: string) => boolean>(() => true)
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ hasPermission: (permission: string) => mockHasPermission(permission) }),
}))

const makeProduct = (overrides: Partial<ProductEnriched> = {}): ProductEnriched => ({
  id: 'p1',
  name: 'Cerveza Stout',
  category_name: 'Bebidas',
  stock_quantity: 99,
  price: 15000,
  purchase_price: 9000,
  state: true,
  ...overrides,
} as ProductEnriched)

describe('ProductsTable', () => {
  it('renderiza una fila por producto con nombre, categoría y estado', () => {
    render(
      <ProductsTable
        products={[makeProduct(), makeProduct({ id: 'p2', name: 'Vino Tinto', category_name: 'Vinos' })]}
        onOpenDetailsModal={vi.fn()}
        onOpenEditModal={vi.fn()}
      />
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThanOrEqual(7)
    expect(screen.getByText('Cerveza Stout')).toBeInTheDocument()
    expect(screen.getByText('Vino Tinto')).toBeInTheDocument()
    expect(screen.getAllByText('Bebidas')).toHaveLength(1)
    expect(screen.getAllByText('Disponible')).toHaveLength(2)
  })

  it('expone el botón de edición con nombre accesible y testid por producto', () => {
    const onOpenEditModal = vi.fn()

    render(
      <ProductsTable
        products={[makeProduct()]}
        onOpenDetailsModal={vi.fn()}
        onOpenEditModal={onOpenEditModal}
      />
    )

    const editButton = screen.getByTestId('edit-product-p1')
    expect(editButton).toHaveAccessibleName(/editar/i)

    fireEvent.click(editButton)
    expect(onOpenEditModal).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }))
  })

  it('abre detalles al hacer click en el nombre del producto', () => {
    const onOpenDetailsModal = vi.fn()

    render(
      <ProductsTable
        products={[makeProduct()]}
        onOpenDetailsModal={onOpenDetailsModal}
        onOpenEditModal={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('Cerveza Stout'))
    expect(onOpenDetailsModal).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }))
  })

  it('marca como no disponible el producto con state=false', () => {
    render(
      <ProductsTable
        products={[makeProduct({ id: 'p3', name: 'Producto Retirado', state: false })]}
        onOpenDetailsModal={vi.fn()}
        onOpenEditModal={vi.fn()}
      />
    )

    expect(screen.getByText('No Disponible')).toBeInTheDocument()
  })

  // PLAN_CATALOGO_VENDEDOR 3.4: sin products:cost la columna de costo y el
  // chip de margen no se renderizan (defensa en profundidad del strip server-side).
  it('oculta la columna de costo y el margen sin products:cost', () => {
    mockHasPermission.mockImplementation((permission: string) => permission !== 'products:cost')

    render(
      <ProductsTable
        products={[makeProduct()]}
        onOpenDetailsModal={vi.fn()}
        onOpenEditModal={vi.fn()}
      />
    )

    expect(screen.queryByText('Costo de Compra')).not.toBeInTheDocument()
    expect(screen.queryByText(/marg\./)).not.toBeInTheDocument()
    // Nombre, categoría, IVA, stock, precio, estado (6 columnas visibles).
    // Producto, categoría, IVA, stock, precio, estado, acciones.
    expect(screen.getAllByRole('columnheader').length).toBe(7)
  })

  it('muestra el chip de margen solo con products:cost', () => {
    mockHasPermission.mockImplementation(() => true)
    render(
      <ProductsTable
        products={[makeProduct()]}
        onOpenDetailsModal={vi.fn()}
        onOpenEditModal={vi.fn()}
      />
    )

    expect(screen.getByText('Costo de Compra')).toBeInTheDocument()
    expect(screen.getByText(/marg\./)).toBeInTheDocument()
  })
})
