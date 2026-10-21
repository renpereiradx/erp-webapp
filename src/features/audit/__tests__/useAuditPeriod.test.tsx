/**
 * F10 — período de Auditoría en la URL (`?period=`).
 */
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuditPeriod } from '../hooks/useAuditPeriod'

const wrapperFor = (initial: string) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  )
  return Wrapper
}

const useHarness = () => {
  const state = useAuditPeriod()
  const location = useLocation()
  return { ...state, search: location.search }
}

describe('useAuditPeriod (F10)', () => {
  it('sin parámetro usa el mes por defecto', () => {
    const { result } = renderHook(useHarness, { wrapper: wrapperFor('/auditoria') })
    expect(result.current.period).toBe('month')
  })

  it('acepta un período válido del deep-link y descarta inválidos', () => {
    const valid = renderHook(useHarness, {
      wrapper: wrapperFor('/auditoria?period=week'),
    })
    expect(valid.result.current.period).toBe('week')

    const invalid = renderHook(useHarness, {
      wrapper: wrapperFor('/auditoria?period=quarter'),
    })
    expect(invalid.result.current.period).toBe('month')
  })

  it('escribe el período y lo limpia al volver al default', () => {
    const { result } = renderHook(useHarness, {
      wrapper: wrapperFor('/auditoria/logs/1'),
    })

    act(() => result.current.setPeriod('year'))
    expect(result.current.period).toBe('year')
    expect(result.current.search).toContain('period=year')

    act(() => result.current.setPeriod('month'))
    expect(result.current.period).toBe('month')
    expect(result.current.search).not.toContain('period=')
  })
})
