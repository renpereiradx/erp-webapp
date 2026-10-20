/**
 * Hooks de datos del Dashboard BI (F2).
 *
 * Toda la orquestación HTTP vive acá: los componentes reciben props y no
 * llaman servicios. Cada hook usa react-query con las queries keyed por
 * período/ventana/orden, así cambiar el selector reutiliza el cache por
 * combinación y no mezcla respuestas de períodos distintos.
 *
 * El backend cachea las agregaciones 60-120 s: `staleTime` de 60 s evita
 * refetch redundante sin mentir sobre la frescura.
 */

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/bi/dashboardService'
import { useDashboardStore } from '@/store/useDashboardStore'
import type { DashboardPeriod, TopProductSort } from '@/types/bi'

export const DASHBOARD_STALE_TIME = 60_000

export const dashboardQueryKeys = {
  all: ['bi', 'dashboard'] as const,
  summary: (period: DashboardPeriod) => ['bi', 'dashboard', 'summary', period] as const,
  kpis: (period: DashboardPeriod) => ['bi', 'dashboard', 'kpis', period] as const,
  trends: (period: DashboardPeriod) => ['bi', 'dashboard', 'trends', period] as const,
  alerts: () => ['bi', 'dashboard', 'alerts'] as const,
  recentActivity: (limit: number) => ['bi', 'dashboard', 'recent-activity', limit] as const,
  topProducts: (period: DashboardPeriod, limit: number, sortBy: TopProductSort) =>
    ['bi', 'dashboard', 'top-products', period, limit, sortBy] as const,
  heatmap: (weeks: number) => ['bi', 'dashboard', 'sales-heatmap', weeks] as const,
}

/** Resumen ejecutivo del período seleccionado. */
export const useDashboardSummary = () => {
  const period = useDashboardStore((state) => state.period)
  return useQuery({
    queryKey: dashboardQueryKeys.summary(period),
    queryFn: async () => {
      const response = await dashboardService.getSummary({ period })
      return { summary: response.data, metadata: response.metadata }
    },
    staleTime: DASHBOARD_STALE_TIME,
  })
}

/** Los 5 grupos de KPIs del período. */
export const useDashboardKpis = () => {
  const period = useDashboardStore((state) => state.period)
  return useQuery({
    queryKey: dashboardQueryKeys.kpis(period),
    queryFn: async () => {
      const response = await dashboardService.getKPIs({ period })
      return { kpis: response.data, metadata: response.metadata }
    },
    staleTime: DASHBOARD_STALE_TIME,
  })
}

/** Comparación con el período anterior. */
export const useDashboardTrends = () => {
  const period = useDashboardStore((state) => state.period)
  return useQuery({
    queryKey: dashboardQueryKeys.trends(period),
    queryFn: async () => {
      const response = await dashboardService.getTrends({ period })
      return { trends: response.data, metadata: response.metadata }
    },
    staleTime: DASHBOARD_STALE_TIME,
  })
}

/** Alertas activas; se filtran client-side para conservar el resumen del BE. */
export const useDashboardAlerts = () =>
  useQuery({
    queryKey: dashboardQueryKeys.alerts(),
    queryFn: async () => {
      const response = await dashboardService.getAlerts()
      return {
        alerts: response.data.alerts,
        summary: response.data.summary,
        metadata: response.metadata,
      }
    },
    staleTime: DASHBOARD_STALE_TIME,
  })

/** Actividad reciente (ventas, compras, pagos, ajustes). */
export const useDashboardRecentActivity = (limit = 6) =>
  useQuery({
    queryKey: dashboardQueryKeys.recentActivity(limit),
    queryFn: async () => {
      const response = await dashboardService.getRecentActivity({ limit })
      return { activities: response.data.activities, metadata: response.metadata }
    },
    staleTime: DASHBOARD_STALE_TIME,
  })

/** Top de productos ordenado por el backend. */
export const useDashboardTopProducts = (limit = 10, sortBy: TopProductSort = 'revenue') => {
  const period = useDashboardStore((state) => state.period)
  return useQuery({
    queryKey: dashboardQueryKeys.topProducts(period, limit, sortBy),
    queryFn: async () => {
      const response = await dashboardService.getTopProducts({ period, limit, sort_by: sortBy })
      return {
        products: response.data.products,
        totalRevenue: response.data.total_revenue,
        totalProfit: response.data.total_profit,
        metadata: response.metadata,
      }
    },
    staleTime: DASHBOARD_STALE_TIME,
  })
}

/** Heatmap de las últimas N semanas (selector propio en el store). */
export const useDashboardSalesHeatmap = () => {
  const weeks = useDashboardStore((state) => state.heatmapWeeks)
  return useQuery({
    queryKey: dashboardQueryKeys.heatmap(weeks),
    queryFn: async () => {
      const response = await dashboardService.getSalesHeatmap({ weeks })
      return {
        heatmap: response.data.heatmap,
        peakTimes: response.data.peak_times,
        slowTimes: response.data.slow_times,
        metadata: response.metadata,
      }
    },
    staleTime: DASHBOARD_STALE_TIME,
  })
}
