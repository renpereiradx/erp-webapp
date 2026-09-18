/**
 * Hooks por recurso para reportes financieros (FASE 6 del plan de
 * alineación BI). Antes: un único useFinancialReports con 10 fetchers
 * compartiendo loading/error. El monolito @/hooks/useFinancialReports
 * queda deprecado para sus consumers aún no migrados (LegalBooks,
 * FinancialSummaryDashboard).
 */
import { useCallback } from 'react';
import { financialReportsService } from '@/services/bi/financialReportsService';
import { useFinancialResource } from './useFinancialResource';

export function useIncomeStatement() {
  const { data: incomeStatement, loading, error, fetch } = useFinancialResource<any>(
    useCallback((period = 'month', compare = true) => financialReportsService.getIncomeStatement({ period, compare }), []),
    'bi.financial.errors.incomeStatement',
  );
  return { incomeStatement, loading, error, fetchIncomeStatement: fetch };
}

export function useCashFlowReport() {
  const { data: cashFlow, loading, error, fetch } = useFinancialResource<any>(
    useCallback((period = 'month') => financialReportsService.getCashFlow(period), []),
    'bi.financial.errors.cashFlow',
  );
  return { cashFlow, loading, error, fetchCashFlow: fetch };
}

export function useVatReport() {
  const { data: vatReport, loading, error, fetch } = useFinancialResource<any>(
    useCallback((period = 'month') => financialReportsService.getVat(period), []),
    'bi.financial.errors.vatReport',
  );
  return { vatReport, loading, error, fetchVatReport: fetch };
}

export function useTaxSummary() {
  const { data: taxSummary, loading, error, fetch } = useFinancialResource<any>(
    useCallback((period = 'month') => financialReportsService.getTaxSummary(period), []),
    'bi.financial.errors.taxSummary',
  );
  return { taxSummary, loading, error, fetchTaxSummary: fetch };
}

export function useHealthScore() {
  const { data: healthScore, loading, error, fetch } = useFinancialResource<any>(
    useCallback(() => financialReportsService.getHealthScore(), []),
    'bi.financial.errors.healthScore',
  );
  return { healthScore, loading, error, fetchHealthScore: fetch };
}
