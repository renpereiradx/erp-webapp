/**
 * F11 — selección de Pronósticos en la URL: defaults, validación del
 * deep-link, escritura/limpieza de params y reseteo de página al cambiar de
 * horizonte.
 */
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import {
  useDashboardForecastParams,
  useDemandForecastParams,
  useInventoryForecastParams,
  useRevenueForecastParams,
  useSalesForecastParams,
} from '../hooks/useForecastParams'

const wrapperFor = (initial: string) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  )
  return Wrapper
}

const useHarness = <T,>(hook: () => T) =>
  function Harness() {
    const location = useLocation()
    return { ...hook(), search: location.search }
  }

describe('useForecastParams (F11)', () => {
  it('ventas: defaults y deep-link validado', () => {
    const defaults = renderHook(useHarness(useSalesForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/ventas'),
    })
    expect(defaults.result.current.selection).toEqual({
      historyMonths: 6,
      forecastMonths: 3,
      method: 'LINEAR',
      granularity: 'MONTHLY',
    })

    const valid = renderHook(useHarness(useSalesForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/ventas?history=12&months=6&method=MOVING_AVG'),
    })
    expect(valid.result.current.selection).toMatchObject({
      historyMonths: 12,
      forecastMonths: 6,
      method: 'MOVING_AVG',
    })

    const invalid = renderHook(useHarness(useSalesForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/ventas?history=7&months=5&method=ARIMA'),
    })
    expect(invalid.result.current.selection).toMatchObject({
      historyMonths: 6,
      forecastMonths: 3,
      method: 'LINEAR',
    })
  })

  it('ventas: SEASONAL (deep-link) se degrada y el setter no lo escribe', () => {
    const degraded = renderHook(useHarness(useSalesForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/ventas?history=24&method=SEASONAL'),
    })
    expect(degraded.result.current.selection.method).toBe('LINEAR')

    const clean = renderHook(useHarness(useSalesForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/ventas'),
    })
    act(() => clean.result.current.setMethod('SEASONAL'))
    expect(clean.result.current.selection.method).toBe('LINEAR')
    expect(clean.result.current.search).not.toContain('method=SEASONAL')
  })

  it('ventas: escribe/limpia historial, horizonte y método', () => {
    const { result } = renderHook(useHarness(useSalesForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/ventas'),
    })

    act(() => result.current.setHistory(24))
    expect(result.current.search).toContain('history=24')
    act(() => result.current.setHistory(6))
    expect(result.current.search).not.toContain('history=')

    act(() => result.current.setForecastMonths(12))
    expect(result.current.search).toContain('months=12')
    act(() => result.current.setForecastMonths(3))
    expect(result.current.search).not.toContain('months=')

    act(() => result.current.setMethod('MOVING_AVG'))
    expect(result.current.search).toContain('method=MOVING_AVG')
    act(() => result.current.setMethod('LINEAR'))
    expect(result.current.search).not.toContain('method=')
  })

  it('ventas: bajar la historia conserva un método válido', () => {
    const { result } = renderHook(useHarness(useSalesForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/ventas?history=12&method=MOVING_AVG'),
    })
    expect(result.current.selection.method).toBe('MOVING_AVG')

    act(() => result.current.setHistory(6))
    expect(result.current.selection.historyMonths).toBe(6)
    expect(result.current.selection.method).toBe('MOVING_AVG')
    expect(result.current.search).toContain('method=MOVING_AVG')
  })

  it('inventario: días y página con reseteo al cambiar el horizonte', () => {
    const defaults = renderHook(useHarness(useInventoryForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/inventario'),
    })
    expect(defaults.result.current.days).toBe(30)
    expect(defaults.result.current.page).toBe(1)

    const deep = renderHook(useHarness(useInventoryForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/inventario?days=90&page=2'),
    })
    expect(deep.result.current.days).toBe(90)
    expect(deep.result.current.page).toBe(2)
    expect(deep.result.current.search).toContain('page=2')

    act(() => deep.result.current.setDays(60))
    expect(deep.result.current.days).toBe(60)
    expect(deep.result.current.page).toBe(1)
    expect(deep.result.current.search).not.toContain('page=')
    expect(deep.result.current.search).toContain('days=60')

    act(() => deep.result.current.setPage(3))
    expect(deep.result.current.search).toContain('page=3')
    act(() => deep.result.current.setPage(1))
    expect(deep.result.current.search).not.toContain('page=')
  })

  it('demanda y ingresos: default de meses y página', () => {
    const demand = renderHook(useHarness(useDemandForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/demanda?months=12&page=3'),
    })
    expect(demand.result.current.months).toBe(12)
    expect(demand.result.current.page).toBe(3)

    act(() => demand.result.current.setMonths(6))
    expect(demand.result.current.months).toBe(6)
    expect(demand.result.current.search).toContain('months=6')
    expect(demand.result.current.search).not.toContain('page=')

    const revenue = renderHook(useHarness(useRevenueForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/ingresos'),
    })
    expect(revenue.result.current.months).toBe(3)
    expect(revenue.result.current.page).toBe(1)

    act(() => revenue.result.current.setMonths(12))
    expect(revenue.result.current.search).toContain('months=12')
    act(() => revenue.result.current.setMonths(3))
    expect(revenue.result.current.search).not.toContain('months=')
  })

  it('dashboard: horizonte por URL', () => {
    const { result } = renderHook(useHarness(useDashboardForecastParams), {
      wrapper: wrapperFor('/bi/pronosticos/dashboard?months=12'),
    })
    expect(result.current.months).toBe(12)

    act(() => result.current.setMonths(6))
    expect(result.current.months).toBe(6)
    expect(result.current.search).toContain('months=6')

    act(() => result.current.setMonths(3))
    expect(result.current.search).not.toContain('months=')
  })
})
