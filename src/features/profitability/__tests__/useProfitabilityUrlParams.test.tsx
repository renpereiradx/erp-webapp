/**
 * F6 — período y granularidad de Rentabilidad en la URL: validación de tokens
 * del BE, defaults (month; año → mensual), escritura y limpieza del param.
 */
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useProfitabilityPeriod } from '../hooks/useProfitabilityPeriod'
import { useProfitabilityGranularity } from '../hooks/useProfitabilityGranularity'

const routerWrapper = (entry: string) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
  )
  return wrapper
}

const renderPeriod = (entry: string) =>
  renderHook(
    () => ({ period: useProfitabilityPeriod(), location: useLocation() }),
    { wrapper: routerWrapper(entry) },
  )

const renderGranularity = (entry: string) =>
  renderHook(
    () => ({ granularity: useProfitabilityGranularity('month'), location: useLocation() }),
    { wrapper: routerWrapper(entry) },
  )

describe('useProfitabilityPeriod', () => {
  it('lee un período válido del query param', () => {
    const { result } = renderPeriod('/profitability/products?period=year')
    expect(result.current.period.period).toBe('year')
  })

  it('cae a month con un valor inválido (quarter no existe en el BE)', () => {
    const { result } = renderPeriod('/profitability/products?period=quarter')
    expect(result.current.period.period).toBe('month')
  })

  it('sin param usa month', () => {
    const { result } = renderPeriod('/profitability/products')
    expect(result.current.period.period).toBe('month')
  })

  it('escribe el período no-default y limpia el param al volver al default', () => {
    const { result } = renderPeriod('/profitability/products')

    act(() => result.current.period.setPeriod('week'))
    expect(result.current.location.search).toBe('?period=week')
    expect(result.current.period.period).toBe('week')

    act(() => result.current.period.setPeriod('month'))
    expect(result.current.location.search).toBe('')
  })
})

describe('useProfitabilityGranularity', () => {
  it('sin param usa diaria para el mes', () => {
    const { result } = renderGranularity('/profitability/trends')
    expect(result.current.granularity.granularity).toBe('daily')
  })

  it('acepta las tres granularidades del BE e ignora inválidas', () => {
    expect(
      renderGranularity('/profitability/trends?granularity=weekly').result.current.granularity
        .granularity,
    ).toBe('weekly')
    expect(
      renderGranularity('/profitability/trends?granularity=monthly').result.current.granularity
        .granularity,
    ).toBe('monthly')
    expect(
      renderGranularity('/profitability/trends?granularity=quarter').result.current.granularity
        .granularity,
    ).toBe('daily')
  })

  it('escribe la granularidad no-default y limpia el param al volver al default', () => {
    const { result } = renderGranularity('/profitability/trends')
    act(() => result.current.granularity.setGranularity('monthly'))
    expect(result.current.location.search).toBe('?granularity=monthly')
    act(() => result.current.granularity.setGranularity('daily'))
    expect(result.current.location.search).toBe('')
  })

  it('el default de un año es mensual', () => {
    const { result } = renderHook(
      () => ({ granularity: useProfitabilityGranularity('year'), location: useLocation() }),
      { wrapper: routerWrapper('/profitability/trends') },
    )
    expect(result.current.granularity.granularity).toBe('monthly')
  })
})
