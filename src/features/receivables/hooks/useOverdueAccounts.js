import { useState, useEffect, useCallback } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
// F1 (PLAN_ALINEACION_BI_FRONTEND): mapeo y stats extraídos a domain
import { transformApiResponse } from '@/domain/receivables/mappers'
import { calculateStats } from '@/domain/receivables/risk'

/**
 * Hook para manejar las cuentas vencidas y estadísticas de cobranza.
 * Conecta con GET /receivables/overdue
 */
export const useOverdueAccounts = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    stats: {
      totalOverdue: 0,
      atRisk: 0,
      efficiency: 0,
      totalAccounts: 0,
    },
    accounts: [],
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await receivablesService.getOverdue()
      const accountsData = response.data || response || []

      // Transform API data to UI format
      const accounts = transformApiResponse(accountsData)
      const stats = calculateStats(accounts)

      setData({ stats, accounts })
    } catch (err) {
      console.error('Error loading overdue accounts:', err)
      setError('Error al cargar las cuentas vencidas.')
      setData(prev => ({
        ...prev,
        accounts: [],
      }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    ...data,
    loading,
    error,
    refresh: loadData,
  }
}
