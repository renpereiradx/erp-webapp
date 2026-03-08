import React, { useState, useEffect } from 'react';
import { inventoryAnalyticsService } from '../../services/inventoryAnalyticsService';
import { DeadStockAnalysis, StockForecast } from '../../types/inventoryAnalytics';
import { ImpactCard } from '../../components/InventoryAnalytics/Risk/ImpactCard';
import { DeadStockTable } from '../../components/InventoryAnalytics/Risk/DeadStockTable';
import { ForecastRiskList } from '../../components/InventoryAnalytics/Risk/ForecastRiskList';

export const InventoryRisk: React.FC = () => {
  const [deadStockData, setDeadStockData] = useState<DeadStockAnalysis | null>(null);
  const [forecastData, setStockForecast] = useState<StockForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deadRes, forecastRes] = await Promise.all([
          inventoryAnalyticsService.getDeadStock(),
          inventoryAnalyticsService.getForecast()
        ]);
        
        if (deadRes.success) setDeadStockData(deadRes.data);
        if (forecastRes.success) setStockForecast(forecastRes.data);
      } catch (error) {
        console.error("Error fetching risk data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Cargando análisis de riesgos...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col font-display">
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 py-8">
        {/* Title Section */}
        <div className="mb-8 font-display">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Riesgos y Stock Muerto (Gs.)</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Monitoreo de capital inmovilizado y predicción de quiebres de stock basados en demanda actual.</p>
        </div>

        {/* Impact Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {deadStockData && (
            <ImpactCard 
              title="Pérdida Potencial por Stock Muerto"
              value={`Gs. ${deadStockData.summary.potential_loss.toLocaleString('es-PY')}`}
              trend="vs. mes anterior (alto riesgo identificado)"
              trendValue="-12.4%"
              trendType="negative"
              icon="trending_down"
              iconColorClass="text-red-600"
              iconBgClass="bg-red-100 dark:bg-red-900/30"
            />
          )}
          {forecastData && (
            <ImpactCard 
              title="Valor de Reorden Recomendado"
              value={`Gs. ${forecastData.summary.reorder_value.toLocaleString('es-PY')}`}
              trend="necesario para mitigar riesgo de stockout (30d)"
              trendValue="+5.2%"
              trendType="positive"
              icon="shopping_cart_checkout"
              iconColorClass="text-primary"
              iconBgClass="bg-primary/10"
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dead Stock Table Section */}
          <div className="lg:col-span-2">
            {deadStockData && (
              <DeadStockTable products={deadStockData.products} />
            )}
          </div>

          {/* Stockout Forecast List Section */}
          <div className="lg:col-span-1">
            {forecastData && (
              <ForecastRiskList products={forecastData.risk_products} />
            )}
          </div>
        </div>
      </main>

      {/* Footer / Insight Area */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 border border-primary/10 shadow-sm">
            <div className="bg-primary text-white p-2 rounded-lg">
              <span className="material-symbols-outlined text-xl">lightbulb</span>
            </div>
            <div className="flex-1 font-display">
              <h4 className="text-sm font-bold text-primary mb-1 uppercase tracking-tight">Impacto del Capital Inmovilizado</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Actualmente, el <span className="font-bold font-mono">18% de su inventario</span> total califica como stock muerto. La ejecución de las liquidaciones recomendadas podría liberar un flujo de caja estimado de <span className="font-bold font-mono text-primary">Gs. 32.850.000</span> para reinvertir en productos de alta rotación identificados en el pronóstico.
              </p>
            </div>
            <button className="text-primary text-sm font-bold border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all whitespace-nowrap uppercase tracking-wider">
              Ver Plan de Mitigación
            </button>
          </div>
          <div className="mt-6 flex justify-between items-center text-xs text-slate-400 font-mono">
            <p>© 2024 ERP Inventario - Módulo de Inteligencia de Riesgos</p>
            <p>Última actualización: Hoy, 08:45 AM</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InventoryRisk;
