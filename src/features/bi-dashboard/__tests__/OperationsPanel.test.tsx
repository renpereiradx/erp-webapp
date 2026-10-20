import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { DashboardSummary } from '@/types/bi'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (
      key: string,
      fallbackOrVars?: string | Record<string, unknown>,
      maybeVars?: Record<string, unknown>,
    ) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : undefined
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null
          ? fallbackOrVars
          : maybeVars) ?? {}
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? `{${name}}`),
      )
    },
  }),
}))

import { OperationsPanel } from '../components/OperationsPanel'

const SUMMARY: DashboardSummary = {
  sales: { total: 0, count: 0, average_ticket: 0, currency: 'PYG' },
  purchases: { total: 0, count: 0, currency: 'PYG' },
  profit: { gross: 0, margin_percentage: 0 },
  inventory: {
    total_products: 18,
    low_stock_count: 5,
    out_of_stock_count: 1,
    total_value: 13377100,
  },
  cash_registers: { open_count: 1, total_balance: 337265 },
  receivables: { total_pending: 315250, overdue_count: 13 },
  payables: { total_pending: 6414250, due_this_week: 1200000 },
  reserves: { today_count: 1, pending_confirmation: 1 },
}

describe('OperationsPanel (F2 UX)', () => {
  it('renderiza los 5 indicadores como ledger con valores completos', () => {
    render(<OperationsPanel summary={SUMMARY} />)

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Inventario',
      'Caja',
      'Cuentas por cobrar',
      'Cuentas por pagar',
      'Reservas hoy',
    ])

    expect(screen.getByTestId('operation-inventory')).toHaveTextContent('Gs. 13.377.100')
    expect(screen.getByTestId('operation-cash')).toHaveTextContent('Gs. 337.265')
    expect(screen.getByTestId('operation-receivables')).toHaveTextContent('Gs. 315.250')
    expect(screen.getByTestId('operation-payables')).toHaveTextContent('Gs. 6.414.250')
    expect(screen.getByTestId('operation-reserves')).toHaveTextContent('Reservas hoy')
  })

  it('usa hints label:valor (evita "1 cajas abiertas" y "1 cuentas vencidas")', () => {
    render(<OperationsPanel summary={SUMMARY} />)

    expect(screen.getByText('Bajo stock: 5 · Sin stock: 1')).toBeInTheDocument()
    expect(screen.getByText('Cajas abiertas: 1')).toBeInTheDocument()
    expect(screen.getByText('Cuentas vencidas: 13')).toBeInTheDocument()
    expect(screen.getByText('Vence esta semana: Gs. 1.200.000')).toBeInTheDocument()
    expect(screen.getByText('Por confirmar: 1')).toBeInTheDocument()
  })

  it('expone una sola lista semántica con 5 filas', () => {
    render(<OperationsPanel summary={SUMMARY} />)

    expect(screen.getByTestId('dashboard-operations-list').tagName).toBe('DL')
    expect(screen.getAllByRole('term')).toHaveLength(5)
    expect(screen.getAllByTestId(/^operation-/)).toHaveLength(5)
  })
})
