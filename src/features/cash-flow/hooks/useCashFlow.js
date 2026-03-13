import { useState, useEffect, useCallback } from 'react';
import { payablesService } from '@/services/payablesService';

/**
 * Custom hook to handle Cash Flow logic with real API integration.
 */
export const useCashFlow = () => {
  const [period, setPeriod] = useState('30D');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    filteredData: [],
    stats: {
      coverageRatio: 0,
      netFlow: 0,
      totalInflows: 0,
      totalOutflows: 0
    },
    pendingPayments: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = parseInt(period.replace('D', ''));
      const response = await payablesService.getCashFlowProjection(days);
      
      if (response.success) {
        const cf = response.data;
        
        // Mapeo para el gráfico de tendencias (TrendChart)
        // La API devuelve daily_projection: [{date, inflows, outflows, balance}]
        const mappedChartData = cf.daily_projection?.map(d => ({
          name: new Date(d.date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
          ingresos: d.inflows,
          egresos: d.outflows,
          balance: d.balance
        })) || [];

        // Mapeo de estadísticas (KpiSection)
        const mappedStats = {
          coverageRatio: cf.summary?.coverage_ratio || 0,
          netFlow: cf.summary?.net_cash_flow || 0,
          totalInflows: cf.summary?.total_inflows || 0,
          totalOutflows: cf.summary?.total_outflows || 0
        };

        // Mapeo de pagos pendientes (PaymentCalendar)
        // La API devuelve upcoming_obligations: [{id, due_date, supplier_name, amount, priority}]
        const mappedPayments = cf.upcoming_obligations?.map(p => ({
          id: p.id,
          vendor: p.supplier_name,
          amount: p.amount,
          dueDate: new Date(p.due_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
          status: p.priority === 'URGENT' || p.priority === 'HIGH' ? 'Urgente' : 'Programado',
          priority: p.priority
        })) || [];

        setData({
          filteredData: mappedChartData,
          stats: mappedStats,
          pendingPayments: mappedPayments
        });
      }
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
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
    filteredData: data.filteredData,
    stats: data.stats,
    pendingPayments: data.pendingPayments,
    refresh: fetchData
  };
};
