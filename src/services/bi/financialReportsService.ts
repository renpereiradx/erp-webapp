/**
 * Servicio de Reportes Financieros (BI, F9).
 *
 * Contrato real del backend (`models/financial_reports.go` +
 * `models/vat_prorrateo.go` + `internal/analytics/http_financial.go` +
 * `http_prorrateo.go` + `internal/platform/postgres/analytics_financial_repo.go`):
 * envelope `{success, data, metadata}`. El servicio NO lo desenvuelve — el
 * hook lee `data`.
 *
 * Gate del BE: `RequireModule('bi')` → `reports:read` en
 * `biChain("reports:read", "financial-reports")` y en
 * `biChain("reports:read", "vat-prorrateo")`.
 *
 * Sin fallback demo/mock: si el endpoint falla, el error llega a la UI.
 * Endpoints NO consumidos por las pantallas de F9 (no se agregan métodos
 * muertos): las variantes date-range de income-statement/cash-flow/vat/
 * tax-summary (se usan los 4 períodos estándar), profit-margins (F6 cubre
 * rentabilidad), `tax-summary/annual` (el período `year` ya trae el detalle
 * mensual), `compare-periods` (sin pantalla de comparación custom),
 * `/vat/monthly` (el `monthly_breakdown` de `/vat?period=year` cubre los 12
 * meses) y `/vat-prorrateo/period` (la pantalla muestra el historial y sus
 * detalles).
 */
import { apiClient } from '../api';
import { telemetry } from '../../utils/telemetry';
import type {
  BIEnvelope,
  CashFlowStatement,
  DashboardPeriod,
  FinancialHealthScore,
  FinancialReportOverview,
  IncomeStatement,
  ProrrateoDetail,
  ProrrateoPeriod,
  PurchaseLedger,
  PurchaseLedgerParams,
  SalesLedger,
  SalesLedgerParams,
  TaxSummary,
  VatReport,
} from '../../types/bi';

type QueryValue = string | number | boolean | null | undefined;

/** Strip de undefined/null/'' — URLSearchParams no debe ver parámetros vacíos. */
export const cleanFinancialParams = (params: object = {}): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params) as Array<[string, QueryValue]>) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
};

const recordError = (operation: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  telemetry.record('bi.financialReports.error', { operation, error: message });
};

const get = async <T>(path: string, params: object = {}): Promise<BIEnvelope<T>> =>
  (await apiClient.get(path, { params: cleanFinancialParams(params) })) as BIEnvelope<T>;

const period = (value: DashboardPeriod = 'month'): { period: DashboardPeriod } => ({
  period: value,
});

/** Los libros usan el date-range cuando hay fechas o filtros SIFEN. */
const hasRange = (params: SalesLedgerParams | PurchaseLedgerParams): boolean =>
  Boolean(params.start_date && params.end_date);

export const financialReportsService = {
  /** Estado de resultado bruto del período (sin gastos operativos). */
  async getIncomeStatement(
    value: DashboardPeriod = 'month',
  ): Promise<BIEnvelope<IncomeStatement>> {
    try {
      return await get<IncomeStatement>('/financial-reports/income-statement', period(value));
    } catch (error) {
      recordError('getIncomeStatement', error);
      throw error;
    }
  },

  /** Flujo de caja base caja: cobros y pagos por fecha de pago. */
  async getCashFlow(value: DashboardPeriod = 'month'): Promise<BIEnvelope<CashFlowStatement>> {
    try {
      return await get<CashFlowStatement>('/financial-reports/cash-flow', period(value));
    } catch (error) {
      recordError('getCashFlow', error);
      throw error;
    }
  },

  /** Reporte de IVA del período (débito/crédito, balance y detalle mensual). */
  async getVat(value: DashboardPeriod = 'month'): Promise<BIEnvelope<VatReport>> {
    try {
      return await get<VatReport>('/financial-reports/vat', period(value));
    } catch (error) {
      recordError('getVat', error);
      throw error;
    }
  },

  /** Resumen fiscal (IVA + retenciones + posición neta). */
  async getTaxSummary(value: DashboardPeriod = 'month'): Promise<BIEnvelope<TaxSummary>> {
    try {
      return await get<TaxSummary>('/financial-reports/tax-summary', period(value));
    } catch (error) {
      recordError('getTaxSummary', error);
      throw error;
    }
  },

  /** Resumen financiero (`expenses` = compras; `net_income` = ingresos − compras). */
  async getOverview(
    value: DashboardPeriod = 'month',
  ): Promise<BIEnvelope<FinancialReportOverview>> {
    try {
      return await get<FinancialReportOverview>('/financial-reports/overview', period(value));
    } catch (error) {
      recordError('getOverview', error);
      throw error;
    }
  },

  /** Score de salud financiera 0-100 + rating y ratios. */
  async getHealthScore(
    value: DashboardPeriod = 'month',
  ): Promise<BIEnvelope<FinancialHealthScore>> {
    try {
      return await get<FinancialHealthScore>('/financial-reports/health-score', period(value));
    } catch (error) {
      recordError('getHealthScore', error);
      throw error;
    }
  },

  /**
   * Libro de ventas. Sin fechas usa el endpoint por período; con fechas
   * (y filtros SIFEN opcionales) usa `/sales-ledger/date-range`.
   */
  async getSalesLedger(params: SalesLedgerParams = {}): Promise<BIEnvelope<SalesLedger>> {
    try {
      if (hasRange(params)) {
        return await get<SalesLedger>('/financial-reports/sales-ledger/date-range', {
          start_date: params.start_date,
          end_date: params.end_date,
          page: params.page,
          page_size: params.page_size,
          estado: params.estado,
          cdc: params.cdc,
          timbrado: params.timbrado,
        });
      }
      return await get<SalesLedger>('/financial-reports/sales-ledger', {
        period: params.period,
        page: params.page,
        page_size: params.page_size,
      });
    } catch (error) {
      recordError('getSalesLedger', error);
      throw error;
    }
  },

  /** Libro de compras (sin filtros SIFEN: las compras no emiten DE). */
  async getPurchaseLedger(
    params: PurchaseLedgerParams = {},
  ): Promise<BIEnvelope<PurchaseLedger>> {
    try {
      if (hasRange(params)) {
        return await get<PurchaseLedger>('/financial-reports/purchase-ledger/date-range', {
          start_date: params.start_date,
          end_date: params.end_date,
          page: params.page,
          page_size: params.page_size,
        });
      }
      return await get<PurchaseLedger>('/financial-reports/purchase-ledger', {
        period: params.period,
        page: params.page,
        page_size: params.page_size,
      });
    } catch (error) {
      recordError('getPurchaseLedger', error);
      throw error;
    }
  },

  /** Historial de prorrateos de IVA (puede venir null = sin períodos). */
  async getProrrateoHistory(limit = 20): Promise<BIEnvelope<ProrrateoPeriod[]>> {
    try {
      return await get<ProrrateoPeriod[]>('/vat-prorrateo/history', { limit });
    } catch (error) {
      recordError('getProrrateoHistory', error);
      throw error;
    }
  },

  /** Detalle de un período de prorrateo (compras y porción deducible). */
  async getProrrateoDetails(periodId: number): Promise<BIEnvelope<ProrrateoDetail[]>> {
    try {
      return (await apiClient.get(
        `/vat-prorrateo/periods/${encodeURIComponent(String(periodId))}/details`,
      )) as BIEnvelope<ProrrateoDetail[]>;
    } catch (error) {
      recordError('getProrrateoDetails', error);
      throw error;
    }
  },
};

export default financialReportsService;
