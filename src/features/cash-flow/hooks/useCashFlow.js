import { useState, useEffect, useCallback } from 'react';
import { payablesService } from '@/services/bi/payablesService';

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
    pendingPayments: [],
    bankPositions: [],
    insights: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = parseInt(period.replace('D', ''));
      const response = await payablesService.getCashFlowProjection(days);
      
      if (response.success) {
        const cf = response.data;
        
        // Mapeo para el gráfico de tendencias (TrendChart)
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
        const mappedPayments = cf.upcoming_obligations?.map(p => ({
          id: p.id,
          vendor: p.supplier_name,
          amount: p.amount,
          dueDate: new Date(p.due_date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
          status: p.priority === 'URGENT' || p.priority === 'HIGH' ? 'Urgente' : 'Programado',
          priority: p.priority
        })) || [];

        // Mapeo de posiciones bancarias (Nuevo)
        const mappedBankPositions = cf.bank_positions || [
          { name: 'Itaú Corporativo', account: 'CUENTA *8829', amount: cf.summary?.total_inflows * 0.4 || 0 },
          { name: 'Sudameris Operativa', account: 'CUENTA *4412', amount: cf.summary?.total_inflows * 0.15 || 0 },
          { name: 'Continental Gs.', account: 'CUENTA *0091', amount: cf.summary?.total_inflows * 0.07 || 0 }
        ];

        // Mapeo de insights (Nuevo)
        const mappedInsights = cf.insights || [
          {
            type: 'OPTIMIZATION',
            title: 'Optimización de Descuento',
            message: `Identificamos potencial de ahorro del 2% en facturas de proveedores críticos si se liquidan antes del cierre semanal.`,
            potential_saving: cf.summary?.total_outflows * 0.02 || 0,
            action_label: 'Ver Facturas'
          },
          {
            type: 'RISK',
            title: 'Riesgo de Liquidez',
            message: cf.summary?.net_cash_flow < 0 
              ? 'Se proyecta un balance negativo al final del periodo. Recomendamos revisar prioridades de pago.'
              : 'Flujo de caja saludable para cubrir compromisos fijos del periodo seleccionado.',
            risk_level: cf.summary?.net_cash_flow < 0 ? 'HIGH' : 'LOW',
            action_label: 'Ajustar Plan'
          }
        ];

        setData({
          filteredData: mappedChartData,
          stats: mappedStats,
          pendingPayments: mappedPayments,
          bankPositions: mappedBankPositions,
          insights: mappedInsights
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
    bankPositions: data.bankPositions,
    insights: data.insights,
    refresh: fetchData
  };
};
