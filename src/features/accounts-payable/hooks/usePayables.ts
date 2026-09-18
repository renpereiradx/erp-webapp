import { useCallback, useRef, useState } from 'react'
import { payablesService } from '@/services/bi/payablesService'
import { useToast } from '@/hooks/useToast'
import { tRaw } from '@/lib/i18n'
// F1 (PLAN_ALINEACION_BI_FRONTEND): traducciones de estado/prioridad del domain
import { translatePriority, translateStatus } from '@/domain/payables/statusLabels'

/**
 * Hook de Cuentas por Pagar (migración FASE 4 del plan de alineación BI).
 * Antes vivía en src/hooks/ con formatDate duplicado y toasts en español
 * hardcodeado; ahora: un solo formatDate, guard anti-carrera POR FETCHER
 * (los fetchers corren en paralelo y comparten loading — deuda conocida,
 * se divide por recurso cuando las páginas se migren) y errores vía tRaw.
 */

/** Fecha es-PY corta ('N/A' si no viene; el legacy la duplicaba por hook). */
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date
      .toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace('.', '')
  } catch {
    return dateStr
  }
}

export interface PayablesInvoice {
  id: string
  purchaseOrderId?: string
  vendor: string
  vendorId?: string
  dueDate: string
  totalAmount: number
  pendingAmount: number
  status: string
  priority: string
  initials: string
  logo?: string | null
}

