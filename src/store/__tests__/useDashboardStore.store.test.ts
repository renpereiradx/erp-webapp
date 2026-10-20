import { beforeEach, describe, expect, it } from 'vitest'
import {
  DASHBOARD_HEATMAP_WEEKS,
  DASHBOARD_PERIODS,
  DEFAULT_DASHBOARD_PERIOD,
  DEFAULT_HEATMAP_WEEKS,
  useDashboardStore,
} from '../useDashboardStore'

describe('useDashboardStore (F2 — filtros compartidos del dashboard)', () => {
  beforeEach(() => {
    useDashboardStore.getState().reset()
  })

  it('arranca con mes y 4 semanas', () => {
    const state = useDashboardStore.getState()
    expect(state.period).toBe(DEFAULT_DASHBOARD_PERIOD)
    expect(state.heatmapWeeks).toBe(DEFAULT_HEATMAP_WEEKS)
  })

  it('expone los períodos y ventanas que ofrecen los selectores', () => {
    expect(DASHBOARD_PERIODS).toEqual(['today', 'week', 'month', 'year'])
    expect(DASHBOARD_HEATMAP_WEEKS).toEqual([4, 8, 12])
  })

  it('setPeriod cambia el período y notifica a los suscriptores', () => {
    const seen: string[] = []
    const unsubscribe = useDashboardStore.subscribe((state) => seen.push(state.period))

    useDashboardStore.getState().setPeriod('year')
    expect(useDashboardStore.getState().period).toBe('year')
    expect(seen).toEqual(['year'])
    unsubscribe()
  })

  it('setPeriod ignora valores fuera del contrato', () => {
    useDashboardStore.getState().setPeriod('quarter' as never)
    expect(useDashboardStore.getState().period).toBe('month')
  })

  it('setHeatmapWeeks acepta ventanas válidas y trunca decimales', () => {
    useDashboardStore.getState().setHeatmapWeeks(8)
    expect(useDashboardStore.getState().heatmapWeeks).toBe(8)

    useDashboardStore.getState().setHeatmapWeeks(12.9)
    expect(useDashboardStore.getState().heatmapWeeks).toBe(12)
  })

  it('setHeatmapWeeks ignora valores inválidos', () => {
    useDashboardStore.getState().setHeatmapWeeks(0)
    expect(useDashboardStore.getState().heatmapWeeks).toBe(4)

    useDashboardStore.getState().setHeatmapWeeks(Number.NaN)
    expect(useDashboardStore.getState().heatmapWeeks).toBe(4)
  })

  it('reset vuelve a los defaults', () => {
    useDashboardStore.getState().setPeriod('today')
    useDashboardStore.getState().setHeatmapWeeks(12)
    useDashboardStore.getState().reset()
    expect(useDashboardStore.getState().period).toBe('month')
    expect(useDashboardStore.getState().heatmapWeeks).toBe(4)
  })
})
