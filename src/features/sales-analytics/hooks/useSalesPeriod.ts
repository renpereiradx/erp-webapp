/**
 * Período de Analítica de Ventas, persistido en la URL (`?period=`).
 *
 * Vive en la URL y no en un store: las 4 pantallas del grupo comparten la
 * selección al navegar (los links internos conservan el query param), y un
 * deep-link a `/sales-analytics/insights?period=year` abre ese período.
 * El valor se valida contra la lista del BE; uno inválido cae al default.
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod } from '@/types/bi'
import { SALES_DEFAULT_PERIOD, isSalesPeriod } from '@/domain/sales-analytics/periods'

interface SalesPeriodState {
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

export const useSalesPeriod = (): SalesPeriodState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('period')
  const period = isSalesPeriod(raw) ? raw : SALES_DEFAULT_PERIOD

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      if (!isSalesPeriod(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === SALES_DEFAULT_PERIOD) {
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
