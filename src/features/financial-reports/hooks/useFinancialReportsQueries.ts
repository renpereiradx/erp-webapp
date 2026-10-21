/**
 * Hooks de datos de Reportes Financieros (F9).
 *
 * Única frontera HTTP del feature: los componentes reciben props. Cada query
 * se keyea por período/página/filtros para no mezclar respuestas. Los slices
 * nil de Go se normalizan a `[]`; un `data` ausente rompe la query (nunca un
 * reporte vacío silencioso).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { financialReportsService } from '@/services/bi/financialReportsService'
import type {
  CashFlowStatement,
  DashboardPeriod,
  FinancialHealthScore,
  FinancialReportOverview,
  IncomeStatement,
  ProrrateoDetail,
  ProrrateoPeriod,
  PurchaseLedger,
  SalesLedger,
  TaxSummary,
  VatReport,
} from '@/types/bi'
import { LEDGER_PAGE_SIZE, PRORRATEO_HISTORY_LIMIT } from '@/domain/finance/constants'

export const FINANCE_STALE_TIME = 60_000

const toArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : [])

export const financeQueryKeys = {
  all: ['bi', 'financial-reports'] as const,
  overview: (period: DashboardPeriod) => ['bi', 'financial-reports', 'overview', period] as const,
  income: (period: DashboardPeriod) => ['bi', 'financial-reports', 'income', period] as const,
  cashFlow: (period: DashboardPeriod) => ['bi', 'financial-reports', 'cash-flow', period] as const,
  vat: (period: DashboardPeriod) => ['bi', 'financial-reports', 'vat', period] as const,
  tax: (period: DashboardPeriod) => ['bi', 'financial-reports', 'tax', period] as const,
  health: (period: DashboardPeriod) => ['bi', 'financial-reports', 'health', period] as const,
  salesLedger: (scope: string) => ['bi', 'financial-reports', 'sales-ledger', scope] as const,
  purchaseLedger: (scope: string) => ['bi', 'financial-reports', 'purchase-ledger', scope] as const,
  prorrateoHistory: (limit: number) => ['bi', 'vat-prorrateo', 'history', limit] as const,
  prorrateoDetails: (periodId: number) => ['bi', 'vat-prorrateo', 'details', periodId] as const,
}

const requireData = <T,>(data: T | null | undefined, endpoint: string): T => {
  if (!data) throw new Error(`Respuesta vacía de ${endpoint}`)
  return data
}

export const useFinancialOverview = (period: DashboardPeriod) =>
  useQuery({
    queryKey: financeQueryKeys.overview(period),
    queryFn: async (): Promise<FinancialReportOverview> =>
      requireData((await financialReportsService.getOverview(period))?.data, '/financial-reports/overview'),
    staleTime: FINANCE_STALE_TIME,
  })

export const useIncomeStatement = (period: DashboardPeriod) =>
  useQuery({
    queryKey: financeQueryKeys.income(period),
    queryFn: async (): Promise<IncomeStatement> => {
      const data = requireData(
        (await financialReportsService.getIncomeStatement(period))?.data,
        '/financial-reports/income-statement',
      )
      return {
        ...data,
        revenue: {
          ...data.revenue,
          by_category: toArray(data.revenue?.by_category),
          by_payment_method: toArray(data.revenue?.by_payment_method),
        },
        expenses: {
          ...data.expenses,
          by_category: toArray(data.expenses?.by_category),
        },
      }
    },
    staleTime: FINANCE_STALE_TIME,
  })

export const useCashFlowStatement = (period: DashboardPeriod) =>
  useQuery({
    queryKey: financeQueryKeys.cashFlow(period),
    queryFn: async (): Promise<CashFlowStatement> => {
      const data = requireData(
        (await financialReportsService.getCashFlow(period))?.data,
        '/financial-reports/cash-flow',
      )
      return { ...data, daily_breakdown: toArray(data.daily_breakdown) }
    },
    staleTime: FINANCE_STALE_TIME,
  })

export const useVatReport = (period: DashboardPeriod) =>
  useQuery({
    queryKey: financeQueryKeys.vat(period),
    queryFn: async (): Promise<VatReport> => {
      const data = requireData(
        (await financialReportsService.getVat(period))?.data,
        '/financial-reports/vat',
      )
      return { ...data, monthly_breakdown: toArray(data.monthly_breakdown) }
    },
    staleTime: FINANCE_STALE_TIME,
  })

export const useTaxSummary = (period: DashboardPeriod) =>
  useQuery({
    queryKey: financeQueryKeys.tax(period),
    queryFn: async (): Promise<TaxSummary> => {
      const data = requireData(
        (await financialReportsService.getTaxSummary(period))?.data,
        '/financial-reports/tax-summary',
      )
      return { ...data, monthly_detail: toArray(data.monthly_detail) }
    },
    staleTime: FINANCE_STALE_TIME,
  })

export const useFinancialHealthScore = (period: DashboardPeriod) =>
  useQuery({
    queryKey: financeQueryKeys.health(period),
    queryFn: async (): Promise<FinancialHealthScore> =>
      requireData(
        (await financialReportsService.getHealthScore(period))?.data,
        '/financial-reports/health-score',
      ),
    staleTime: FINANCE_STALE_TIME,
  })

export interface SalesLedgerView {
  ledger: SalesLedger
  entries: NonNullable<SalesLedger['entries']>
}

export interface SalesLedgerQueryParams {
  period: DashboardPeriod
  page: number
  startDate: string
  endDate: string
  estado: string
  cdc: string
  timbrado: string
  /** Solo el libro visible consulta (la pantalla monta ambos hooks). */
  enabled?: boolean
}

