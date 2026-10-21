/**
 * F9 — período de Reportes Financieros en la URL (`?period=`).
 */
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useFinancePeriod } from '../hooks/useFinancePeriod'

const wrapperFor = (initial: string) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  )
  return Wrapper
}

const useHarness = () => {
  const state = useFinancePeriod()
  const location = useLocation()
  return { ...state, search: location.search }
}

describe('useFinancePeriod (F9)', () => {
  it('sin parámetro usa el mes por defecto', () => {
    const { result } = renderHook(useHarness, {
      wrapper: wrapperFor('/dashboard/financial-summary'),
    })
    expect(result.current.period).toBe('month')
  })

  it('acepta un período válido del deep-link y descarta inválidos', () => {
    const valid = renderHook(useHarness, {
      wrapper: wrapperFor('/finance/profit-and-loss?period=year'),
    })
    expect(valid.result.current.period).toBe('year')

    const invalid = renderHook(useHarness, {
      wrapper: wrapperFor('/finance/profit-and-loss?period=quarter'),
    })
    expect(invalid.result.current.period).toBe('month')
  })

  it('escribe el período y lo limpia al volver al default', () => {
    const { result } = renderHook(useHarness, {
      wrapper: wrapperFor('/finance/profit-and-loss'),
    })

    act(() => result.current.setPeriod('week'))
    expect(result.current.period).toBe('week')
    expect(result.current.search).toContain('period=week')

    act(() => result.current.setPeriod('month'))
    expect(result.current.period).toBe('month')
    expect(result.current.search).not.toContain('period=')
  })
})
