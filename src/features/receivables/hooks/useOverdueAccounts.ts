import { useCallback, useEffect, useRef, useState } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
import { tRaw } from '@/lib/i18n'
import { transformApiResponse } from '@/domain/receivables/mappers'
import { calculateStats } from '@/domain/receivables/risk'
import type { OverdueAccount } from '../types'

export interface OverduePagination {
  page?: number
  page_size?: number
  total_items?: number
  total_pages?: number
}

interface ReceivablesSummary {
  total_amount?: number
  total_pending?: number
  total_paid?: number
  item_count?: number
  high_priority_count?: number
}

interface OverdueState {
  stats: { totalOverdue: number; atRisk: number; efficiency: number; totalAccounts: number }
  accounts: OverdueAccount[]
  pagination?: OverduePagination
}

const PAGE_SIZE = 10

/**
 * Cuentas vencidas (GET /receivables/overdue). Migración FASE 3: .ts +
 * guard anti-carrera + tRaw. Deuda ≤10 filas (VERIFICACION_POST_CIERRE
 * 2026-09-21): paginación server-side (page_size 10) y KPIs del portfolio
 * tomados del summary global del BE (window aggregates previos a
 * LIMIT/OFFSET) — con página activa, contar sobre las filas visibles era
 * un total falso; fallback a calculateStats solo si el summary no viene.
 */
export const useOverdueAccounts = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<OverdueState>({
    stats: { totalOverdue: 0, atRisk: 0, efficiency: 0, totalAccounts: 0 },
    accounts: [],
  })
  const requestSeq = useRef(0)

  const loadData = useCallback(async (targetPage: number) => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      const response = await receivablesService.getOverdue({ page: targetPage, page_size: PAGE_SIZE })
      if (seq !== requestSeq.current) return
      const accountsData = (response as { data?: unknown }).data ?? response ?? []

      // Transform API data to UI format
      const accounts = transformApiResponse(accountsData) as OverdueAccount[]
      const summary = (accountsData as { summary?: ReceivablesSummary })?.summary
      const pagination = (accountsData as { pagination?: OverduePagination })?.pagination

      const stats = summary
        ? {
            totalOverdue: summary.total_pending ?? 0,
            atRisk: summary.high_priority_count ?? 0,
            efficiency:
              summary.total_amount && summary.total_amount > 0
                ? Math.round(((summary.total_paid ?? 0) / summary.total_amount) * 100)
                : 0,
            totalAccounts: summary.item_count ?? pagination?.total_items ?? 0,
          }
        : calculateStats(accounts)

      setData({ stats, accounts, pagination })
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
    loadData(page)
  }, [loadData, page])

  return {
    ...data,
    page,
    setPage,
    loading,
    error,
    refresh: () => loadData(page),
  }
}
