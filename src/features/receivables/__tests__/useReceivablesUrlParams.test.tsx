/**
 * F7 — período de CxC en la URL: default mensual, validación contra la lista
 * del BE, escritura del query param y limpieza al volver al default.
 */
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useReceivablesPeriod } from '../hooks/useReceivablesPeriod'

const createWrapper = (initialEntry = '/receivables') => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  )
  return Wrapper
}

const usePeriodWithLocation = () => {
  const state = useReceivablesPeriod()
  const location = useLocation()
  return { ...state, search: location.search }
}

describe('useReceivablesPeriod (F7)', () => {
  it('sin query param usa el mes calendario (default del BE)', () => {
    const { result } = renderHook(() => usePeriodWithLocation(), {
      wrapper: createWrapper('/receivables'),
    })
    expect(result.current.period).toBe('month')
    expect(result.current.search).toBe('')
  })

  it('lee un período válido y lo escribe en la URL', () => {
    const { result } = renderHook(() => usePeriodWithLocation(), {
      wrapper: createWrapper('/receivables?period=year'),
    })
    expect(result.current.period).toBe('year')

    act(() => result.current.setPeriod('week'))
    expect(result.current.period).toBe('week')
    expect(result.current.search).toBe('?period=week')
  })

  it('un período inválido cae al default sin tocar la URL', () => {
    const { result } = renderHook(() => usePeriodWithLocation(), {
      wrapper: createWrapper('/receivables?period=quarter'),
    })
    expect(result.current.period).toBe('month')
  })

  it('volver al default limpia el query param', () => {
    const { result } = renderHook(() => usePeriodWithLocation(), {
      wrapper: createWrapper('/receivables?period=today'),
    })
    act(() => result.current.setPeriod('month'))
    expect(result.current.search).toBe('')
  })
})
