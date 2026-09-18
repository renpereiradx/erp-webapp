import { useCallback, useEffect, useRef, useState } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
import { tRaw } from '@/lib/i18n'
import { transformApiResponse } from '@/domain/receivables/mappers'
import { calculateStats } from '@/domain/receivables/risk'
import type { OverdueAccount } from '../types'

interface OverdueState {
  stats: { totalOverdue: number; atRisk: number; efficiency: number; totalAccounts: number }
  accounts: OverdueAccount[]
}

/**
 * Cuentas vencidas (GET /receivables/overdue). Migración FASE 3: .ts +
 * guard anti-carrera + tRaw.
 */
export const useOverdueAccounts = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<OverdueState>({
    stats: { totalOverdue: 0, atRisk: 0, efficiency: 0, totalAccounts: 0 },
    accounts: [],
  })
  const requestSeq = useRef(0)

  const loadData = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      const response = await receivablesService.getOverdue()
      if (seq !== requestSeq.current) return
      const accountsData = (response as { data?: unknown }).data ?? response ?? []

      // Transform API data to UI format
      const accounts = transformApiResponse(accountsData) as OverdueAccount[]
      const stats = calculateStats(accounts)

      setData({ stats, accounts })
    } catch (err) {
      if (seq !== requestSeq.current) return
      console.error('Error loading overdue accounts:', err)
      setError(tRaw('bi.receivables.overdue.loadError', 'Error al cargar las cuentas vencidas.', {}))
      setData((prev) => ({ ...prev, accounts: [] }))
    } finally {
      if (seq === requestSeq.current) setLoading(false)
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
