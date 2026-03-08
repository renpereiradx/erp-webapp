import React, { useState, useEffect } from 'react';
import { inventoryAnalyticsService } from '../../services/inventoryAnalyticsService';
import { InventoryDashboardData } from '../../types/inventoryAnalytics';
import { KPIWidget } from '../../components/InventoryAnalytics/Dashboard/KPIWidget';
import { StockStatusChart, StockStatusItem } from '../../components/InventoryAnalytics/Dashboard/StockStatusChart';
import { AlertsPanel, AlertItem } from '../../components/InventoryAnalytics/Dashboard/AlertsPanel';
import { ABCSummary, ABCItem } from '../../components/InventoryAnalytics/Dashboard/ABCSummary';

export const InventoryDashboard: React.FC = () => {
  const [data, setData] = useState<InventoryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await inventoryAnalyticsService.getDashboard();
        if (response.success) {
          setData(response.data);
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
    return <div className="p-8 text-center text-rose-500">Error al cargar los datos del dashboard.</div>;
  }

  const stockStatusItems: StockStatusItem[] = [
    { label: 'En Stock', percentage: data.stock_status.in_stock_pct, count: data.stock_status.in_stock, colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500' },
    { label: 'Bajo Stock', percentage: data.stock_status.low_stock_pct, count: data.stock_status.low_stock, colorClass: 'bg-amber-400', strokeClass: 'stroke-amber-400' },
    { label: 'Sin Stock', percentage: data.stock_status.out_of_stock_pct, count: data.stock_status.out_of_stock, colorClass: 'bg-rose-500', strokeClass: 'stroke-rose-500' },
    { label: 'Sobre-stock', percentage: data.stock_status.overstock_pct, count: data.stock_status.overstock, colorClass: 'bg-purple-500', strokeClass: 'stroke-purple-500' },
  ];

  const alerts: AlertItem[] = data.alerts.map((a, i) => ({
    id: `alert-${i}`,
    type: a.type,
    message: a.message,
    severity: a.severity,
    actionLabel: a.severity === 'CRITICAL' ? 'Ver reporte' : 'Generar orden'
  }));

  const abcItems: ABCItem[] = [
    { class: 'A', label: 'Productos Vitales', percentage: data.abc_summary.class_a_value_pct, count: data.abc_summary.class_a_count, value: `Gs. ${(data.kpis.total_value * data.abc_summary.class_a_value_pct / 100).toLocaleString('es-PY')}`, description: '' },
    { class: 'B', label: 'Productos Medios', percentage: data.abc_summary.class_b_value_pct, count: data.abc_summary.class_b_count, value: `Gs. ${(data.kpis.total_value * data.abc_summary.class_b_value_pct / 100).toLocaleString('es-PY')}`, description: '' },
    { class: 'C', label: 'Productos Menores', percentage: data.abc_summary.class_c_value_pct, count: data.abc_summary.class_c_count, value: `Gs. ${(data.kpis.total_value * data.abc_summary.class_c_value_pct / 100).toLocaleString('es-PY')}`, description: '' },
  ];

  return (
    <main className="max-w-[1400px] mx-auto w-full p-6 space-y-6 font-display">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Dashboard de Inventario</h1>
          <p className="text-slate-500 text-sm font-medium">Vista analítica de existencias y KPIs financieros en Guaraníes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-sm font-bold shadow-sm font-mono">
            <span className="material-symbols-outlined text-slate-400 text-lg">calendar_today</span>
            <span>Periodo: Actual</span>
            <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
          </div>
          <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-lg">refresh</span>
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget 
          title="Valor Total del Inventario"
          value={`Gs. ${data.kpis.total_value.toLocaleString('es-PY')}`}
          icon="inventory"
          trend="+4.5% vs mes anterior"
          trendType="positive"
        />
        <KPIWidget 
          title="Ganancia Potencial"
          value={`Gs. ${(data.kpis.total_value * 0.28).toLocaleString('es-PY')}`} // Simulated calculation
          icon="payments"
          iconColorClass="text-emerald-500"
          bgColorClass="bg-emerald-50 dark:bg-emerald-500/10"
          trend="+12.3% proyectado"
          trendType="positive"
        />
        <KPIWidget 
          title="Tasa de Rotación"
          value={`${data.kpis.turnover_rate}x`}
          icon="sync_alt"
          iconColorClass="text-blue-500"
          bgColorClass="bg-blue-50 dark:bg-blue-500/10"
          badge="En Meta"
        />
        <KPIWidget 
          title="Stock Muerto"
          value={`${data.kpis.dead_stock_pct}%`}
          icon="package_2"
          iconColorClass="text-amber-500"
          bgColorClass="bg-amber-50 dark:bg-amber-500/10"
          badge="Alerta Moderada"
        />
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-6">
          <StockStatusChart items={stockStatusItems} />
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
