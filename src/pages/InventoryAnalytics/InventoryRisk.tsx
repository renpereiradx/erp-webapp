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
              trend="capital inmovilizado identificado"
              trendValue={`${deadStockData.summary.percentage_of_stock.toFixed(1)}%`}
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
              trend={`para mitigar riesgo en ${forecastData.forecast_days} días`}
              trendValue={`${forecastData.summary.products_at_risk}`}
              trendType="positive"
              icon="shopping_cart_checkout"
              iconColorClass="text-primary"
              iconBgClass="bg-primary/10"
            />
          )}
        </div>

        <div className="flex flex-col gap-10">
          {/* Section 1: Dead Stock Analysis (Full Width) */}
          <section>
            {deadStockData && (
              <DeadStockTable products={deadStockData.products} />
            )}
          </section>

          {/* Section 2: Stockout Forecast (Grid distribution) */}
          <section>
            {forecastData && (
              <ForecastRiskList products={forecastData.risk_products} />
            )}
          </section>
        </div>
      </main>

      {/* Footer / Insight Area */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 py-8">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
            {/* Accent decoration */}
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            
            <div className="bg-primary/10 text-primary p-4 rounded-2xl shrink-0">
              <span className="material-symbols-outlined text-4xl">analytics</span>
            </div>
            
            <div className="flex-1 font-display">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Análisis de Capital Inmovilizado</h4>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Acción Recomendada</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-base">
                Su inventario presenta un <span className="font-black font-mono text-rose-600 text-lg">{deadStockData?.summary.percentage_of_stock.toFixed(1)}% de stock sin movimiento</span>. 
                La ejecución inmediata de las liquidaciones sugeridas liberaría un flujo de caja de <span className="font-black font-mono text-primary text-xl underline decoration-primary/30 underline-offset-4">Gs. {deadStockData?.summary.potential_loss.toLocaleString('es-PY')}</span>, 
                capital crítico para cubrir el reabastecimiento de los <span className="font-bold text-slate-900 dark:text-white">{forecastData?.summary.products_at_risk} productos en riesgo</span> de agotamiento detectados.
              </p>
            </div>
            
            <div className="shrink-0 w-full md:w-auto">
              <button 
                onClick={() => alert("Generando plan de liquidación y reabastecimiento estratégico...")}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/20 uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
              >
                Ejecutar Plan de Mitigación
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InventoryRisk;
