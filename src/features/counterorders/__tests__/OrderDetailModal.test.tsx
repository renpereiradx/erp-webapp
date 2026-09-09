// ===========================================================================
// Tests del modal de detalle (FASE 2.1 + audit C2): la degradación por ítem
// (price_warning/tax_warning) se muestra como advertencia y la etiqueta del
// total aclara que excluye las líneas sin precio resuelto.
// Mocks en la frontera: i18n con la firma real t(key, fallback, vars).
// ===========================================================================

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CounterOrderDetail, ResolvedCounterOrderItem } from '../types'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

import { OrderDetailModal } from '../components/OrderDetailModal'

const resolvedItem = (overrides: Partial<ResolvedCounterOrderItem>): ResolvedCounterOrderItem => ({
  id: 1,
  product_id: 'PROD-1',
  variant_id: null,
  quantity: 2,
  unit: 'unit',
  notes: null,
  product_name: 'Coca 2L',
  stock_available: 10,
  stock_warning: false,
  unit_price: 15000,
  tax_rate_id: null,
  tax_rate_code: 'IVA-10',
  tax_rate: 10,
  unit_price_with_tax: 15000,
  unit_price_without_tax: 13636,
  tax_amount: 1364,
  line_total: 30000,
  ...overrides,
})

const detail = (items: ResolvedCounterOrderItem[], total: number): CounterOrderDetail => ({
  id: 'CO-1',
  code: 'PED-ABC234',
  client_id: 'CLIENT-1',
  branch_id: 1,
  status: 'OPEN',
  notes: null,
  created_by: 'user-vendor',
  claimed_by: null,
  claimed_at: null,
  converted_sale_id: null,
  converted_at: null,
  cancelled_reason: null,
  cancelled_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  client_name: 'Juan Pérez',
  created_by_name: 'Vendedor Uno',
  claimed_by_name: null,
  items,
  total,
})

const renderModal = (d: CounterOrderDetail | null) =>
  render(<OrderDetailModal open detail={d} isLoading={false} summary={null} onClose={() => {}} />)

afterEach(() => cleanup())

describe('OrderDetailModal — degradación por ítem (audit C2)', () => {
  it('muestra la advertencia de precio y ajusta la etiqueta del total', () => {
    renderModal(
      detail(
        [
          resolvedItem({
            price_warning: 'el producto PROD-1 no tiene precio vigente para la unidad unit',
            unit_price: 0,
            unit_price_with_tax: 0,
            line_total: 0,
          }),
        ],
        0,
      ),
    )
    expect(screen.getByTestId('counterorder-item-warning-1')).toHaveTextContent(/precio vigente/)
    expect(screen.getByTestId('counterorder-detail-total')).toBeInTheDocument()
    expect(screen.getByText('Total estimado (excluye ítems con advertencia)')).toBeInTheDocument()
  })

  it('muestra la advertencia de IVA cuando falló la liquidación', () => {
    renderModal(
      detail(
        [resolvedItem({ tax_warning: 'no se pudo calcular el IVA; el total no lo incluye', line_total: 0 })],
        0,
      ),
    )
    expect(screen.getByTestId('counterorder-item-warning-1')).toHaveTextContent(/IVA/)
  })

  it('sin advertencias mantiene la etiqueta de total normal y no renderiza filas de advertencia', () => {
    renderModal(detail([resolvedItem({})], 30000))
    expect(screen.queryByTestId('counterorder-item-warning-1')).not.toBeInTheDocument()
    expect(screen.getByText('Total estimado (precios de hoy)')).toBeInTheDocument()
  })
})
