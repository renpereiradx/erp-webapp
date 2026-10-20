import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { RecentActivityItem } from '@/types/bi'

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

import { ActivityPanel } from '../components/ActivityPanel'

const ACTIVITIES: RecentActivityItem[] = [
  {
    id: 'a1',
    type: 'sale',
    description: 'Venta #SALE-1 · Erika Maciel',
    amount: 120000,
    user: 'ADMINISTRADOR ADMINISTRADOR',
    timestamp: '2026-10-20T12:00:00Z',
  },
  {
    id: 'a2',
    type: 'payment',
    description: 'Pago recibido - Venta #SALE-1',
    amount: 0,
    user: 'Oscar Flores',
    timestamp: '2026-10-20T13:00:00Z',
  },
  {
    id: 'a3',
    type: 'refund',
    description: 'Devolución de venta',
    amount: 5000,
    user: 'Juan Pérez',
    timestamp: '2026-10-19T10:00:00Z',
  },
]

describe('ActivityPanel (F2 UX)', () => {
  it('renderiza descripción, tipo, actor normalizado, tiempo y monto', () => {
    const { container } = render(<ActivityPanel activities={ACTIVITIES} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Venta #SALE-1 · Erika Maciel')).toBeInTheDocument()
    expect(screen.getByText('Gs. 120.000')).toBeInTheDocument()

    // El backend manda first_name + last_name; si coinciden, se colapsa.
    expect(screen.getByText('ADMINISTRADOR')).toBeInTheDocument()
    expect(screen.queryByText('ADMINISTRADOR ADMINISTRADOR')).toBeNull()

    // Tipo conocido y fallback para tipos nuevos.
    expect(screen.getByText('Venta')).toBeInTheDocument()
    expect(screen.getByText('Pago')).toBeInTheDocument()
    expect(screen.getByText('Otro')).toBeInTheDocument()

    // Timestamp semántico.
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-10-20T12:00:00Z',
    )
  })

  it('mantiene la columna de importe con "—" cuando el movimiento no tiene monto', () => {
    render(<ActivityPanel activities={ACTIVITIES} />)

    expect(screen.getByLabelText('Sin importe')).toHaveTextContent('—')
  })

  it('muestra un empty state con dirección, no solo un texto suelto', () => {
    render(<ActivityPanel activities={[]} />)

    expect(screen.getByText('Sin actividad reciente.')).toBeInTheDocument()
    expect(
      screen.getByText('Los movimientos de ventas, compras y pagos van a aparecer acá.'),
    ).toBeInTheDocument()
  })
})
