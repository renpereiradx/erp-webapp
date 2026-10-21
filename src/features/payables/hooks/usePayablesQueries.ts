/**
 * Hooks de datos de Cuentas por Pagar (F8).
 *
 * Única frontera de orquestación HTTP del feature: los componentes reciben
 * props y no llaman servicios. Cada query se keyea por página/estado/orden/
 * período para no mezclar respuestas. El BE cachea el overview 120 s; el
 * `staleTime` de 60 s no promete frescura.
 *
 * Los payloads BI traen slices nil de Go serializados como `null`: los hooks
 * normalizan a `[]` y el dominio re-deriva etiquetas/fechas en el locale de la
 * UI. El envelope se lee por `data` (un `data` ausente rompe la query; nunca
 * una tabla vacía silenciosa).
 */
import { useQuery } from '@tanstack/react-query'
import { payablesService } from '@/services/bi/payablesService'
import type {
  BIPaginationInfo,
  CashFlowProjection,
  DashboardPeriod,
  Payable,
  PayablesAgingReport,
  PayablesList,
  PayablesListSummary,
  PayablesOverview,
  PayablesStatistics,
  PaymentCalendar,
  SupplierAnalysis,
  SupplierPayablesSummary,
} from '@/types/bi'
import {
  PAYABLES_AGING_PAGE_SIZE,
  PAYABLES_CASH_FLOW_DEFAULT_DAYS,
  PAYABLES_PAGE_SIZE,
  PAYABLES_SCHEDULE_DAYS,
  PAYABLES_TOP_SUPPLIERS_LIMIT,
} from '@/domain/payables/constants'
import {
  isInvalidDateRange,
  type PayablesSort,
} from '@/domain/payables/listing'
import {
  toPriorityParam,
  toStatusParam,
  type PayablesPriorityFilter,
  type PayablesStatusFilter,
} from '@/domain/payables/status'

export const PAYABLES_STALE_TIME = 60_000

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

const EMPTY_PAGINATION: BIPaginationInfo = {
  page: 1,
  page_size: PAYABLES_PAGE_SIZE,
  total_items: 0,
  total_pages: 0,
}

export const payablesQueryKeys = {
  all: ['bi', 'payables'] as const,
  overview: () => ['bi', 'payables', 'overview'] as const,
  list: (scope: string) => ['bi', 'payables', 'list', scope] as const,
  topSuppliers: (limit: number) => ['bi', 'payables', 'top-suppliers', limit] as const,
  schedule: (days: number) => ['bi', 'payables', 'schedule', days] as const,
  agingReport: (page: number) => ['bi', 'payables', 'aging-report', page] as const,
  statistics: (period: DashboardPeriod) => ['bi', 'payables', 'statistics', period] as const,
  cashFlow: (days: number) => ['bi', 'payables', 'cash-flow', days] as const,
  detail: (id: string) => ['bi', 'payables', 'detail', id] as const,
  supplierAnalysis: (supplierId: string) =>
    ['bi', 'payables', 'supplier', supplierId, 'analysis'] as const,
  supplierInvoices: (supplierId: string, page: number) =>
    ['bi', 'payables', 'supplier', supplierId, 'invoices', page] as const,
}

// --- Cartera actual ---------------------------------------------------------

export const usePayablesOverview = () =>
  useQuery({
    queryKey: payablesQueryKeys.overview(),
    queryFn: async (): Promise<PayablesOverview> => {
      const response = await payablesService.getOverview()
      if (!response?.data) throw new Error('Respuesta vacía de /payables/overview')
      return response.data
    },
    staleTime: PAYABLES_STALE_TIME,
  })

// --- Listado ----------------------------------------------------------------

export interface PayablesListView {
  list: PayablesList
  items: Payable[]
  pagination: BIPaginationInfo
  summary: PayablesListSummary | null
}

const normalizeList = (data: PayablesList | null | undefined): PayablesListView => {
  if (!data) throw new Error('Respuesta vacía del listado de cuentas por pagar')
  return {
    list: data,
    items: toArray(data.items),
    pagination: data.pagination ?? EMPTY_PAGINATION,
    summary: data.summary ?? null,
  }
}

export interface PayablesListParams {
  page: number
  sort: PayablesSort
  status: PayablesStatusFilter
  priority: PayablesPriorityFilter
  search: string
  startDate: string
  endDate: string
}

const listScope = (params: PayablesListParams): string =>
  [
    params.status,
    params.priority,
    params.search.trim(),
    params.startDate,
    params.endDate,
    params.page,
    params.sort.by,
    params.sort.order,
  ].join('|')

/** Lista maestra paginada/ordenada server-side. */
export const usePayablesList = (params: PayablesListParams) => {
  const invalidRange = isInvalidDateRange(params.startDate, params.endDate)
  return useQuery({
    queryKey: payablesQueryKeys.list(listScope(params)),
    enabled: !invalidRange,
    queryFn: async (): Promise<PayablesListView> => {
      const response = await payablesService.getList({
        status: toStatusParam(params.status),
        priority: toPriorityParam(params.priority),
        search: params.search.trim() || undefined,
        start_date: params.startDate || undefined,
        end_date: params.endDate || undefined,
        page: params.page,
        page_size: PAYABLES_PAGE_SIZE,
        sort_by: params.sort.by,
        sort_order: params.sort.order,
      })
      return normalizeList(response?.data)
    },
    staleTime: PAYABLES_STALE_TIME,
  })
}