export const useSalesLedger = (params: SalesLedgerQueryParams) => {
  const customRange = Boolean(params.startDate && params.endDate)
  const scope = [
    customRange ? 'range' : params.period,
    params.page,
    params.startDate,
    params.endDate,
    params.estado,
    params.cdc,
    params.timbrado,
  ].join('|')
  return useQuery({
    queryKey: financeQueryKeys.salesLedger(scope),
    // Los filtros SIFEN solo aplican al endpoint date-range; con una sola
    // fecha el rango está incompleto y no se consulta.
    enabled:
      params.enabled !== false &&
      (!(params.startDate || params.endDate) || customRange),
    queryFn: async (): Promise<SalesLedgerView> => {
      const response = await financialReportsService.getSalesLedger({
        period: params.period,
        page: params.page,
        page_size: LEDGER_PAGE_SIZE,
        start_date: customRange ? params.startDate : undefined,
        end_date: customRange ? params.endDate : undefined,
        estado: customRange ? params.estado : undefined,
        cdc: customRange ? params.cdc : undefined,
        timbrado: customRange ? params.timbrado : undefined,
      })
      const ledger = requireData(response?.data, '/financial-reports/sales-ledger')
      return { ledger, entries: toArray(ledger.entries) }
    },
    staleTime: FINANCE_STALE_TIME,
  })
}

export interface PurchaseLedgerQueryParams {
  period: DashboardPeriod
  page: number
  startDate: string
  endDate: string
  enabled?: boolean
}

export const usePurchaseLedger = (params: PurchaseLedgerQueryParams) => {
  const customRange = Boolean(params.startDate && params.endDate)
  const scope = [
    customRange ? 'range' : params.period,
    params.page,
    params.startDate,
    params.endDate,
  ].join('|')
  return useQuery({
    queryKey: financeQueryKeys.purchaseLedger(scope),
    enabled:
      params.enabled !== false &&
      (!(params.startDate || params.endDate) || customRange),
    queryFn: async (): Promise<PurchaseLedger> => {
      const data = requireData(
        (
          await financialReportsService.getPurchaseLedger({
            period: params.period,
            page: params.page,
            page_size: LEDGER_PAGE_SIZE,
            start_date: customRange ? params.startDate : undefined,
            end_date: customRange ? params.endDate : undefined,
          })
        )?.data,
        '/financial-reports/purchase-ledger',
      )
      return { ...data, entries: toArray(data.entries) }
    },
    staleTime: FINANCE_STALE_TIME,
  })
}

export const useProrrateoHistory = (limit = PRORRATEO_HISTORY_LIMIT) =>
  useQuery({
    queryKey: financeQueryKeys.prorrateoHistory(limit),
    queryFn: async (): Promise<ProrrateoPeriod[]> => {
      const response = await financialReportsService.getProrrateoHistory(limit)
      return toArray(response?.data)
    },
    staleTime: FINANCE_STALE_TIME,
  })

export const useProrrateoDetails = (periodId: number | null) =>
  useQuery({
    queryKey: financeQueryKeys.prorrateoDetails(periodId ?? 0),
    enabled: Boolean(periodId),
    queryFn: async (): Promise<ProrrateoDetail[]> => {
      const response = await financialReportsService.getProrrateoDetails(periodId as number)
      return toArray(response?.data)
    },
    staleTime: FINANCE_STALE_TIME,
  })

/** Refetch de todo el grupo (botón real de la barra de acciones). */
export const useFinanceRefresh = () => {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: financeQueryKeys.all })
  }
}
