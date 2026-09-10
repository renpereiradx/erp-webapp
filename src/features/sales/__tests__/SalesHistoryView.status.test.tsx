/**
 * Mapeo de estados del historial de ventas (SalesHistoryView).
 * El backend escribe PENDING / PAID / PARTIAL_PAYMENT / CANCELLED en
 * transactions.sales_orders (+ COMPLETED legacy): cada uno debe renderizar
 * su badge con etiqueta propia, sin caer al texto crudo del enum.
 * i18n moqueado en la frontera con la firma real (fallback español).
 * lucide-react NO se mockea. Los rows se renderizan en tabla (desktop) y
 * tarjetas (mobile): etiquetas presentes 2 veces → getAllByText.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

import { SalesHistoryView } from '@/features/sales/components/SalesHistoryView'

const noop = () => {}

const buildRow = (status: string, key: string) => ({
  internalKey: `row-${key}`,
  id: `SALE-${key}`,
  displayId: `SALE-${key}`,
  client_name: 'Cliente Test',
  total_amount: 100,
  date: '2026-09-10T12:00:00Z',
  status,
})

const renderRows = (rows: ReturnType<typeof buildRow>[]) =>
  render(
    <SalesHistoryView
      rows={rows}
      totalCount={rows.length}
      loading={false}
      error={null}
      onRetry={noop}
      historySearch=""
      onHistorySearchChange={noop}
      dateFrom=""
      onDateFromChange={noop}
      dateTo=""
      onDateToChange={noop}
      onFilter={noop}
      onLoadLatest={noop}
      onClear={noop}
      onViewSale={noop}
      onCancelSale={noop}
      canCancelSale={false}
    />,
  )

const expectBadge = (label: string) => {
  expect(screen.getAllByText(label).length).toBeGreaterThan(0)
}

afterEach(cleanup)

describe('SalesHistoryView — badges de estado', () => {
  it('mapea todos los estados de sales_orders a su etiqueta (ninguno cae al texto crudo)', () => {
    renderRows([
      buildRow('COMPLETED', 'c1'),
      buildRow('PAID', 'c2'),
      buildRow('PENDING', 'c3'),
      buildRow('PARTIAL_PAYMENT', 'c4'),
      buildRow('CANCELLED', 'c5'),
    ])

    expectBadge('Completada')
    expectBadge('Pagada')
    expectBadge('Pendiente')
    expectBadge('Pago parcial')
    expectBadge('Cancelada')
  })

  it('un estado desconocido muestra el valor crudo, sin crash', () => {
    renderRows([buildRow('REFUNDED', 'x')])

    expectBadge('REFUNDED')
  })
})
