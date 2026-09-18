import React, { useState, useEffect } from 'react';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';
import { InventoryDashboardData, InventoryOverview } from '../../types/inventoryAnalytics';
import { KPIWidget } from '../../components/InventoryAnalytics/Dashboard/KPIWidget';
import { StockStatusChart, StockStatusItem } from '../../components/InventoryAnalytics/Dashboard/StockStatusChart';
import { AlertsPanel, AlertItem } from '../../components/InventoryAnalytics/Dashboard/AlertsPanel';
import { ABCSummary, ABCItem } from '../../components/InventoryAnalytics/Dashboard/ABCSummary';
import { formatPYG, formatNumber } from '../../utils/currencyUtils';
// F1 (PLAN_ALINEACION_BI_FRONTEND): filas ABC extraídas a domain
import { buildAbcItems } from '@/domain/inventory-analytics/abc';

export const InventoryDashboard: React.FC = () => {
  const [data, setData] = useState<InventoryDashboardData | null>(null);
  const [overview, setOverview] = useState<InventoryOverview | null>(null); // Añadido para el overview
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, overviewRes] = await Promise.all([
          inventoryAnalyticsService.getDashboard(),
          inventoryAnalyticsService.getOverview()
        ]);

        if (dashboardRes.success) {
          setData(dashboardRes.data);
        }
        if (overviewRes.success) {
          setOverview(overviewRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Cargando dashboard de inventario...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-error">Error al cargar los datos del dashboard.</div>;
  }

  // Calculamos la ganancia de forma dinámica
  const potentialProfit = overview?.potential_profit || 
                         (overview?.total_value && overview?.total_cost ? (overview.total_value - overview.total_cost) : data.kpis.potential_profit);

  const stockStatusItems: StockStatusItem[] = [
    { label: 'En Stock', percentage: data.stock_status.in_stock_pct, count: data.stock_status.in_stock, colorClass: 'bg-success', strokeClass: 'stroke-emerald-500' },
    { label: 'Bajo Stock', percentage: data.stock_status.low_stock_pct, count: data.stock_status.low_stock, colorClass: 'bg-warning', strokeClass: 'stroke-amber-400' },
    { label: 'Sin Stock', percentage: data.stock_status.out_of_stock_pct, count: data.stock_status.out_of_stock, colorClass: 'bg-error', strokeClass: 'stroke-rose-500' },
    { label: 'Sobre-stock', percentage: data.stock_status.overstock_pct, count: data.stock_status.overstock, colorClass: 'bg-secondary', strokeClass: 'stroke-purple-500' },
  ];

  const getActionLabel = (type: string, severity: string) => {
    if (severity === 'CRITICAL') return 'Ver reporte detallado';
    if (type === 'OUT_OF_STOCK') return 'Generar orden de compra';
    if (type === 'LOW_STOCK') return 'Revisar stock mínimo';
    if (type === 'OVERSTOCK') return 'Crear promoción';
    if (type === 'DEAD_STOCK') return 'Liquidar producto';
    return 'Ver detalles';
  };

  const alerts: AlertItem[] = data.alerts.map((a, i) => ({
    id: `alert-${i}-${a.type}`,
    type: a.type.replace(/_/g, ' '), // Formatear tipo (ej: LOW_STOCK -> LOW STOCK)
    message: a.message,
    severity: a.severity,
    actionLabel: getActionLabel(a.type, a.severity),
    // Placeholder: la acción real del botón aún no está implementada; solo
    // loguear en dev (el build de producción elimina este console.log).
    onAction: () => {
      if (import.meta.env.DEV) {
        console.log(`Acción para alerta ${a.type}: ${a.message}`)
      }
    }
  }));

  const totalValueForABC = overview?.total_value || data.kpis.total_value;

  const abcItems: ABCItem[] = buildAbcItems(data.abc_summary, totalValueForABC);

  return (
    <main className="max-w-[1400px] mx-auto w-full p-6 space-y-6 font-display">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Dashboard de Inventario</h1>
          <p className="text-on-surface-deep text-sm font-medium">Vista analítica de existencias y KPIs financieros en Guaraníes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface border border-border-subtle px-3 py-2 rounded-lg text-sm font-bold shadow-sm font-mono text-on-surface-deep">
            <span className="material-symbols-outlined text-on-surface-deep text-lg">calendar_today</span>
            <span>Periodo: {new Date().toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })}</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget 
          title="Valor Total del Inventario"
          value={formatPYG(data.kpis.total_value)}
          icon="inventory"
        />
        <KPIWidget 
          title="Ganancia Potencial"
          value={formatPYG(potentialProfit)}
          icon="payments"
          iconColorClass="text-success"
          bgColorClass="bg-success/10 dark:bg-success/10"
        />
        <KPIWidget 
          title="Tasa de Rotación"
          value={`${formatNumber(data.kpis.turnover_rate)}x`}
          icon="sync_alt"
          iconColorClass="text-primary"
          bgColorClass="bg-primary/10 dark:bg-primary/10"
        />
        <KPIWidget 
          title="Stock Muerto"
          value={`${formatNumber(data.kpis.dead_stock_pct)}%`}
          icon="package_2"
          iconColorClass="text-warning"
          bgColorClass="bg-warning/10 dark:bg-warning/10"
        />
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6">
          <StockStatusChart 
            items={stockStatusItems} 
            totalLabel="Productos" 
            totalValue={(overview?.total_products || (data.stock_status.in_stock + data.stock_status.low_stock + data.stock_status.out_of_stock + data.stock_status.overstock)).toLocaleString('es-PY')}
          />
        </div>
        <div className="lg:col-span-4">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>

      {/* Bottom Section */}
      <ABCSummary items={abcItems} />
    </main>
  );
};

export default InventoryDashboard;
