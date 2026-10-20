/**
 * Período de Rentabilidad, persistido en la URL (`?period=`).
 *
 * Compartido por las 6 pantallas del grupo: un deep-link conserva el período
 * y el botón de refresco no lo pierde. El valor se valida contra la lista del
 * BE; uno inválido cae al default (mes calendario). `week` es rolling en el
 * BE (últimos 7 días) y el selector lo rotula así.
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod } from '@/types/bi'
import {
  isProfitabilityPeriod,
  PROFITABILITY_DEFAULT_PERIOD,
} from '@/domain/profitability/periods'

interface ProfitabilityPeriodState {
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

export const useProfitabilityPeriod = (): ProfitabilityPeriodState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('period')
  const period = isProfitabilityPeriod(raw) ? raw : PROFITABILITY_DEFAULT_PERIOD

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      if (!isProfitabilityPeriod(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === PROFITABILITY_DEFAULT_PERIOD) {
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

export default useProfitabilityPeriod
