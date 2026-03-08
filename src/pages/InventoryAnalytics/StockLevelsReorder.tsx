import React, { useState, useEffect } from 'react';
import { inventoryAnalyticsService } from '../../services/inventoryAnalyticsService';
import { StockLevelsData, ReorderAnalysis } from '../../types/inventoryAnalytics';
import { ReorderAlertCard } from '../../components/InventoryAnalytics/StockLevels/ReorderAlertCard';
import { StockLevelsTable } from '../../components/InventoryAnalytics/StockLevels/StockLevelsTable';

export const StockLevelsReorder: React.FC = () => {
  const [stockData, setStockData] = useState<StockLevelsData | null>(null);
  const [reorderData, setReorderData] = useState<ReorderAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, reorderRes] = await Promise.all([
          inventoryAnalyticsService.getStockLevels(),
          inventoryAnalyticsService.getReorderAnalysis()
        ]);
        
        if (stockRes.success) setStockData(stockRes.data);
        if (reorderRes.success) setReorderData(reorderRes.data);
      } catch (error) {
        console.error("Error fetching stock levels data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Cargando niveles de stock...</div>;
  }

  return (
    <main className="max-w-[1400px] mx-auto w-full p-6 space-y-6 font-display">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Niveles de Stock y Reabastecimiento</h1>
          <p className="text-slate-500 text-sm font-medium">Gestión detallada de existencias y alertas de reposición.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Buscar por producto, SKU o categoría..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                statusFilter === status 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Reorder Alerts */}
      {reorderData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReorderAlertCard 
            count={reorderData.summary.urgent_count}
            cost={`Gs. ${reorderData.summary.estimated_cost.toLocaleString('es-PY')}`}
            type="URGENT"
          />
          <ReorderAlertCard 
            count={reorderData.summary.soon_count}
            cost={`Gs. ${(reorderData.summary.estimated_cost * 0.4).toLocaleString('es-PY')}`}
            type="HIGH"
          />
        </div>
      )}

      {/* Main Table */}
      {stockData && (
        <StockLevelsTable products={stockData.products} />
      )}
    </main>
  );
};

export default StockLevelsReorder;
