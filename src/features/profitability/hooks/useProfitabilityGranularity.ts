/**
 * Granularidad de la serie de tendencias, persistida en `?granularity=`.
 *
 * Sin parámetro se usa el default derivado del período (año → mensual, resto
 * → diario), el mismo criterio de ventana que aplica el BE. Solo se aceptan
 * las tres granularidades del contrato.
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DashboardPeriod, ProfitabilityTrendGranularity } from '@/types/bi'
import { defaultTrendGranularity, isTrendGranularity } from '@/domain/profitability/trends'

interface ProfitabilityGranularityState {
  granularity: ProfitabilityTrendGranularity
  setGranularity: (next: ProfitabilityTrendGranularity) => void
}

export const useProfitabilityGranularity = (
  period: DashboardPeriod,
): ProfitabilityGranularityState => {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('granularity')
  const fallback = defaultTrendGranularity(period)
  const granularity = isTrendGranularity(raw) ? raw : fallback

  const setGranularity = useCallback(
    (next: ProfitabilityTrendGranularity) => {
      if (!isTrendGranularity(next)) return
      const params = new URLSearchParams(searchParams)
      if (next === fallback) {
        params.delete('granularity')
      } else {
        params.set('granularity', next)
      }
      setSearchParams(params, { replace: true })
    },
    [fallback, searchParams, setSearchParams],
  )

  return { granularity, setGranularity }
}

export default useProfitabilityGranularity
