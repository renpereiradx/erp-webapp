import { useCallback, useEffect, useRef, useState } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
import { tRaw } from '@/lib/i18n'
import {
  transformRecentInvoices,
  transformSummary,
} from '@/domain/receivables/mappers'
import type { DashboardSummary, RecentInvoice } from '../types'

interface DashboardState {
  summary: DashboardSummary | null
  aging: unknown
  recentInvoices: RecentInvoice[]
}

/**
 * Dashboard de CxC (overview + aging summary + lista reciente).
 * Migración FASE 3: .ts + guard anti-carrera + tRaw. El doble overview
 * (summary + stats para collection_trend) se preserva 1:1 del legacy.
 */
export const useReceivablesDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardState>({
    summary: {
      totalReceivables: { amount: 0, trend: 0 },
      overdueAmount: { amount: 0, percentage: 0 },
      totalCount: 0,
      overdueCount: 0,
      avgDaysToCollect: 0,
      collectionRate: 0,
      collectionTrend: [],
    },
    aging: null,
    recentInvoices: [],
  })
  const requestSeq = useRef(0)

  const fetchData = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, agingRes, statsRes, recentRes] = (await Promise.all([
        receivablesService.getOverview(),
        receivablesService.getAgingSummary(),
        receivablesService.getOverview(),
        receivablesService.getMasterList(
          { status: 'all' },
          { page: 1, pageSize: 5 },
          { sortBy: 'date', sortOrder: 'desc' },
        ),
      ])) as [Record<string, any>, Record<string, any>, Record<string, any>, Record<string, any>]
      if (seq !== requestSeq.current) return

      // Parse recent invoices from API response
      const rawRecent = recentRes.data ?? recentRes ?? {}
      const recentItems =
        (rawRecent as { data?: { items?: unknown[] } }).data?.items ??
        (rawRecent as { items?: unknown[] }).items ??
        (rawRecent as { data?: unknown }).data ??
        rawRecent ??
        []

      // Merge summary with stats for trend
      const summaryInfo = {
        ...(summaryRes.data ?? summaryRes),
        collection_trend: statsRes.data?.collection_trend ?? statsRes.collection_trend ?? [],
      }

      setData({
        summary: transformSummary(summaryInfo),
        aging: agingRes.data || agingRes,
        recentInvoices: transformRecentInvoices(
          Array.isArray(recentItems) ? (recentItems as Parameters<typeof transformRecentInvoices>[0]) : [],
        ),
      })
    } catch (err) {
      if (seq !== requestSeq.current) return
      console.warn('Error fetching dashboard data:', err)
      setError(tRaw('bi.receivables.dashboard.loadError', 'Error al cargar los datos del dashboard.', {}))
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...data,
    loading,
    error,
    refresh: fetchData,
  }
}
