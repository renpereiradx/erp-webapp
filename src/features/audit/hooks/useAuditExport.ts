/**
 * Export del registro de auditoría (F10).
 *
 * `POST /api/v1/audit/export` es real y devuelve un archivo crudo; el hook
 * orquesta el request + descarga. Los filtros que viajan son los mismos del
 * listado (rango, texto, categoría, nivel y resultado). Sin estado global:
 * `exporting`/`error` viven acá y la página los muestra.
 */
import { useCallback, useState } from 'react'
import { auditService } from '@/services/bi/auditService'
import { downloadBlob } from '@/lib/downloadBlob'
import { AUDIT_EXPORT_MAX_RECORDS } from '@/domain/audit/constants'
import { toAuditExportFilters, type AuditLogFilters } from '@/domain/audit/filters'

export interface AuditExportController {
  exporting: boolean
  error: unknown | null
  /** `true` después de una descarga exitosa (se resetea en cada intento). */
  done: boolean
  run: (filters: AuditLogFilters) => Promise<void>
}

export const useAuditExport = (): AuditExportController => {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const [done, setDone] = useState(false)

  const run = useCallback(async (filters: AuditLogFilters) => {
    setExporting(true)
    setError(null)
    setDone(false)
    try {
      const { blob, filename } = await auditService.exportLogs(
        toAuditExportFilters(filters),
        { format: 'csv', max_records: AUDIT_EXPORT_MAX_RECORDS },
      )
      downloadBlob(blob, filename || 'registro-auditoria.csv')
      setDone(true)
    } catch (err) {
      setError(err)
    } finally {
      setExporting(false)
    }
  }, [])

  return { exporting, error, done, run }
}

export default useAuditExport
