/**
 * Período de Reportes Financieros en la URL (`?period=`).
 *
 * Todas las pantallas del grupo comparten la misma ventana; un deep-link la
 * conserva y el refresco no la pierde. Un valor inválido cae al default (mes).
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod } from '@/types/bi'
import { FINANCE_DEFAULT_PERIOD, isFinancePeriod } from '@/domain/finance/periods'

interface FinancePeriodState {
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

export const useFinancePeriod = (): FinancePeriodState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('period')
  const period = isFinancePeriod(raw) ? raw : FINANCE_DEFAULT_PERIOD

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      if (!isFinancePeriod(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === FINANCE_DEFAULT_PERIOD) {
        params.delete('period')
      } else {
        params.set('period', next)
      }
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  return { period, setPeriod }
}
