import { useCallback, useEffect, useRef, useState } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
import { tRaw } from '@/lib/i18n'
import type { AgingReportBundle } from '../types'

/**
 * Reporte de antigüedad + estadísticas (endpoints overview/aging/report en
 * paralelo). Migración FASE 3: .ts, guard anti-carrera, tRaw y refresh
 * expuesto (la página legacy ignoraba el error del hook — corregido en la
 * migración de pages/AgingReport).
 */
export const useAgingReport = (period = 'month') => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AgingReportBundle | null>(null)
  const requestSeq = useRef(0)

  const fetchAllData = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      // Ejecutamos peticiones en paralelo (Endpoints 1, 9 y 12).
      // NOTA: la doble llamada a getOverview es histórica (alias duplicado);
      // se preserva 1:1 hasta la dedupe de esta fase.
      const [overviewRes, reportRes, statsRes] = (await Promise.all([
        receivablesService.getOverview({ period }),
        receivablesService.getAgingReport(),
        receivablesService.getOverview({ period }),
      ])) as [Record<string, any>, Record<string, any>, Record<string, any>]
      if (seq !== requestSeq.current) return

      if (overviewRes?.success && reportRes?.success && statsRes?.success) {
        setData({
          overview: overviewRes.data ?? null,
          detailed: reportRes.data ?? null,
          statistics: statsRes.data ?? null,
        })
      } else {
        setError(
          tRaw(
            'bi.receivables.aging.partialError',
            'No se pudo obtener la información completa del reporte.',
            {},
          ),
        )
      }
    } catch (err) {
      if (seq !== requestSeq.current) return
      console.error('Error fetching aging report data:', err)
      setError(
        tRaw('bi.receivables.aging.connectionError', 'Error de conexión al cargar los reportes.', {}),
      )
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  return { data, loading, error, refresh: fetchAllData }
}
