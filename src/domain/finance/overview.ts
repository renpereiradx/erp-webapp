/**
 * Resumen financiero y salud financiera (F9).
 *
 * `FinancialReportOverview.expenses` son COMPRAS del período y
 * `net_income = revenue - purchases`: no es utilidad contable (el P&L usa
 * COGS). La vista lo expone con nombres propios y NO incluye los ratios que el
 * repo deja en 0 (DSO/DPO/rotaciones) ni los márgenes del overview (se basan
 * en compras, no en costo de ventas; el margen correcto vive en el P&L).
 */
import type { FinancialHealthScore, FinancialReportOverview } from '@/types/bi'
import { toNumberOrNull } from './format'
import type { FinanceKpiValue } from './kpis'

export interface FinancialOverviewView {
  revenue: number | null
  purchases: number | null
  revenueMinusPurchases: number | null
  cashPosition: number | null
  receivables: number | null
  payables: number | null
  workingCapital: number | null
  currentRatio: number | null
  quickRatio: number | null
}

export const financialOverviewView = (
  overview: FinancialReportOverview | null | undefined,
): FinancialOverviewView | null => {
  if (!overview) return null
  return {
    revenue: toNumberOrNull(overview.revenue),
    purchases: toNumberOrNull(overview.expenses),
    revenueMinusPurchases: toNumberOrNull(overview.net_income),
    cashPosition: toNumberOrNull(overview.cash_position),
    receivables: toNumberOrNull(overview.receivables),
    payables: toNumberOrNull(overview.payables),
    workingCapital: toNumberOrNull(overview.working_capital),
    currentRatio: toNumberOrNull(overview.key_ratios?.current_ratio),
    quickRatio: toNumberOrNull(overview.key_ratios?.quick_ratio),
  }
}

/** KPIs del resumen: ingresos, compras, resultado, caja y balance. */
export const financialOverviewKpis = (view: FinancialOverviewView): FinanceKpiValue[] => [
  { id: 'revenue', kind: 'money', value: view.revenue },
  { id: 'purchases', kind: 'money', value: view.purchases },
  { id: 'revenueMinusPurchases', kind: 'money', value: view.revenueMinusPurchases },
  { id: 'cashPosition', kind: 'money', value: view.cashPosition },
  { id: 'receivables', kind: 'money', value: view.receivables },
  { id: 'payables', kind: 'money', value: view.payables },
  { id: 'workingCapital', kind: 'money', value: view.workingCapital },
]

/** Ratios que el backend SÍ calcula (corriente y rápido). */
export const financialRatioKpis = (view: FinancialOverviewView): FinanceKpiValue[] => [
  { id: 'currentRatio', kind: 'ratio', value: view.currentRatio },
  { id: 'quickRatio', kind: 'ratio', value: view.quickRatio },
]

export interface HealthScoreView {
  score: number | null
  rating: string
  currentRatio: number | null
  quickRatio: number | null
  netMarginPct: number | null
  workingCapital: number | null
  periodStart: string | null
  periodEnd: string | null
}

export const healthScoreView = (
  score: FinancialHealthScore | null | undefined,
): HealthScoreView | null => {
  if (!score) return null
  return {
    score: toNumberOrNull(score.score),
    rating: score.rating ?? '',
    currentRatio: toNumberOrNull(score.current_ratio),
    quickRatio: toNumberOrNull(score.quick_ratio),
    netMarginPct: toNumberOrNull(score.net_margin),
    workingCapital: toNumberOrNull(score.working_capital),
    periodStart: score.period_start ?? null,
    periodEnd: score.period_end ?? null,
  }
}
