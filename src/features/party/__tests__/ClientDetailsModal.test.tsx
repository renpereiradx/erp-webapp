/**
 * F3/F7 — la ficha de cliente ofrece "Productos que compra"
 * (`analytics:read`) y "Análisis de Riesgo" (`receivables:read`), cada uno
 * solo con pack BI y su permiso de ruta.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ClientDetailsModal from '../components/ClientDetailsModal'

const authState = vi.hoisted(() => ({
  biEnabled: true,
  permissions: new Set<string>(['analytics:read']),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    hasPermission: (permission: string) => authState.permissions.has(permission),
  }),
  useBiPackEnabled: () => authState.biEnabled,
}))

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    lang: 'es',
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : key
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
    },
  }),
}))

vi.mock('@/features/party/components/CreditAccountSection', () => ({
  default: () => null,
}))

const client = {
  id: 'CLI-1',
  name: 'Maria',
  last_name: 'Gomez',
  document_id: '1234567',
  status: true,
}

const renderModal = (onClose = vi.fn()) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path='/'
          element={<ClientDetailsModal isOpen onClose={onClose} client={client} />}
        />
        <Route
          path='/sales-analytics/customers/top-products'
          element={<div>RUTA_PRODUCTOS_CLIENTE</div>}
        />
        <Route
          path='/receivables/client-profile/CLI-1'
          element={<div>RUTA_FICHA_CREDITO</div>}
        />
      </Routes>
    </MemoryRouter>,
  )

describe('ClientDetailsModal — pivote BI (F3)', () => {
  beforeEach(() => {
    authState.biEnabled = true
    authState.permissions = new Set(['analytics:read'])
  })

  it('con pack + analytics:read navega al drill-down y cierra la ficha', () => {
    const onClose = vi.fn()
    renderModal(onClose)

    fireEvent.click(screen.getByTestId('client-details-bi-drilldown'))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByText('RUTA_PRODUCTOS_CLIENTE')).toBeTruthy()
  })

  it('sin pack BI no renderiza el pivote', () => {
    authState.biEnabled = false
    renderModal()
    expect(screen.queryByTestId('client-details-bi-drilldown')).toBeNull()
  })

  it('sin analytics:read no renderiza el pivote de productos', () => {
    authState.permissions = new Set(['clients:read'])
    renderModal()
    expect(screen.queryByTestId('client-details-bi-drilldown')).toBeNull()
  })

  it('con pack + receivables:read navega a la ficha de crédito y cierra', () => {
    authState.permissions = new Set(['receivables:read'])
    const onClose = vi.fn()
    renderModal(onClose)

    fireEvent.click(screen.getByTestId('client-details-risk-drilldown'))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByText('RUTA_FICHA_CREDITO')).toBeTruthy()
  })

  it('el pivote de riesgo exige receivables:read, no analytics:read', () => {
    authState.permissions = new Set(['analytics:read'])
    renderModal()
    expect(screen.queryByTestId('client-details-risk-drilldown')).toBeNull()
  })

  it('sin pack BI ninguno de los dos pivotes se renderiza', () => {
    authState.biEnabled = false
    authState.permissions = new Set(['analytics:read', 'receivables:read'])
    renderModal()
    expect(screen.queryByTestId('client-details-bi-drilldown')).toBeNull()
    expect(screen.queryByTestId('client-details-risk-drilldown')).toBeNull()
  })
})
