/**
 * Hooks de datos del feature Manufacturing (PLAN_UNITS_V2 F6.2).
 *
 * Tres hooks de lectura con {data, loading, error, refetch}; las mutaciones
 * viven en los componentes (service + toast + refetch) para que la
 * invalidación sea explícita y local a la pestaña que la dispara.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { manufacturingService } from '@/services/manufacturingService'
import type {
  EstimatedCost,
  ProductionBatch,
  ProductionSummaryRow,
  ProfitabilityRow,
  RecipeIngredient,
  SupplyEnriched,
} from '@/features/manufacturing/types'

interface AsyncState<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

function useAsyncData<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Guard de carrera: ignora respuestas de fetches obsoletos.
  const seq = useRef(0)

  const load = useCallback(async () => {
    const current = ++seq.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (seq.current === current) setData(result)
    } catch (err: any) {
      if (seq.current === current) setError(err?.message ?? String(err))
    } finally {
      if (seq.current === current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}

export function useSupplies(activeOnly = false) {
  return useAsyncData<SupplyEnriched[]>(
    () => manufacturingService.getSupplies(activeOnly),
    [],
    [activeOnly],
  )
}

export function useRecipe(productId: string | null) {
  return useAsyncData<RecipeIngredient[]>(
    () => (productId ? manufacturingService.getRecipe(productId) : Promise.resolve([])),
    [],
    [productId],
  )
}

export function useEstimatedCost(productId: string | null, quantity = 1) {
  return useAsyncData<EstimatedCost | null>(
    () =>
      productId
        ? manufacturingService.getEstimatedCost(productId, quantity)
        : Promise.resolve(null),
    null,
    [productId, quantity],
  )
}

export interface ProductionData {
  batches: ProductionBatch[]
  summary: ProductionSummaryRow[]
  profitability: ProfitabilityRow[]
}

export function useProduction() {
  return useAsyncData<ProductionData>(
    async () => {
      const [batches, summary, profitability] = await Promise.all([
        manufacturingService.getBatches(undefined, 10),
        manufacturingService.getProductionSummary(),
        manufacturingService.getProfitability(),
      ])
      return { batches, summary, profitability }
    },
    { batches: [], summary: [], profitability: [] },
    [],
  )
}
