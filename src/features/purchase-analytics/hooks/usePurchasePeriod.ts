/**
 * Período de Analítica de Compras, persistido en la URL (`?period=`).
 *
 * Vive en la URL y no en un store: las pantallas del grupo comparten la
 * selección al navegar y un deep-link a
 * `/purchase-analytics/products-categories?period=year` abre ese período.
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod } from '@/types/bi'
import { PURCHASE_DEFAULT_PERIOD, isPurchasePeriod } from '@/domain/purchase-analytics/periods'

interface PurchasePeriodState {
  period: DashboardPeriod
  setPeriod: (period: DashboardPeriod) => void
}

export const usePurchasePeriod = (): PurchasePeriodState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('period')
  const period = isPurchasePeriod(raw) ? raw : PURCHASE_DEFAULT_PERIOD

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      if (!isPurchasePeriod(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === PURCHASE_DEFAULT_PERIOD) {
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
