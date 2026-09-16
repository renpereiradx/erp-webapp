import { useState, useEffect, useCallback } from 'react';
import { payablesService } from '@/services/bi/payablesService';

const formatDay = (dateStr) =>
  new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });

const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();

const EMPTY = {
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
  const [period, setPeriod] = useState('30D');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

      const cf = projRes?.data || {};
      const cal = schedRes?.data || {};

      // Gráfico de tendencias: proyección diaria real
      const filteredData = (cf.projection_days || []).map((d) => ({
        name: formatDay(d.date),
        ingresos: d.inflows,
        egresos: d.outflows,
        balance: d.cumulative_flow,
      }));

      // KPIs reales de la proyección. Ratio de cobertura = cobros esperados
      // sobre pagos esperados (derivado, con guard de división por cero).
      const stats = {
        coverageRatio:
          cf.expected_outflows > 0 ? cf.expected_inflows / cf.expected_outflows : 0,
        netFlow: cf.net_cash_flow || 0,
        totalInflows: cf.expected_inflows || 0,
        totalOutflows: cf.expected_outflows || 0,
      };

      // Calendario agrupado por día: buckets reales del schedule
      const pendingPayments = (cal.schedule || []).map((bucket) => ({
        date: formatDay(bucket.date),
        isToday: isToday(bucket.date),
        subtotal: bucket.total_due || 0,
        items: (bucket.items || []).map((it) => ({
          id: it.payable_id,
          code: (it.supplier_name || '??').substring(0, 2).toUpperCase(),
          name: it.supplier_name || 'Proveedor',
          description:
            it.days_until_due != null
              ? it.days_until_due >= 0
                ? `Vence en ${it.days_until_due} día${it.days_until_due === 1 ? '' : 's'}`
                : `Vencido hace ${Math.abs(it.days_until_due)} día${Math.abs(it.days_until_due) === 1 ? '' : 's'}`
              : 'Fecha no disponible',
          category: it.priority || 'MEDIA',
          amount: it.amount || 0,
          priority: it.priority === 'URGENT' || it.priority === 'HIGH' ? 'PRIORIDAD ALTA' : 'PROGRAMADO',
        })),
      }));

      setData({ filteredData, stats, pendingPayments });
    } catch (err) {
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
