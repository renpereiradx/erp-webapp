import { useState, useCallback } from 'react'
import { payablesService } from '@/services/bi/payablesService'
import { useToast } from './useToast'

/**
 * Hook for managing Accounts Payable data and state
 */
export const usePayables = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const [overview, setOverview] = useState(null)
  const [payables, setPayables] = useState([])
  const [selectedPayable, setSelectedPayable] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1
  })
  const [topSuppliers, setTopSuppliers] = useState([])
  const [schedule, setSchedule] = useState([])
  const [agingSummary, setAgingSummary] = useState(null)
  const [agingReport, setAgingReport] = useState(null)
  const [statistics, setStatistics] = useState(null)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await payablesService.getOverview()
      if (response.success) {
        setOverview(response.data)
      }
      return response
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el resumen de cuentas por pagar.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchPayables = useCallback(async (filters = {}, pagination = {}) => {
    setLoading(true)
    setError(null)
    try {
      const response = await payablesService.getPayables(filters, pagination)
      if (response.success) {
        // Extraction logic to handle both array and object responses
        let rawData = []
        if (Array.isArray(response.data)) {
          rawData = response.data
        } else if (response.data?.items) {
          rawData = response.data.items
        } else if (response.data?.payables) {
          rawData = response.data.payables
        }

        // Helper translations for status and priority
        const translateStatus = (status) => {
          if (!status) return 'PENDIENTE'
          const s = status.toUpperCase()
          if (s === 'OVERDUE') return 'VENCIDO'
          if (s === 'PENDING') return 'PENDIENTE'
          if (s === 'PARTIAL') return 'PARCIAL'
          if (s === 'PAID') return 'PAGADO'
          return s
        }

        const translatePriority = (priority) => {
          if (!priority) return 'MEDIA'
          const p = priority.toUpperCase()
          if (p === 'URGENT' || p === 'HIGH') return 'ALTA'
          if (p === 'MEDIUM') return 'MEDIA'
          if (p === 'LOW') return 'BAJA'
          return p
        }

        const formatDate = (dateStr) => {
          if (!dateStr) return 'N/A'
          try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return dateStr
            return date.toLocaleDateString('es-PY', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            }).replace('.', '')
          } catch (e) {
            return dateStr
          }
        }

        // Mapping to satisfy InvoicesMasterList.jsx expectations
        const mappedData = rawData.map(p => ({
          id: p.id || p.purchase_order_id || p.payable_id || 'N/A',
          purchaseOrderId: p.purchase_order_id || p.id,
          vendor: p.supplier_name || p.vendor || 'Proveedor Desconocido',
          vendorId: p.supplier_id || p.vendorId,
          dueDate: formatDate(p.due_date || p.dueDate),
          totalAmount: p.original_amount || p.totalAmount || 0,
          pendingAmount: p.pending_amount || p.pendingAmount || 0,
          status: translateStatus(p.status),
          priority: translatePriority(p.priority),
          initials: p.initials || (p.supplier_name || p.vendor || '??').substring(0, 2).toUpperCase(),
          logo: p.logo || null
        }))

        setPayables(mappedData)

        // Actualizar estado de paginación si la API lo provee
        if (response.data?.pagination) {
          setPagination({
            page: response.data.pagination.page || 1,
            pageSize: response.data.pagination.page_size || 20,
            totalItems: response.data.pagination.total_items || mappedData.length,
            totalPages: response.data.pagination.total_pages || 1
          })
        }
      }
      return response
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las facturas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchPayableById = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await payablesService.getPayableById(id)
      if (response.success) {
        const p = response.data
        
        // Helper translations
        const translateStatus = (status) => {
          if (!status) return 'PENDIENTE'
          const s = status.toUpperCase()
          if (s === 'OVERDUE') return 'VENCIDO'
          if (s === 'PENDING') return 'PENDIENTE'
          if (s === 'PARTIAL') return 'PARCIAL'
          if (s === 'PAID') return 'PAGADO'
          return s
        }

        const formatDate = (dateStr) => {
          if (!dateStr) return 'N/A'
          try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return dateStr
            return date.toLocaleDateString('es-PY', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            }).replace('.', '')
          } catch (e) {
            return dateStr
          }
        }

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
            emision: formatDate(p.order_date || p.created_at),
            vencimiento: formatDate(p.due_date),
            terminos: p.credit_terms || 'Net 30 días',
            prioridad: p.priority === 'URGENT' || p.priority === 'HIGH' ? 'Alta' : 'Media'
          },
          proveedor: {
            nombre: p.supplier_name || 'Proveedor Desconocido',
            ruc: p.supplier_ruc || 'N/A',
            contacto: p.supplier_contact || 'No disponible',
            email: p.supplier_email || 'No disponible',
            direccion: p.supplier_address || 'No disponible'
          },
          pagos: p.payments?.map(py => ({
            id: py.payment_id,
            fecha: formatDate(py.payment_date),
            metodo: py.payment_method,
            ref: py.reference,
            user: py.processed_by || 'Sistema',
            userInit: (py.processed_by || 'S').substring(0, 2).toUpperCase(),
            monto: py.amount
          })) || [],
          actividad: p.activity?.map(act => ({
            titulo: act.title,
            desc: act.description,
            date: formatDate(act.created_at),
            type: act.type,
            color: act.color || 'primary'
          })) || []
        }
        
        setSelectedPayable(mapped)
      }
      return response
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle de la factura.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchTopSuppliers = useCallback(async (limit = 10) => {
    setLoading(true)
    try {
      const response = await payablesService.getTopSuppliers(limit)
      if (response.success) {
        setTopSuppliers(response.data)
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los principales proveedores.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchSchedule = useCallback(async (days = 30) => {
    setLoading(true)
    try {
      const response = await payablesService.getSchedule(days)
      if (response.success) {
        setSchedule(response.data.schedule || [])
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el calendario de pagos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchAgingSummary = useCallback(async () => {
    setLoading(true)
    try {
      const response = await payablesService.getAgingSummary()
      if (response.success) {
        setAgingSummary(response.data)
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el resumen de antigüedad.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchAgingReport = useCallback(async () => {
    setLoading(true)
    try {
      const response = await payablesService.getAgingReport()
      if (response.success) {
        setAgingReport(response.data)
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el reporte de antigüedad.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchStatistics = useCallback(async (period = 'month') => {
    setLoading(true)
    try {
      const response = await payablesService.getStatistics(period)
      if (response.success) {
        setStatistics(response.data)
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

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
    fetchStatistics
  }
}