export const usePayables = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [overview, setOverview] = useState<Record<string, any> | null>(null)
  const [payables, setPayables] = useState<PayablesInvoice[]>([])
  const [selectedPayable, setSelectedPayable] = useState<Record<string, any> | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  })
  const [topSuppliers, setTopSuppliers] = useState<Record<string, any>[]>([])
  const [schedule, setSchedule] = useState<Record<string, any>[]>([])
  const [agingSummary, setAgingSummary] = useState<Record<string, any> | null>(null)
  const [agingReport, setAgingReport] = useState<Record<string, any> | null>(null)
  const [statistics, setStatistics] = useState<Record<string, any> | null>(null)

  // Guard anti-carrera por fetcher (conviven fetchers en paralelo)
  const seqs = useRef<Record<string, number>>({})
  const nextSeq = (key: string) => (seqs.current[key] = (seqs.current[key] ?? 0) + 1)
  const isCurrent = (key: string, seq: number) => seqs.current[key] === seq

  const failToast = (description: string) => {
    toast({
      title: tRaw('common.error', 'Error', {}),
      description,
      variant: 'destructive',
    })
  }

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = (await payablesService.getOverview()) as Record<string, any>
      if (response.success) {
        setOverview(response.data)
      }
      return response
    } catch (err) {
      setError((err as Error).message)
      failToast(tRaw('bi.payables.errors.overview', 'No se pudo cargar el resumen de cuentas por pagar.', {}))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPayables = useCallback(async (filters: Record<string, any> = {}, paginationArg: Record<string, any> = {}) => {
    const seq = nextSeq('payables')
    setLoading(true)
    setError(null)
    try {
      const response = (await payablesService.getPayables(filters, paginationArg)) as Record<string, any>
      if (!isCurrent('payables', seq)) return response

      if (response.success) {
        // Extraction logic to handle both array and object responses
        let rawData: Record<string, any>[] = []
        if (Array.isArray(response.data)) {
          rawData = response.data
        } else if (response.data?.items) {
          rawData = response.data.items
        } else if (response.data?.payables) {
          rawData = response.data.payables
        }

        // Mapping to satisfy the master list page expectations
        const mappedData = rawData.map((p: Record<string, any>) => ({
          id: p.id || p.purchase_order_id || p.payable_id || 'N/A',
          purchaseOrderId: p.purchase_order_id || p.id,
          vendor: p.supplier_name || p.vendor || 'Proveedor Desconocido',
          vendorId: p.supplier_id || p.vendorId,
          dueDate: formatDate(p.due_date || p.dueDate),
          totalAmount: p.original_amount || p.totalAmount || 0,
          pendingAmount: p.pending_amount || p.pendingAmount || 0,
          status: translateStatus(p.status),
          priority: translatePriority(p.priority),
          initials:
            p.initials || (p.supplier_name || p.vendor || '??').substring(0, 2).toUpperCase(),
          logo: p.logo || null,
        }))

        setPayables(mappedData)

        // Actualizar estado de paginación si la API lo provee
        if (response.data?.pagination) {
          setPagination({
            page: response.data.pagination.page || 1,
            pageSize: response.data.pagination.page_size || 20,
            totalItems: response.data.pagination.total_items || mappedData.length,
            totalPages: response.data.pagination.total_pages || 1,
          })
        }
      }
      return response
    } catch (err) {
      if (!isCurrent('payables', seq)) return
      setError((err as Error).message)
      failToast(tRaw('bi.payables.errors.invoices', 'No se pudieron cargar las facturas.', {}))
    } finally {
      if (isCurrent('payables', seq)) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPayableById = useCallback(async (id: string) => {
    const seq = nextSeq('detail')
    setLoading(true)
    setError(null)
    try {
      const response = (await payablesService.getPayableById(id)) as Record<string, any>
      if (!isCurrent('detail', seq)) return response
      if (response.success) {
        const p = response.data

        // Mapeo de datos reales para el detalle
        const mapped = {
          id: p.id || p.purchase_order_id || 'N/A',
          purchaseOrderId: p.purchase_order_id || p.id,
          status: translateStatus(p.status),
          totalAmount: p.original_amount || 0,
          paidAmount: p.paid_amount || 0,
          pendingAmount: p.pending_amount || 0,
          progress: p.original_amount > 0 ? (p.paid_amount / p.original_amount) * 100 : 0,
          detalle: {
            emision: formatDate(p.order_date || p.purchase_date || p.created_at),
            vencimiento: formatDate(p.due_date),
            proveedor: p.supplier_name || '—',
            ruc: p.supplier_ruc || '—',
          },
          pagos: (p.payment_history || []).map((pay: Record<string, any>) => ({
            fecha: formatDate(pay.payment_date),
            monto: pay.amount || 0,
            metodo: pay.payment_method || '—',
          })),
        }

        setSelectedPayable(mapped)
      }
      return response
    } catch (err) {
      if (!isCurrent('detail', seq)) return
      setError((err as Error).message)
      failToast(tRaw('bi.payables.errors.detail', 'No se pudo cargar el detalle de la factura.', {}))
    } finally {
      if (isCurrent('detail', seq)) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTopSuppliers = useCallback(async (limit = 10) => {
    setLoading(true)
    try {
      const response = (await payablesService.getTopSuppliers(limit)) as Record<string, any>
      if (response.success) {
        setTopSuppliers(response.data)
      }
      return response
    } catch (err) {
      failToast(tRaw('bi.payables.errors.suppliers', 'No se pudieron cargar los principales proveedores.', {}))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSchedule = useCallback(async (days = 30) => {
    setLoading(true)
    try {
      const response = (await payablesService.getSchedule(days)) as Record<string, any>
      if (response.success) {
        setSchedule(response.data.schedule || [])
      }
      return response
    } catch (err) {
      failToast(tRaw('bi.payables.errors.schedule', 'No se pudo cargar el calendario de pagos.', {}))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAgingSummary = useCallback(async () => {
    setLoading(true)
    try {
      const response = (await payablesService.getAgingSummary()) as Record<string, any>
      if (response.success) {
        setAgingSummary(response.data)
      }
      return response
    } catch (err) {
      failToast(tRaw('bi.payables.errors.agingSummary', 'No se pudo cargar el resumen de antigüedad.', {}))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAgingReport = useCallback(async () => {
    setLoading(true)
    try {
      const response = (await payablesService.getAgingReport()) as Record<string, any>
      if (response.success) {
        setAgingReport(response.data)
      }
      return response
    } catch (err) {
      failToast(tRaw('bi.payables.errors.agingReport', 'No se pudo cargar el reporte de antigüedad.', {}))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStatistics = useCallback(async (period = 'month') => {
    setLoading(true)
    try {
      const response = (await payablesService.getStatistics(period)) as Record<string, any>
      if (response.success) {
        setStatistics(response.data)
      }
      return response
    } catch (err) {
      failToast(tRaw('bi.payables.errors.statistics', 'No se pudieron cargar las estadísticas.', {}))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    loading,
    error,
    overview,
    payables,
    selectedPayable,
    pagination,
    topSuppliers,
    schedule,
    agingSummary,
    agingReport,
    statistics,
    fetchOverview,
    fetchPayables,
    fetchPayableById,
    fetchTopSuppliers,
    fetchSchedule,
    fetchAgingSummary,
    fetchAgingReport,
    fetchStatistics,
  }
}
