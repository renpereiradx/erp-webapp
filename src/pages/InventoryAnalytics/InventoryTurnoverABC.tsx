import React, { useState, useEffect } from 'react';
import { inventoryAnalyticsService } from '../../services/inventoryAnalyticsService';
import { SummaryCard } from '../../components/InventoryAnalytics/SummaryCard';
import { CategoryTurnoverTable } from '../../components/InventoryAnalytics/CategoryTurnoverTable';
import { ABCParetoChart } from '../../components/InventoryAnalytics/ABCParetoChart';
import { formatNumber } from '../../utils/currencyUtils';

export const InventoryTurnoverABC: React.FC = () => {
  const [period, setPeriod] = useState('mes');
  const [data, setData] = useState<any>(null); // Simplified typing here
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await inventoryAnalyticsService.getTurnover(period as any);
        if (response.success) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching turnover data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) {
    return <div className="p-8 text-center">Cargando análisis de rotación y ABC...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-rose-500">Error al cargar los datos.</div>;
  }

  return (
    <div className="w-full max-w-[1200px] px-6 flex flex-col gap-8 mx-auto py-8 font-display">
      {/* Page Title & Period Control */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight uppercase">Análisis de Rotación y ABC</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Análisis detallado de rotación por categoría y valorización ABC en Guaraníes (Gs.)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-10 items-center rounded-lg bg-slate-200/50 dark:bg-slate-800 p-1 shadow-sm font-mono">
            {['hoy', 'semana', 'mes', 'año'].map((p) => (
              <label key={p} className="flex cursor-pointer h-full items-center justify-center rounded px-4 text-sm font-bold text-slate-500 hover:text-slate-900 transition-all has-[:checked]:bg-white has-[:checked]:text-primary has-[:checked]:shadow-sm">
                <span className="capitalize">{p}</span>
                <input 
                  className="hidden" 
                  name="periodo" 
                  type="radio" 
                  value={p} 
                  checked={period === p}
                  onChange={() => setPeriod(p)}
                />
              </label>
            ))}
          </div>
          <button className="flex h-10 px-4 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard 
          title="Tasa Promedio de Rotación"
          icon="sync_alt"
          value={`${formatNumber(data.overall?.turnover_rate)}x`}
          changeValue={data.overall?.turnover_rate_change || 0}
          changeDescription={`Vs. periodo anterior (${period})`}
          isPositiveGood={true}
        />
        <SummaryCard 
          title="Días Promedio de Inventario"
          icon="calendar_today"
          value={`${Math.round(data.overall?.days_of_inventory || 0)} días`}
          changeValue={data.overall?.days_of_inventory_change || 0}
          changeDescription="Eficiencia en la gestión de stock"
          isPositiveGood={false}
        />
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CategoryTurnoverTable categories={data.by_category || []} />
        <ABCParetoChart 
          classAProducts={data.abc_class_a || data.class_a || []} 
          classAPct={data.abc_summary?.class_a_value_pct || data.overall?.class_a_pct}
          classBPct={data.abc_summary?.class_b_value_pct || data.overall?.class_b_pct}
          classCPct={data.abc_summary?.class_c_value_pct || data.overall?.class_c_pct}
        />
      </div>
    </div>
  );
};

export default InventoryTurnoverABC;
