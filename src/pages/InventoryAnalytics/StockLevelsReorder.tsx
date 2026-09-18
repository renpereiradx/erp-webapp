import React, { useState, useEffect } from 'react';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';
import { StockLevelsData, ReorderAnalysis } from '../../types/inventoryAnalytics';
import { ReorderAlertCard } from '../../components/InventoryAnalytics/StockLevels/ReorderAlertCard';
import { StockLevelsTable } from '../../components/InventoryAnalytics/StockLevels/StockLevelsTable';
import { formatPYG } from '../../utils/currencyUtils';

export const StockLevelsReorder: React.FC = () => {
  const [stockData, setStockData] = useState<StockLevelsData | null>(null);
  const [reorderData, setReorderData] = useState<ReorderAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reorderTypeFilter, setReorderTypeFilter] = useState<'ALL' | 'URGENT' | 'SOON'>('ALL');

  const statusOptions = [
    { id: 'ALL', label: 'Todos' },
    { id: 'IN_STOCK', label: 'En Stock' },
    { id: 'LOW_STOCK', label: 'Bajo Stock' },
    { id: 'OUT_OF_STOCK', label: 'Sin Stock' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [stockRes, reorderRes] = await Promise.all([
          inventoryAnalyticsService.getStockLevels({ page, page_size: 20 }),
          inventoryAnalyticsService.getReorderAnalysis()
        ]);

        if (stockRes.success) {
          setStockData(stockRes.data);
          setTotalPages(stockRes.data?.pagination?.total_pages || 1);
        }
        if (reorderRes.success) setReorderData(reorderRes.data);
      } catch (error) {
        console.error("Error fetching stock levels data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]);

  // Determine the base list of products to filter
  const getBaseProducts = () => {
    if (reorderTypeFilter === 'URGENT') return reorderData?.urgent_reorders || [];
    if (reorderTypeFilter === 'SOON') return reorderData?.soon_reorders || [];
    return stockData?.products || [];
  };

  // Helper to resolve a unified status string
  const resolveUnifiedStatus = (product: Record<string, any>) => {
    const raw = product.status || product.priority || '';
    if (raw === 'URGENT' || raw === 'OUT_OF_STOCK') return 'OUT_OF_STOCK';
    if (raw === 'HIGH' || raw === 'LOW_STOCK' || raw === 'MEDIUM') return 'LOW_STOCK';
    if (raw === 'OVERSTOCK') return 'OVERSTOCK';
    return 'IN_STOCK';
  };

  // Filter products based on search term, status and reorder type
  const filteredProducts = getBaseProducts().filter(product => {
    const name = product.product_name || '';
    const sku = product.sku || '';
    const category = product.category_name || '';

    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const unifiedStatus = resolveUnifiedStatus(product);
    const matchesStatus = statusFilter === 'ALL' || unifiedStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate estimated cost for "Soon" reorders
  const urgentCost = reorderData?.urgent_reorders.reduce((sum, p) => sum + p.estimated_cost, 0) || 0;
  const soonCost = reorderData?.soon_reorders.reduce((sum, p) => sum + p.estimated_cost, 0) || 0;

  if (loading) {
    return <div className="p-8 text-center">Cargando niveles de stock...</div>;
  }

  return (
    <main className="max-w-[1400px] mx-auto w-full p-6 space-y-6 font-display">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Niveles de Stock y Reabastecimiento</h1>
          <p className="text-on-surface-deep text-sm font-medium">Gestión detallada de existencias y alertas de reposición.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface p-4 rounded-xl border border-border-subtle flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep">search</span>
            <input 
              type="text" 
              placeholder="Buscar por producto, SKU o categoría..."
              className="w-full pl-10 pr-4 py-2 bg-surface-muted border-none rounded-lg focus:ring-2 focus:ring-primary text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {reorderTypeFilter !== 'ALL' && (
            <button 
              onClick={() => setReorderTypeFilter('ALL')}
              className="px-3 py-2 bg-error/10 text-error rounded-lg text-xs font-bold flex items-center gap-1 animate-pulse border border-error/20"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Quitar Filtro Reorden
            </button>
          )}
          <div className="h-8 w-[1px] bg-surface-subtle mx-2 hidden md:block"></div>
          {statusOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                statusFilter === opt.id 
                ? 'bg-primary text-white shadow-whisper' 
                : 'bg-surface-muted dark:bg-surface-deep text-on-surface-deep dark:text-on-surface-deep hover:bg-surface-subtle'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reorder Alerts */}
      {reorderData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReorderAlertCard 
            count={reorderData.summary.urgent_count}
            cost={formatPYG(urgentCost)}
            type="URGENT"
            onClick={() => setReorderTypeFilter('URGENT')}
          />
          <ReorderAlertCard 
            count={reorderData.summary.soon_count}
            cost={formatPYG(soonCost)}
            type="HIGH"
            onClick={() => setReorderTypeFilter('SOON')}
          />
        </div>
      )}

      {/* Main Table */}
      {stockData && (
        <StockLevelsTable 
          products={filteredProducts} 
          totalItems={stockData.pagination.total_items}
        />
      )}

      {/* Paginación server-side (T9: el BE pagina, el FE consume) */}
      {stockData && totalPages > 1 && (
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-surface-muted text-on-surface-deep disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-xs text-on-surface-deep">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-surface-muted text-on-surface-deep disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
};

export default StockLevelsReorder;
