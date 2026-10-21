/**
 * F3 — acceso a los drill-downs BI desde fichas Core. El botón se oculta sin
 * pack o sin `analytics:read` (la ruta destino lo expulsaría igual): un botón
 * que termina en redirect es una affordance muerta.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

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

import BiDrilldownButton from '../BiDrilldownButton'

const renderButton = (onBeforeNavigate?: () => void, permission?: string) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path='/'
          element={
            <BiDrilldownButton
              to='/sales-analytics/products/buyers?product_id=P-1'
              label='Ver compradores'
              onBeforeNavigate={onBeforeNavigate}
              testId='bi-drilldown'
              permission={permission}
            />
          }
        />
        <Route path='/sales-analytics/products/buyers' element={<div>RUTA_DESTINO</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('BiDrilldownButton (F3)', () => {
  beforeEach(() => {
    authState.biEnabled = true
    authState.permissions = new Set(['analytics:read'])
  })

  it('con pack + analytics:read navega y cierra el modal de origen', () => {
    const onBeforeNavigate = vi.fn()
    renderButton(onBeforeNavigate)

    fireEvent.click(screen.getByTestId('bi-drilldown'))

    expect(onBeforeNavigate).toHaveBeenCalledTimes(1)
    expect(screen.getByText('RUTA_DESTINO')).toBeTruthy()
  })

  it('sin pack BI no renderiza nada', () => {
    authState.biEnabled = false
    renderButton()
    expect(screen.queryByTestId('bi-drilldown')).toBeNull()
  })

  it('sin analytics:read no renderiza nada', () => {
    authState.permissions = new Set(['sales:read'])
    renderButton()
    expect(screen.queryByTestId('bi-drilldown')).toBeNull()
  })

  it('con el permiso propio de la ruta (F7: receivables:read) renderiza', () => {
    authState.permissions = new Set(['receivables:read'])
    renderButton(undefined, 'receivables:read')
    expect(screen.getByTestId('bi-drilldown')).toBeTruthy()
  })

  it('con analytics:read pero sin receivables:read no renderiza', () => {
    authState.permissions = new Set(['analytics:read'])
    renderButton(undefined, 'receivables:read')
    expect(screen.queryByTestId('bi-drilldown')).toBeNull()
  })
})
