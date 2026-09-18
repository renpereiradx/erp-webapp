import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
import { tRaw } from '@/lib/i18n'
import { transformReceivableItem } from '@/domain/receivables/mappers'
import type { MasterListInvoice } from '../types'

interface MasterListFilters {
  search: string
  status: string
  dateStart: string
  dateEnd: string
  minAmount: string
  maxAmount: string
  daysOverdue: string
}

interface MasterListPagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface MasterListSorting {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

/**
 * Lista maestra de CxC (GET /receivables con filtros server-side y
 * búsqueda local). Migración FASE 3: .ts + guard anti-carrera + tRaw.
 */
export const useReceivablesMasterList = (initialFilters: Partial<MasterListFilters> = {}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MasterListFilters>({
    search: '',
    status: 'all',
    dateStart: '',
    dateEnd: '',
    minAmount: '',
    maxAmount: '',
    daysOverdue: '',
    ...initialFilters,
  })

  const [pagination, setPagination] = useState<MasterListPagination>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  })

  const [sorting, setSorting] = useState<MasterListSorting>({
    sortBy: 'date',
    sortOrder: 'desc',
  })

  // Raw data from API (before local filtering)
  const [rawInvoices, setRawInvoices] = useState<MasterListInvoice[]>([])
  const requestSeq = useRef(0)

  const loadData = useCallback(async () => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    try {
      // Don't send 'search' to API - it's not supported, we filter locally
      const apiFilters: Record<string, unknown> = { ...filters }
      delete apiFilters.search

      const response = await receivablesService.getMasterList(
        apiFilters,
        { page: pagination.page, pageSize: pagination.pageSize },
        sorting,
      )
      if (seq !== requestSeq.current) return

      // Support both structured { data, pagination, summary } and flat array responses
      const raw = (response as Record<string, any>).data || response || []

      if (Array.isArray(raw)) {
        const transformed = raw.map(transformReceivableItem) as MasterListInvoice[]
        setRawInvoices(transformed)
      } else {
        // Structured response from API
        const items =
          raw.data?.items || raw.items || raw.data || raw.receivables || []
        const transformedItems = Array.isArray(items)
          ? (items.map(transformReceivableItem) as MasterListInvoice[])
          : []
        setRawInvoices(transformedItems)

        // Parse pagination from nested response structure
        const paginationData = raw.data?.pagination || raw.pagination
        if (paginationData) {
          setPagination((prev) => ({
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
          setPagination((prev) => ({
            ...prev,
            totalItems: transformedItems.length,
            totalPages: Math.ceil(transformedItems.length / prev.pageSize) || 1,
          }))
        }
      }
    } catch (err) {
      if (seq !== requestSeq.current) return
      console.error('Error loading master list:', err)
      setError(tRaw('bi.receivables.masterList.loadError', 'Error al cargar la lista de cuentas.', {}))
      setRawInvoices([])
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.pageSize, sorting])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Búsqueda local por nombre o ID (el BE no soporta 'search')
  const invoices = useMemo(() => {
    if (!filters.search || !filters.search.trim()) {
      return rawInvoices
    }
    const searchTerm = filters.search.toLowerCase().trim()
    return rawInvoices.filter(
      (inv) =>
        inv.clientName?.toLowerCase().includes(searchTerm) ||
        String(inv.id ?? '').toLowerCase().includes(searchTerm),
    )
  }, [rawInvoices, filters.search])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }))
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
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize: Number(newSize), page: 1 }))
  }

  const handleSort = (columnKey: string) => {
    setSorting((prev) => {
      if (prev.sortBy === columnKey) {
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }
      }
      return { sortBy: columnKey, sortOrder: 'asc' }
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
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
