/**
 * Utilidades de los page tests de Analítica de Inventario (F5). No es un
 * archivo de test (no matchea `*.test.*`): provee el wrapper de router +
 * react-query y el envelope BI.
 */
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export const inventoryEnvelope = <T,>(
  data: T,
  metadata: Record<string, unknown> = {},
) => ({
  success: true,
  data,
  metadata,
})

export const renderInventoryPage = (
  ui: ReactElement,
  { route = '/inventory-analytics' }: { route?: string } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  )
}
