/**
 * F8 — período del dashboard en la URL (`?period=`): default, validación,
 * escritura y limpieza del parámetro.
 */
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePayablesPeriod } from '../hooks/usePayablesPeriod'

const wrapperFor = (initial: string) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  )
  return Wrapper
}

const useHarness = () => {
  const state = usePayablesPeriod()
  const location = useLocation()
  return { ...state, search: location.search }
}

describe('usePayablesPeriod (F8)', () => {
  it('sin parámetro usa el mes por defecto', () => {
    const { result } = renderHook(useHarness, { wrapper: wrapperFor('/dashboard/payables') })
    expect(result.current.period).toBe('month')
  })

  it('acepta un período válido del deep-link', () => {
    const { result } = renderHook(useHarness, {
      wrapper: wrapperFor('/dashboard/payables?period=year'),
    })
    expect(result.current.period).toBe('year')
  })

  it('un período inválido cae al default', () => {
    const { result } = renderHook(useHarness, {
      wrapper: wrapperFor('/dashboard/payables?period=quarter'),
    })
    expect(result.current.period).toBe('month')
  })

  it('escribe el período y lo limpia al volver al default', () => {
    const { result } = renderHook(useHarness, { wrapper: wrapperFor('/dashboard/payables') })

    act(() => result.current.setPeriod('week'))
    expect(result.current.period).toBe('week')
    expect(result.current.search).toContain('period=week')

    act(() => result.current.setPeriod('month'))
    expect(result.current.period).toBe('month')
    expect(result.current.search).not.toContain('period=')
  })

  it('ignora valores fuera del contrato', () => {
    const { result } = renderHook(useHarness, { wrapper: wrapperFor('/dashboard/payables') })
    act(() => result.current.setPeriod('quarter' as never))
    expect(result.current.period).toBe('month')
  })
})
