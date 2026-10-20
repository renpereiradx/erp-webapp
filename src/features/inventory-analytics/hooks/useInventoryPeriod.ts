/**
 * Período de Analítica de Inventario, persistido en la URL (`?period=`).
 *
 * Compartido por las pantallas de rotación y ABC: un deep-link conserva el
 * período y el botón de refresco no lo pierde. El valor se valida contra la
 * lista del BE; uno inválido cae al default (mes calendario).
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod } from '@/types/bi'
import { INVENTORY_DEFAULT_PERIOD, isInventoryPeriod } from '@/domain/inventory-analytics/periods'

interface InventoryPeriodState {
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

export const useInventoryPeriod = (): InventoryPeriodState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('period')
  const period = isInventoryPeriod(raw) ? raw : INVENTORY_DEFAULT_PERIOD

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      if (!isInventoryPeriod(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === INVENTORY_DEFAULT_PERIOD) {
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

export default useInventoryPeriod
