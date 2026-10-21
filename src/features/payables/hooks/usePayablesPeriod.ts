/**
 * Período de estadísticas de Cuentas por Pagar, persistido en la URL
 * (`?period=`).
 *
 * Solo el dashboard lo usa (la sección "Compras y pagos del período"); el
 * resto de las pantallas son snapshots a hoy o ventanas de días. Un deep-link
 * conserva el período y el refresco no lo pierde. El valor se valida contra la
 * lista del BE: uno inválido cae al default (mes calendario).
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod } from '@/types/bi'
import {
  PAYABLES_DEFAULT_PERIOD,
  isPayablesPeriod,
} from '@/domain/payables/periods'

interface PayablesPeriodState {
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

export const usePayablesPeriod = (): PayablesPeriodState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('period')
  const period = isPayablesPeriod(raw) ? raw : PAYABLES_DEFAULT_PERIOD

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      if (!isPayablesPeriod(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === PAYABLES_DEFAULT_PERIOD) {
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

export default usePayablesPeriod
