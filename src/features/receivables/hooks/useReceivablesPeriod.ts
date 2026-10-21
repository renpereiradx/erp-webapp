/**
 * Período de estadísticas de Cuentas por Cobrar, persistido en la URL
 * (`?period=`).
 *
 * Solo el dashboard lo usa (la sección "Facturación y cobranzas del período");
 * el resto de las pantallas son snapshots a hoy. Un deep-link conserva el
 * período y el botón de refresco no lo pierde. El valor se valida contra la
 * lista del BE: uno inválido cae al default (mes calendario).
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod } from '@/types/bi'
import {
  RECEIVABLES_DEFAULT_PERIOD,
  isReceivablesPeriod,
} from '@/domain/receivables/periods'

interface ReceivablesPeriodState {
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

export const useReceivablesPeriod = (): ReceivablesPeriodState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('period')
  const period = isReceivablesPeriod(raw) ? raw : RECEIVABLES_DEFAULT_PERIOD

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      if (!isReceivablesPeriod(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === RECEIVABLES_DEFAULT_PERIOD) {
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

export default useReceivablesPeriod
