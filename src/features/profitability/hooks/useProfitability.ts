import { useCallback, useEffect, useRef, useState } from 'react'
import profitabilityService from '@/services/bi/profitabilityService'
import { tRaw } from '@/lib/i18n'
import type { ProfitabilityParams, ProfitabilityResource } from '../types'

/**
 * Hook de datos de rentabilidad (FASE 2 del plan de alineación BI).
 * - Recurso como unión tipada (antes: dispatch por string libre).
 * - Guard anti-carrera por seq-counter: si cambian resource/params mientras
 *   hay una petición en vuelo, la respuesta vieja se descarta.
 * - Sin fallbacks demo; error como string traducido (tRaw) y `refresh`
 *   expuesto para onRetry.
 * - T por defecto `any` solo mientras queden consumidores .jsx legacy; las
 *   páginas migradas fijan su contrato con useProfitability<DashboardData>(...).
 */
export const useProfitability = <T = any>(
  resource: ProfitabilityResource,
  params: ProfitabilityParams = 'month',
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dependencia estable del effect (los objetos de params son nuevos por render)
  const paramsKey = JSON.stringify(params)
  const requestSeq = useRef(0)

  const fetchData = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      const method = (
        profitabilityService as unknown as Record<
          string,
          (p: ProfitabilityParams) => Promise<unknown>
        >
      )[resource]
      if (typeof method !== 'function') {
        throw new Error(
          tRaw('bi.profitability.unsupportedResource', 'Recurso de rentabilidad no soportado: {r}', {
            r: resource,
          }),
        )
      }      const response = await method(params)
      if (seq !== requestSeq.current) return // llegó tarde: descartar

      const hasExplicitSuccess = typeof (response as Record<string, unknown>)?.success === 'boolean'
      const isSuccess = hasExplicitSuccess
        ? Boolean((response as Record<string, unknown>).success)
        : true
      if (isSuccess) {
        setData((((response as Record<string, unknown>)?.data as T) ?? response) as T)
      } else {
        throw new Error(
          ((response as Record<string, unknown>).message as string) ||
            tRaw('bi.profitability.loadError', 'Error al cargar los datos de rentabilidad', {}),
        )
      }
    } catch (err) {
      if (seq !== requestSeq.current) return
      setError((err as Error).message)
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, paramsKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data: data as T | null, loading, error, refresh: fetchData }
}
