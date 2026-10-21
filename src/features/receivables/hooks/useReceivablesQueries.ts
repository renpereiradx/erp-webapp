/**
 * Hooks de datos de Cuentas por Cobrar (F7).
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
import { receivablesService } from '@/services/bi/receivablesService'
import type {
  BIPaginationInfo,
  ClientReceivables,
  ClientReceivablesSummary,
  ClientRisk,
  DashboardPeriod,
  Receivable,
  ReceivablePayment,
  ReceivablesAgingReport,
  ReceivablesList,
  ReceivablesListSummary,
  ReceivablesOverview,
  ReceivablesStatistics,
} from '@/types/bi'
import {
  RECEIVABLES_PAGE_SIZE,
  RECEIVABLES_RECENT_LIMIT,
  RECEIVABLES_TOP_DEBTORS_LIMIT,
} from '@/domain/receivables/constants'
import {
  agingBucketRows,
  clientAgingRows,
  sumClientAgingPage,
  unclassifiedAgingAmount,
  type AgingBucketRow,
  type ClientAgingRow,
  type ClientAgingPageTotals,
} from '@/domain/receivables/aging'
import {
  collectionTrendRows,
  type CollectionTrendRow,
  type ReceivablesSort,
} from '@/domain/receivables/collection'
import { parseStatisticsRange } from '@/domain/receivables/format'
import { toStatusParam, type ReceivablesStatusFilter } from '@/domain/receivables/status'

export const RECEIVABLES_STALE_TIME = 60_000

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

const EMPTY_PAGINATION: BIPaginationInfo = {
  page: 1,
  page_size: RECEIVABLES_PAGE_SIZE,
  total_items: 0,
  total_pages: 0,
}

export const receivablesQueryKeys = {
  all: ['bi', 'receivables'] as const,
  overview: () => ['bi', 'receivables', 'overview'] as const,
  list: (status: ReceivablesStatusFilter, page: number, sort: ReceivablesSort) =>
    ['bi', 'receivables', 'list', status, page, sort.by, sort.order] as const,
  recent: () => ['bi', 'receivables', 'recent'] as const,
  overdue: (page: number) => ['bi', 'receivables', 'overdue', page] as const,
  detail: (id: string) => ['bi', 'receivables', 'detail', id] as const,
  client: (clientId: string) => ['bi', 'receivables', 'client', clientId] as const,
  clientRisk: (clientId: string) => ['bi', 'receivables', 'client', clientId, 'risk'] as const,
  agingReport: (page: number) => ['bi', 'receivables', 'aging-report', page] as const,
  topDebtors: () => ['bi', 'receivables', 'top-debtors'] as const,
  statistics: (period: DashboardPeriod) =>
    ['bi', 'receivables', 'statistics', period] as const,
}

// --- Cartera actual ---------------------------------------------------------

export const useReceivablesOverview = () =>
  useQuery({
    queryKey: receivablesQueryKeys.overview(),
    queryFn: async (): Promise<ReceivablesOverview> => {
      const response = await receivablesService.getOverview()
      if (!response?.data) throw new Error('Respuesta vacía de /receivables/overview')
      return response.data
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

// --- Listados ---------------------------------------------------------------

export interface ReceivablesListView {
  list: ReceivablesList
  items: Receivable[]
  pagination: BIPaginationInfo
  summary: ReceivablesListSummary | null
}

const normalizeList = (data: ReceivablesList | null | undefined): ReceivablesListView => {
  if (!data) throw new Error('Respuesta vacía del listado de cuentas por cobrar')
  return {
    list: data,
    items: toArray(data.items),
    pagination: data.pagination ?? EMPTY_PAGINATION,
    summary: data.summary ?? null,
  }
}

export interface ReceivablesListParams {
  status: ReceivablesStatusFilter
  page: number
  sort: ReceivablesSort
}

/** Lista maestra paginada/ordenada server-side. */
export const useReceivablesList = ({ status, page, sort }: ReceivablesListParams) =>
  useQuery({
    queryKey: receivablesQueryKeys.list(status, page, sort),
    queryFn: async (): Promise<ReceivablesListView> => {
      const response = await receivablesService.getList({
        status: toStatusParam(status),
        page,
        page_size: RECEIVABLES_PAGE_SIZE,
        sort_by: sort.by,
        sort_order: sort.order,
      })
      return normalizeList(response?.data)
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

/** Cuentas recientes del dashboard (primeras 5 por fecha desc). */
export const useReceivablesRecent = () =>
  useQuery({
    queryKey: receivablesQueryKeys.recent(),
    queryFn: async (): Promise<ReceivablesListView> => {
      const response = await receivablesService.getList({
        page: 1,
        page_size: RECEIVABLES_RECENT_LIMIT,
        sort_by: 'date',
        sort_order: 'DESC',
      })
      return normalizeList(response?.data)
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

/** Vencidas (el BE fija `status=OVERDUE` y ordena por días vencidos desc). */
export const useReceivablesOverdue = (page: number) =>
  useQuery({
    queryKey: receivablesQueryKeys.overdue(page),
    queryFn: async (): Promise<ReceivablesListView> => {
      const response = await receivablesService.getOverdue({
        page,
        page_size: RECEIVABLES_PAGE_SIZE,
      })
      return normalizeList(response?.data)
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

// --- Detalle ----------------------------------------------------------------

export interface ReceivableDetailView {
  receivable: Receivable
  payments: ReceivablePayment[]
}

export const useReceivableDetail = (id: string) =>
  useQuery({
    queryKey: receivablesQueryKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<ReceivableDetailView> => {
      const response = await receivablesService.getById(id)
      if (!response?.data) throw new Error('Respuesta vacía del detalle de la cuenta')
      return {
        receivable: response.data,
        payments: toArray(response.data.payment_history),
      }
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

// --- Ficha de cliente -------------------------------------------------------

export interface ClientReceivablesView {
  client: ClientReceivables
  receivables: Receivable[]
}

export const useClientReceivables = (clientId: string) =>
  useQuery({
    queryKey: receivablesQueryKeys.client(clientId),
    enabled: Boolean(clientId),
    queryFn: async (): Promise<ClientReceivablesView> => {
      const response = await receivablesService.getClientReceivables(clientId)
      if (!response?.data) throw new Error('Respuesta vacía de la ficha del cliente')
      return {
        client: response.data,
        receivables: toArray(response.data.receivables),
      }
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

export const useClientRisk = (clientId: string) =>
  useQuery({
    queryKey: receivablesQueryKeys.clientRisk(clientId),
    enabled: Boolean(clientId),
    queryFn: async (): Promise<ClientRisk> => {
      const response = await receivablesService.getClientRisk(clientId)
      if (!response?.data) throw new Error('Respuesta vacía del análisis de riesgo')
      return response.data
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

// --- Antigüedad -------------------------------------------------------------

export interface ReceivablesAgingView {
  report: ReceivablesAgingReport
  rows: ClientAgingRow[]
  summaryRows: AgingBucketRow[]
  pageTotals: ClientAgingPageTotals
  unclassifiedAmount: number
}

export const useReceivablesAgingReport = (page: number) =>
  useQuery({
    queryKey: receivablesQueryKeys.agingReport(page),
    queryFn: async (): Promise<ReceivablesAgingView> => {
      const response = await receivablesService.getAgingReport({
        page,
        page_size: RECEIVABLES_PAGE_SIZE,
      })
      const data = response?.data
      if (!data) throw new Error('Respuesta vacía del reporte de antigüedad')
      const rows = clientAgingRows(data.by_client)
      return {
        report: data,
        rows,
        summaryRows: agingBucketRows(data.summary),
        pageTotals: sumClientAgingPage(rows),
        unclassifiedAmount: unclassifiedAgingAmount(data.total_amount, data.summary),
      }
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

// --- Otros ------------------------------------------------------------------

/** Principales deudores a hoy (sin período). */
export const useReceivablesTopDebtors = () =>
  useQuery({
    queryKey: receivablesQueryKeys.topDebtors(),
    queryFn: async (): Promise<ClientReceivablesSummary[]> => {
      const response = await receivablesService.getTopDebtors(RECEIVABLES_TOP_DEBTORS_LIMIT)
      return toArray(response?.data)
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })

export interface ReceivablesStatisticsView {
  statistics: ReceivablesStatistics
  /** Rango aplicado por el BE (fin exclusivo). */
  range: { start: string; end: string } | null
  trend: CollectionTrendRow[]
}

/** Estadísticas del período + serie semanal sin el bucket posterior al rango. */
export const useReceivablesStatistics = (period: DashboardPeriod) =>
  useQuery({
    queryKey: receivablesQueryKeys.statistics(period),
    queryFn: async (): Promise<ReceivablesStatisticsView> => {
      const response = await receivablesService.getStatistics(period)
      const data = response?.data
      if (!data) throw new Error('Respuesta vacía de las estadísticas de cobranza')
      const range = parseStatisticsRange(data.period)
      return {
        statistics: data,
        range,
        trend: collectionTrendRows(data.collection_trend, range),
      }
    },
    staleTime: RECEIVABLES_STALE_TIME,
  })
