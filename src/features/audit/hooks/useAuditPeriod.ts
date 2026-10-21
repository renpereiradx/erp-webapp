/**
 * Período de Auditoría persistido en la URL (`?period=`).
 *
 * Lo usan el dashboard y la ficha de usuario. Un deep-link conserva el
 * período y el botón de refresco no lo pierde. El valor se valida contra los
 * períodos del BE: uno inválido cae al default (mes calendario).
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod } from '@/types/bi'
import { AUDIT_DEFAULT_PERIOD, isAuditPeriod } from '@/domain/audit/periods'

interface AuditPeriodState {
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

export const useAuditPeriod = (): AuditPeriodState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('period')
  const period = isAuditPeriod(raw) ? raw : AUDIT_DEFAULT_PERIOD

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      if (!isAuditPeriod(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === AUDIT_DEFAULT_PERIOD) {
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

export default useAuditPeriod
