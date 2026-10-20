/**
 * Estado de UI compartido por las pantallas del Dashboard BI (F2).
 *
 * Solo guarda selecciones de filtros que sobreviven al navegar entre las 5
 * pantallas (`/dashboard`, `/dashboard/kpis`, `/dashboard/top-products`, …).
 * Los datos NO viven acá: cada pantalla los pide con react-query a
 * `services/bi/dashboardService` (frontera HTTP única).
 *
 * El store anterior (`useDashboardStore` con summary/kpis/heatmap y fetchers
 * manuales) se eliminó en F1; este reemplazo nace en `.ts` y sin estado de
 * servidor.
 */

import { create } from 'zustand'
import type { DashboardPeriod } from '@/types/bi'

/** Períodos que ofrecen los selectores, en orden de lectura. */
export const DASHBOARD_PERIODS: readonly DashboardPeriod[] = [
  'today',
  'week',
  'month',
  'year',
]

/** Ventanas del heatmap ofrecidas por la UI (el BE acepta cualquier `weeks>0`). */
export const DASHBOARD_HEATMAP_WEEKS = [4, 8, 12] as const

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriod = 'month'
export const DEFAULT_HEATMAP_WEEKS = 4

interface DashboardUiState {
  period: DashboardPeriod
  heatmapWeeks: number
  setPeriod: (period: DashboardPeriod) => void
  setHeatmapWeeks: (weeks: number) => void
  reset: () => void
}

const initialState = {
  period: DEFAULT_DASHBOARD_PERIOD,
  heatmapWeeks: DEFAULT_HEATMAP_WEEKS,
}

export const useDashboardStore = create<DashboardUiState>()((set) => ({
  ...initialState,

  setPeriod: (period) => {
    if (!DASHBOARD_PERIODS.includes(period)) return
    set({ period })
  },

  setHeatmapWeeks: (weeks) => {
    if (!Number.isFinite(weeks) || weeks < 1) return
    set({ heatmapWeeks: Math.trunc(weeks) })
  },

  reset: () => set(initialState),
}))

export default useDashboardStore
