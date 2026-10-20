/**
 * F3 — la ficha de proveedor vuelve a ofrecer "Productos suministrados"
 * apuntando al drill-down real, solo con pack BI + analytics:read.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SupplierDetailsModal from '../components/SupplierDetailsModal'

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

const supplier = {
  id: 'SUP-1',
  name: 'Distribuidora Sur',
  taxId: '80012345-6',
  status: true,
}

const renderModal = (onClose = vi.fn()) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path='/'
          element={<SupplierDetailsModal isOpen onClose={onClose} supplier={supplier} />}
        />
        <Route
          path='/purchase-analytics/suppliers/top-products'
          element={<div>RUTA_PRODUCTOS_PROVEEDOR</div>}
        />
      </Routes>
    </MemoryRouter>,
  )

describe('SupplierDetailsModal — pivote BI (F3)', () => {
  beforeEach(() => {
    authState.biEnabled = true
    authState.permissions = new Set(['analytics:read'])
  })

  it('con pack + analytics:read navega al drill-down y cierra la ficha', () => {
    const onClose = vi.fn()
    renderModal(onClose)

    fireEvent.click(screen.getByTestId('supplier-details-bi-drilldown'))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByText('RUTA_PRODUCTOS_PROVEEDOR')).toBeTruthy()
  })

  it('sin pack BI no renderiza el pivote', () => {
    authState.biEnabled = false
    renderModal()
    expect(screen.queryByTestId('supplier-details-bi-drilldown')).toBeNull()
  })

  it('sin analytics:read no renderiza el pivote', () => {
    authState.permissions = new Set(['suppliers:read'])
    renderModal()
    expect(screen.queryByTestId('supplier-details-bi-drilldown')).toBeNull()
  })
})
