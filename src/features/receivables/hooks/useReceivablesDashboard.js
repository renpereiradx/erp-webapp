import { useState, useEffect, useCallback } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
// F1 (PLAN_ALINEACION_BI_FRONTEND): mapeos API→vista extraídos a domain
import {
  transformRecentInvoices,
  transformSummary,
} from '@/domain/receivables/mappers'

/**
 * Hook para manejar los datos del dashboard de cuentas por cobrar.
 */
export const useReceivablesDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    summary: {
      totalReceivables: { amount: 0, trend: 0 },
      overdueAmount: { amount: 0, percentage: 0 },
      totalCount: 0,
      overdueCount: 0,
      avgDaysToCollect: 0,
      collectionRate: 0,
      collectionTrend: []
    },
    aging: {},
    recentInvoices: [],
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, agingRes, statsRes, recentRes] = await Promise.all([
        receivablesService.getOverview(),
        receivablesService.getAgingSummary(),
        receivablesService.getOverview(),
        receivablesService.getMasterList(
          { status: 'all' },
          { page: 1, pageSize: 5 },
          { sortBy: 'date', sortOrder: 'desc' },
        ),
      ])

      // Parse recent invoices from API response
      const rawRecent = recentRes.data || recentRes || {}
      const recentItems =
        rawRecent.data?.items ||
        rawRecent.items ||
        rawRecent.data ||
        rawRecent ||
        []

      // Merge summary with stats for trend
      const summaryInfo = { 
        ...(summaryRes.data || summaryRes), 
        collection_trend: statsRes.data?.collection_trend || statsRes.collection_trend || [] 
      }

      setData({
        summary: transformSummary(summaryInfo),
        aging: agingRes.data || agingRes,
        recentInvoices: transformRecentInvoices(
          Array.isArray(recentItems) ? recentItems : [],
        ),
      })
    } catch (err) {
      console.warn('Error fetching dashboard data:', err)
      setError('Error al cargar los datos del dashboard.')
    } finally {
      setLoading(false)
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
