import { useState, useEffect, useCallback, useMemo } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'

/**
 * Genera un color de avatar basado en el nombre del cliente
 */
const getAvatarColor = name => {
  const colors = [
    '#dbeafe',
    '#fef3c7',
    '#e0e7ff',
    '#dcfce7',
    '#f3e8ff',
    '#fce7f3',
    '#fef2f2',
    '#ecfdf5',
    '#fef9c3',
    '#ddd6fe',
  ]
  const index = name ? name.charCodeAt(0) % colors.length : 0
  return colors[index]
}

/**
 * Mapea el estado del API al formato de color para los pills
 */
const getStatusColor = status => {
  const statusMap = {
    OVERDUE: 'red',
    PENDING: 'yellow',
    PARTIAL: 'blue',
    PAID: 'green',
  }
  return statusMap[status] || 'gray'
}

/**
 * Transforma un item del API al formato esperado por la tabla
 */
const transformReceivableItem = item => {
  const clientName = item.client_name || item.clientName || 'Cliente Desconocido';
  return {
    id: item.id || item.sale_order_id,
    clientId: item.client_id || 'CLI-001',
    clientName: clientName,
    clientInitial: clientName.charAt(0).toUpperCase(),
    clientColor: getAvatarColor(clientName),
    issueDate: item.sale_date ? new Date(item.sale_date).toLocaleDateString('es-PY') : '',
    dueDate: item.due_date ? new Date(item.due_date).toLocaleDateString('es-PY') : '',
    originalAmt: item.original_amount || 0,
    pendingAmt: item.pending_amount || 0,
    status: item.status,
    statusColor: getStatusColor(item.status),
  }
}

/**
 * Hook para manejar la lista maestra de cuentas por cobrar.
 */
export const useReceivablesMasterList = (initialFilters = {}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateStart: '',
    dateEnd: '',
    minAmount: '',
    maxAmount: '',
    daysOverdue: '',
    ...initialFilters,
  })

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  })

  const [sorting, setSorting] = useState({
    sortBy: 'date',
    sortOrder: 'desc',
  })

  // Raw data from API (before local filtering)
  const [rawInvoices, setRawInvoices] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Don't send 'search' to API - it's not supported, we filter locally
      const apiFilters = { ...filters }
      delete apiFilters.search

      const response = await receivablesService.getMasterList(
        apiFilters,
        { page: pagination.page, pageSize: pagination.pageSize },
        sorting,
      )

      // Support both structured { data, pagination, summary } and flat array responses
      const raw = response.data || response || []

      if (Array.isArray(raw)) {
        const transformed = raw.map(transformReceivableItem)
        setRawInvoices(transformed)
      } else {
        // Structured response from API
        const items =
          raw.data?.items || raw.items || raw.data || raw.receivables || []
        const transformedItems = Array.isArray(items)
          ? items.map(transformReceivableItem)
          : []
        setRawInvoices(transformedItems)

        // Parse pagination from nested response structure
        const paginationData = raw.data?.pagination || raw.pagination
        if (paginationData) {
          setPagination(prev => ({
            ...prev,
            totalItems:
              paginationData.total_items ??
              paginationData.totalItems ??
              transformedItems.length,
            totalPages:
              paginationData.total_pages ??
              paginationData.totalPages ??
              Math.ceil((paginationData.total_items || transformedItems.length) / prev.pageSize),
          }))
        } else {
          // Fallback calculation
          setPagination(prev => ({
            ...prev,
            totalItems: transformedItems.length,
            totalPages: Math.ceil(transformedItems.length / prev.pageSize) || 1
          }))
        }
      }
    } catch (err) {
      console.error('Error loading master list:', err)
      setError('Error al cargar la lista de cuentas.')
      setRawInvoices([])
    } finally {
      setLoading(false)
    }
  }, [
    filters.status,
    filters.dateStart,
    filters.dateEnd,
    filters.minAmount,
    filters.maxAmount,
    filters.daysOverdue,
    pagination.page,
    pagination.pageSize,
    sorting,
  ])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Local filtering by client name (API doesn't support 'search' param)
  const invoices = useMemo(() => {
    if (!filters.search || !filters.search.trim()) {
      return rawInvoices
    }
    const searchTerm = filters.search.toLowerCase().trim()
    return rawInvoices.filter(
      inv =>
        inv.clientName?.toLowerCase().includes(searchTerm) ||
        inv.id?.toLowerCase().includes(searchTerm),
    )
  }, [rawInvoices, filters.search])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateStart: '',
      dateEnd: '',
      minAmount: '',
      maxAmount: '',
      daysOverdue: '',
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = newPage => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = newSize => {
    setPagination(prev => ({ ...prev, pageSize: Number(newSize), page: 1 }))
  }

  const handleSort = columnKey => {
    setSorting(prev => {
      if (prev.sortBy === columnKey) {
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }
      }
      return { sortBy: columnKey, sortOrder: 'asc' }
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return {
    invoices,
    loading,
    error,
    filters,
    pagination,
    sorting,
    handleFilterChange,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    refresh: loadData,
  }
}
