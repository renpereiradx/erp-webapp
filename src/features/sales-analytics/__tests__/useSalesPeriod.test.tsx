/**
 * F4 — período de Analítica de Ventas en la URL: valida el valor del BE,
 * default `month` y limpieza del query param cuando vuelve al default.
 */
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useSalesPeriod } from '../hooks/useSalesPeriod'

const renderAt = (entry: string) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
  )
  return renderHook(
    () => ({ period: useSalesPeriod(), location: useLocation() }),
    { wrapper },
  )
}

describe('useSalesPeriod', () => {
  it('lee un período válido del query param', () => {
    const { result } = renderAt('/sales-analytics/insights?period=year')
    expect(result.current.period.period).toBe('year')
  })

  it('cae al default month con un valor inválido', () => {
    const { result } = renderAt('/sales-analytics/insights?period=quarter')
    expect(result.current.period.period).toBe('month')
  })

  it('sin param usa month', () => {
    const { result } = renderAt('/sales-analytics/insights')
    expect(result.current.period.period).toBe('month')
  })

  it('escribe el período no-default y limpia el param al volver al default', () => {
    const { result } = renderAt('/sales-analytics/insights')

    act(() => result.current.period.setPeriod('today'))
    expect(result.current.location.search).toBe('?period=today')
    expect(result.current.period.period).toBe('today')

    act(() => result.current.period.setPeriod('month'))
    expect(result.current.location.search).toBe('')
  })
})
