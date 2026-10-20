import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { DashboardTrends } from '@/types/bi'

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

import { TrendsPanel } from '../components/TrendsPanel'

const TRENDS: DashboardTrends = {
  sales: {
    current: 1475500,
    previous: 931035,
    change_amount: 544465,
    change_percentage: 58.5,
    trend: 'up',
  },
  purchases: {
    current: 275000,
    previous: 2916950,
    change_amount: -2641950,
    change_percentage: -90.6,
    trend: 'down',
  },
  gross_margin: {
    current: 52.4,
    previous: 48.1,
    change_amount: 4.3,
    change_percentage: 8.9,
    trend: 'up',
  },
  average_ticket: {
    current: 245917,
    previous: 116379,
    change_amount: 129538,
    change_percentage: 111.3,
    trend: 'up',
  },
  customer_count: {
    current: 8,
    previous: 5,
    change_amount: 3,
    change_percentage: 60,
    trend: 'up',
  },
}

describe('TrendsPanel (F2 UX)', () => {
  it('renderiza 3 métricas en lista con actual, anterior y variación', () => {
    render(<TrendsPanel trends={TRENDS} />)

    expect(screen.getAllByTestId(/^trend-/)).toHaveLength(3)

    const sales = screen.getByTestId('trend-sales')
    expect(within(sales).getByText('Gs. 1.475.500')).toBeInTheDocument()
    expect(within(sales).getByText('Gs. 931.035')).toBeInTheDocument()
    expect(within(sales).getByText(/Anterior/)).toBeInTheDocument()
    expect(within(sales).getByText('58,5%')).toBeInTheDocument()

    const ticket = screen.getByTestId('trend-average_ticket')
    expect(within(ticket).getByText('Gs. 245.917')).toBeInTheDocument()
    expect(within(ticket).getByText('111,3%')).toBeInTheDocument()
  })

  it('no usa tabla de 4 columnas (causa del wrap Gs./cifra)', () => {
    const { container } = render(<TrendsPanel trends={TRENDS} />)
    expect(container.querySelector('table')).toBeNull()
  })

  it('muestra el empty honesto sin comparación', () => {
    render(<TrendsPanel trends={undefined} />)
    expect(
      screen.getByText('Sin comparación disponible para el período.'),
    ).toBeInTheDocument()
  })
})
