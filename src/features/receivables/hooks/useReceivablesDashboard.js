import { useState, useEffect, useCallback } from 'react'
import { receivablesService } from '@/services/receivablesService'

/**
 * Transforma la respuesta de /receivables/overview al formato esperado por SummaryCardsGrid
 */
const transformSummary = apiData => {
  const overduePercentage =
    apiData.total_pending > 0
      ? ((apiData.total_overdue / apiData.total_pending) * 100).toFixed(1)
      : 0

  return {
    totalReceivables: {
      amount: apiData.total_pending || 0,
      trend: apiData.collection_rate || 0,
    },
    overdueAmount: {
      amount: apiData.total_overdue || 0,
      percentage: overduePercentage,
    },
    // Datos no disponibles en la API - mostramos valores neutros
    totalCount: apiData.total_count || 0,
    overdueCount: apiData.overdue_count || 0,
    avgDaysToCollect: apiData.average_days_to_collect || 0,
    collectionRate: apiData.collection_rate || 0,
    collectionTrend: apiData.collection_trend || []
  }
}

/**
 * Transforma una lista de cuentas por cobrar al formato de la tabla de facturas recientes
 */
const transformRecentInvoices = items => {
  return items.map(item => {
    const clientName = item.client_name || item.clientName || 'Cliente';
    return {
      id: item.id || item.sale_order_id,
      invoiceId: item.id || item.sale_order_id,
      clientId: item.client_id || 'CLI-001',
      client: clientName,
      issueDate: item.sale_date ? new Date(item.sale_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pendiente',
      balance: item.pending_amount || 0,
      daysOverdue: item.days_overdue || 0,
      status: item.status,
      statusColor:
        item.status === 'OVERDUE' ? 'red' : 
        item.status === 'PARTIAL' ? 'blue' : 
        item.status === 'PENDING' ? 'yellow' : 'green',
    }
  })
}

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
        receivablesService.getSummary(),
        receivablesService.getAgingSummary(),
        receivablesService.getStatistics(),
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
