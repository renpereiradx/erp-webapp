// ===========================================================================
// Tests del panel de métricas (FASE 5 — PLAN_PEDIDOS_FASE5_TICKET_METRICAS_STOCK).
// Mocks en la frontera: módulo del service + i18n (firma real t(key, fallback, vars)).
// El gate reports:read vive en la página; acá se testea el panel suelto.
// ===========================================================================

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const metricsMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string, vars?: Record<string, unknown>) => {
      if (!fallback) return key
      return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
    },
  }),
}))

vi.mock('@/services/counterOrderService', () => ({
  counterOrderService: {
    metrics: (days?: number) => metricsMock(days),
  },
}))

import { CounterOrdersMetricsPanel } from '../components/CounterOrdersMetricsPanel'

const metricsResponse = {
  days: 30,
  created: 8,
  converted: 5,
  cancelled: 1,
  expired: 1,
  active: 1,
  avg_minutes_to_convert: 12.5,
  conversion_rate: 62.5,
}

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <CounterOrdersMetricsPanel />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  metricsMock.mockResolvedValue(metricsResponse)
})

afterEach(cleanup)

describe('CounterOrdersMetricsPanel — FASE 5', () => {
  it('pide métricas con el rango por defecto (30 días) y pinta los valores', async () => {
    renderPanel()
    expect(await screen.findByTestId('counterorder-metrics-created-value')).toHaveTextContent('8')
    expect(metricsMock).toHaveBeenCalledWith(30)
    expect(screen.getByTestId('counterorder-metrics-converted-value')).toHaveTextContent('5')
    expect(screen.getByTestId('counterorder-metrics-rate-value')).toHaveTextContent('62.5%')
    expect(screen.getByTestId('counterorder-metrics-avg-time-value')).toHaveTextContent('12.5 min')
    expect(screen.getByTestId('counterorder-metrics-active-value')).toHaveTextContent('1')
    expect(screen.getByTestId('counterorder-metrics-lost-value')).toHaveTextContent('1 / 1')
  })

  it('cambia el rango a 7 días y reconsulta', async () => {
    const user = userEvent.setup()
    renderPanel()
    await screen.findByTestId('counterorder-metrics-created-value')
    await user.click(screen.getByRole('tab', { name: '7 d' }))
    await waitFor(() => expect(metricsMock).toHaveBeenLastCalledWith(7))
  })
})
