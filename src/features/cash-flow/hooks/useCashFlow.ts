import { useState, useEffect, useCallback } from 'react';
import { payablesService } from '@/services/bi/payablesService';
import { tRaw } from '@/lib/i18n';
import type {
  CashFlowPoint,
  CashFlowStats,
  ScheduledPaymentGroup,
} from '../types';

export type CashFlowPeriod = '30D' | '60D' | '90D';

/** Día crudo de la proyección diaria (GET /payables/cash-flow → projection_days[]). */
interface ProjectionDay {
  date: string;
  inflows?: number | string;
  outflows?: number | string;
  cumulative_flow?: number | string;
}

/** Resumen de la proyección (mismo endpoint). */
interface CashFlowSummary {
  expected_inflows?: number | string;
  expected_outflows?: number | string;
  net_cash_flow?: number | string;
  projection_days?: ProjectionDay[];
}

/** Obligación del calendario (GET /payables/schedule → schedule[].items[]). */
interface ScheduleItem {
  payable_id?: string;
  supplier_name?: string;
  days_until_due?: number | null;
  priority?: string;
  amount?: number | string;
}

interface ScheduleBucket {
  date: string;
  total_due?: number | string;
  items?: ScheduleItem[];
}

/** El BE manda fechas date-only ('YYYY-MM-DD'), que `new Date()` parsea como
 * UTC medianoche → en TZ America/Asuncion (UTC-3) se mostraba el día ANTERIOR
 * (drift hallado por el test del hook, FASE 5). Se anclan a medianoche local. */
const parseDay = (dateStr: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(`${dateStr}T00:00:00`) : new Date(dateStr);

const formatDay = (dateStr: string) =>
  parseDay(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });

const isToday = (dateStr: string) =>
  parseDay(dateStr).toDateString() === new Date().toDateString();

const num = (v: number | string | undefined | null): number => Number(v ?? 0) || 0;

const EMPTY: {
  filteredData: CashFlowPoint[];
  stats: CashFlowStats;
  pendingPayments: ScheduledPaymentGroup[];
} = {
  filteredData: [],
  stats: { coverageRatio: 0, netFlow: 0, totalInflows: 0, totalOutflows: 0 },
  pendingPayments: [],
};

/**
 * Custom hook for the Cash Flow Projection page.
 * Fuentes reales (auditoría BI 2A): /payables/cash-flow (proyección diaria)
 * y /payables/schedule (obligaciones próximas del calendario). Sin datos de
 * bancos ni insights: no hay endpoint que los provea, la sección no se
 * muestra (regla FE-1: sin endpoint no se muestra).
 */
export const useCashFlow = () => {
  const [period, setPeriod] = useState<CashFlowPeriod>('30D');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(EMPTY);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = parseInt(period.replace('D', ''), 10);
      const [projRes, schedRes] = await Promise.all([
        payablesService.getCashFlowProjection(days),
        payablesService.getSchedule(days),
      ]);

      const cf: CashFlowSummary = projRes?.data || {};
      const cal = { schedule: (schedRes?.data as { schedule?: ScheduleBucket[] } | undefined)?.schedule || [] };

      // Gráfico de tendencias: proyección diaria real
      const filteredData: CashFlowPoint[] = (cf.projection_days || []).map((d) => ({
        name: formatDay(d.date),
        ingresos: num(d.inflows),
        egresos: num(d.outflows),
        balance: num(d.cumulative_flow),
      }));

      // KPIs reales de la proyección. Ratio de cobertura = cobros esperados
      // sobre pagos esperados (derivado, con guard de división por cero).
      const expectedInflows = num(cf.expected_inflows);
      const expectedOutflows = num(cf.expected_outflows);
      const stats: CashFlowStats = {
        coverageRatio: expectedOutflows > 0 ? expectedInflows / expectedOutflows : 0,
        netFlow: num(cf.net_cash_flow),
        totalInflows: expectedInflows,
        totalOutflows: expectedOutflows,
      };

      // Calendario agrupado por día: buckets reales del schedule
      const pendingPayments: ScheduledPaymentGroup[] = cal.schedule.map((bucket) => ({
        date: formatDay(bucket.date),
        isToday: isToday(bucket.date),
        subtotal: num(bucket.total_due),
        items: (bucket.items || []).map((it) => ({
          id: it.payable_id || '',
          code: (it.supplier_name || '??').substring(0, 2).toUpperCase(),
          name: it.supplier_name || tRaw('bi.cashflow.item.defaultSupplier', 'Proveedor', {}),
          description:
            it.days_until_due != null
              ? it.days_until_due >= 0
                ? tRaw('bi.cashflow.item.dueIn', 'Vence en {n} día{s}', { n: it.days_until_due, s: it.days_until_due === 1 ? '' : 's' })
                : tRaw('bi.cashflow.item.overdueBy', 'Vencido hace {n} día{s}', { n: Math.abs(it.days_until_due), s: Math.abs(it.days_until_due) === 1 ? '' : 's' })
              : tRaw('bi.cashflow.item.noDate', 'Fecha no disponible', {}),
          category: it.priority || tRaw('bi.cashflow.item.mediumPriority', 'MEDIA', {}),
          amount: num(it.amount),
          priority:
            it.priority === 'URGENT' || it.priority === 'HIGH'
              ? tRaw('bi.cashflow.item.highPriority', 'PRIORIDAD ALTA', {})
              : tRaw('bi.cashflow.item.scheduled', 'PROGRAMADO', {}),
        })),
      }));

      setData({ filteredData, stats, pendingPayments });
    } catch (err: any) {
      console.error('Error fetching cash flow data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    period,
    setPeriod,
    loading,
    error,
    filteredData: data.filteredData,
    stats: data.stats,
    pendingPayments: data.pendingPayments,
    refresh: fetchData,
  };
};
