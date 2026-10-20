/**
 * F5 — período de Analítica de Inventario en la URL: valida el token del BE,
 * default `month` y limpieza del query param al volver al default.
 */
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useInventoryPeriod } from '../hooks/useInventoryPeriod'

const renderAt = (entry: string) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
  )
  return renderHook(
    () => ({ period: useInventoryPeriod(), location: useLocation() }),
    { wrapper },
  )
}

describe('useInventoryPeriod', () => {
  it('lee un período válido del query param', () => {
    const { result } = renderAt('/inventory-analytics/turnover-abc?period=year')
    expect(result.current.period.period).toBe('year')
  })

  it('cae al default month con un valor inválido', () => {
    const { result } = renderAt('/inventory-analytics/turnover-abc?period=quarter')
    expect(result.current.period.period).toBe('month')
  })

  it('sin param usa month', () => {
    const { result } = renderAt('/inventory-analytics/turnover-abc')
    expect(result.current.period.period).toBe('month')
  })

  it('escribe el período no-default y limpia el param al volver al default', () => {
    const { result } = renderAt('/inventory-analytics/turnover-abc')

    act(() => result.current.period.setPeriod('today'))
    expect(result.current.location.search).toBe('?period=today')
    expect(result.current.period.period).toBe('today')

    act(() => result.current.period.setPeriod('month'))
    expect(result.current.location.search).toBe('')
  })
})