/** Facturas pendientes de un proveedor (listado filtrado, 10 por página). */
export const useSupplierInvoices = (supplierId: string, page: number) =>
  useQuery({
    queryKey: payablesQueryKeys.supplierInvoices(supplierId, page),
    enabled: Boolean(supplierId),
    queryFn: async (): Promise<PayablesListView> => {
      const response = await payablesService.getList({
        supplier_id: supplierId,
        page,
        page_size: PAYABLES_PAGE_SIZE,
        sort_by: 'date',
        sort_order: 'DESC',
      })
      return normalizeList(response?.data)
    },
    staleTime: PAYABLES_STALE_TIME,
  })

// --- Calendario / proveedores ----------------------------------------------

export const useTopSuppliers = (limit = PAYABLES_TOP_SUPPLIERS_LIMIT) =>
  useQuery({
    queryKey: payablesQueryKeys.topSuppliers(limit),
    queryFn: async (): Promise<SupplierPayablesSummary[]> => {
      const response = await payablesService.getTopSuppliers(limit)
      return toArray(response?.data)
    },
    staleTime: PAYABLES_STALE_TIME,
  })

export const usePayablesSchedule = (days = PAYABLES_SCHEDULE_DAYS) =>
  useQuery({
    queryKey: payablesQueryKeys.schedule(days),
    queryFn: async (): Promise<PaymentCalendar> => {
      const response = await payablesService.getSchedule(days)
      if (!response?.data) throw new Error('Respuesta vacía de /payables/schedule')
      return { ...response.data, schedule: toArray(response.data.schedule) }
    },
    staleTime: PAYABLES_STALE_TIME,
  })

// --- Aging ------------------------------------------------------------------

export interface PayablesAgingView {
  report: PayablesAgingReport
  suppliers: NonNullable<PayablesAgingReport['by_supplier']>
  pagination: BIPaginationInfo
}

/** El endpoint pagina por proveedor y no devuelve `pagination`: se deriva. */
export const usePayablesAgingReport = (page: number) =>
  useQuery({
    queryKey: payablesQueryKeys.agingReport(page),
    queryFn: async (): Promise<PayablesAgingView> => {
      const response = await payablesService.getAgingReport({
        page,
        page_size: PAYABLES_AGING_PAGE_SIZE,
      })
      const report = response?.data
      if (!report) throw new Error('Respuesta vacía de /payables/aging/report')
      const suppliers = toArray(report.by_supplier)
      const totalPages = Math.max(1, Math.ceil((report.total_suppliers ?? 0) / PAYABLES_AGING_PAGE_SIZE))
      return {
        report,
        suppliers,
        pagination: {
          page,
          page_size: PAYABLES_AGING_PAGE_SIZE,
          total_items: report.total_suppliers ?? 0,
          total_pages: totalPages,
        },
      }
    },
    staleTime: PAYABLES_STALE_TIME,
  })

// --- Estadísticas -----------------------------------------------------------

export const usePayablesStatistics = (period: DashboardPeriod) =>
  useQuery({
    queryKey: payablesQueryKeys.statistics(period),
    queryFn: async (): Promise<PayablesStatistics> => {
      const response = await payablesService.getStatistics(period)
      if (!response?.data) throw new Error('Respuesta vacía de /payables/statistics')
      return {
        ...response.data,
        top_suppliers: toArray(response.data.top_suppliers),
        payment_trend: toArray(response.data.payment_trend),
      }
    },
    staleTime: PAYABLES_STALE_TIME,
  })

// --- Flujo de caja ----------------------------------------------------------

export const useCashFlowProjection = (days = PAYABLES_CASH_FLOW_DEFAULT_DAYS) =>
  useQuery({
    queryKey: payablesQueryKeys.cashFlow(days),
    queryFn: async (): Promise<CashFlowProjection> => {
      const response = await payablesService.getCashFlowProjection(days)
      if (!response?.data) throw new Error('Respuesta vacía de /payables/cash-flow')
      return { ...response.data, projection_days: toArray(response.data.projection_days) }
    },
    staleTime: PAYABLES_STALE_TIME,
  })

// --- Detalle / proveedor ----------------------------------------------------

export const usePayableDetail = (id: string) =>
  useQuery({
    queryKey: payablesQueryKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<Payable> => {
      const response = await payablesService.getById(id)
      if (!response?.data) throw new Error(`Respuesta vacía de /payables/${id}`)
      return {
        ...response.data,
        payment_history: toArray(response.data.payment_history),
      }
    },
    staleTime: PAYABLES_STALE_TIME,
    retry: false,
  })

export const useSupplierAnalysis = (supplierId: string) =>
  useQuery({
    queryKey: payablesQueryKeys.supplierAnalysis(supplierId),
    enabled: Boolean(supplierId),
    queryFn: async (): Promise<SupplierAnalysis> => {
      const response = await payablesService.getSupplierAnalysis(supplierId)
      if (!response?.data) {
        throw new Error(`Respuesta vacía de /payables/supplier/${supplierId}/analysis`)
      }
      return response.data
    },
    staleTime: PAYABLES_STALE_TIME,
    retry: false,
  })
