import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';
import { StockLevelsData, ReorderAnalysis } from '../../types/inventoryAnalytics';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { ReorderAlertCard } from '../../components/InventoryAnalytics/StockLevels/ReorderAlertCard';
import { StockLevelsTable, StockLevelsTableRow } from '../../components/InventoryAnalytics/StockLevels/StockLevelsTable';
import { formatPYG } from '../../utils/currencyUtils';

export const StockLevelsReorder: React.FC = () => {
  const { t } = useI18n();
  const [stockData, setStockData] = useState<StockLevelsData | null>(null);
  const [reorderData, setReorderData] = useState<ReorderAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reorderTypeFilter, setReorderTypeFilter] = useState<'ALL' | 'URGENT' | 'SOON'>('ALL');

  const statusOptions = [
    { id: 'ALL', key: 'bi.inventory.filter.all', fallback: 'Todos' },
    { id: 'IN_STOCK', key: 'bi.inventory.stockStatus.inStock', fallback: 'En Stock' },
    { id: 'LOW_STOCK', key: 'bi.inventory.stockStatus.low', fallback: 'Bajo Stock' },
    { id: 'OUT_OF_STOCK', key: 'bi.inventory.stockStatus.out', fallback: 'Sin Stock' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // stock-levels es el endpoint primario (tabla + pager); reorder es el
      // secundario: si falla, la página degrada sin las tarjetas de alerta.
      const [stockRes, reorderRes] = await Promise.allSettled([
        inventoryAnalyticsService.getStockLevels({ page, page_size: 20 }),
        inventoryAnalyticsService.getReorderAnalysis(),
      ]);

      if (stockRes.status === 'fulfilled' && stockRes.value.success) {
        setStockData(stockRes.value.data);
        setTotalPages(stockRes.value.data?.pagination?.total_pages || 1);
      } else {
        const reason = stockRes.status === 'rejected' ? stockRes.reason : null;
        setError(reason instanceof Error ? reason.message : 'error');
        setStockData(null);
      }

      if (reorderRes.status === 'fulfilled' && reorderRes.value.success) {
        setReorderData(reorderRes.value.data);
      } else {
        setReorderData(null);
      }
    } catch (err) {
      console.error('Error fetching stock levels data:', err);
      setError(err instanceof Error ? err.message : 'error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Helper to resolve a unified status string
  const resolveUnifiedStatus = (product: Record<string, any>) => {
    const raw = product.status || product.priority || '';
    if (raw === 'URGENT' || raw === 'OUT_OF_STOCK') return 'OUT_OF_STOCK';
    if (raw === 'HIGH' || raw === 'LOW_STOCK' || raw === 'MEDIUM') return 'LOW_STOCK';
    if (raw === 'OVERSTOCK') return 'OVERSTOCK';
    return 'IN_STOCK';
  };

  // Filter products based on search term, status and reorder type
  const filteredProducts = useMemo<StockLevelsTableRow[]>(() => {
    const base: StockLevelsTableRow[] =
      reorderTypeFilter === 'URGENT' ? reorderData?.urgent_reorders || []
      : reorderTypeFilter === 'SOON' ? reorderData?.soon_reorders || []
      : stockData?.products || [];

    const term = searchTerm.toLowerCase();
    return base.filter((product) => {
      const name = product.product_name || '';
      const sku = product.sku || '';
      const category = product.category_name || '';

      const matchesSearch =
        name.toLowerCase().includes(term) ||
        sku.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term);

      const unifiedStatus = resolveUnifiedStatus(product);
      const matchesStatus = statusFilter === 'ALL' || unifiedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stockData, reorderData, searchTerm, statusFilter, reorderTypeFilter]);

  // Calculate estimated cost for "Soon" reorders
  const urgentCost = reorderData?.urgent_reorders.reduce((sum, p) => sum + p.estimated_cost, 0) || 0;
  const soonCost = reorderData?.soon_reorders.reduce((sum, p) => sum + p.estimated_cost, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.inventory.breadcrumb', 'Inventario', {})}
          title={t('bi.inventory.stock.title', 'Niveles de Stock y Reabastecimiento', {})}
          subtitle={t('bi.inventory.stock.subtitle', 'Gestión detallada de existencias y alertas de reposición.', {})}
          actions={
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-sm font-bold text-foreground hover:bg-surface-muted transition-colors"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              {t('action.refresh', 'Actualizar', {})}
            </button>
          }
        />

        {loading ? (
          <div className="space-y-lg mt-lg" aria-busy="true" data-testid="inventory-stock-skeleton">
            <div className="h-14 bg-surface-muted rounded-md animate-pulse" />
            <div className="h-96 bg-surface-muted rounded-md animate-pulse" />
          </div>
        ) : error ? (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.inventory.stock.errorTitle', 'No se pudieron cargar los niveles de stock', {})}
              message={error}
              onRetry={refetch}
            />
          </div>
        ) : !stockData ? (
          <div className="mt-lg">
            <EmptyState
              title={t('bi.inventory.stock.emptyTitle', 'Sin productos con datos de stock', {})}
              actionLabel={t('action.refresh', 'Actualizar', {})}
              onAction={refetch}
            />
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="bg-surface p-4 rounded-xl border border-border-subtle flex flex-wrap gap-4 items-center shadow-sm mt-lg">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep">search</span>
                  <input
                    type="text"
                    placeholder={t('bi.inventory.stock.searchPlaceholder', 'Buscar por producto, SKU o categoría...', {})}
                    aria-label={t('bi.inventory.stock.searchPlaceholder', 'Buscar por producto, SKU o categoría...', {})}
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
                    {t('bi.inventory.stock.clearReorderFilter', 'Quitar Filtro Reorden', {})}
                  </button>
                )}
                <div className="h-8 w-[1px] bg-surface-subtle mx-2 hidden md:block"></div>
                {statusOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStatusFilter(opt.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                      statusFilter === opt.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-muted dark:bg-surface-deep text-on-surface-deep hover:bg-surface-subtle'
                    }`}
                  >
                    {t(opt.key, opt.fallback, {})}
                  </button>
                ))}
              </div>
            </div>

            {/* Reorder Alerts */}
            {reorderData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-lg">
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
            <div className="mt-lg">
              <StockLevelsTable
                products={filteredProducts}
                totalItems={stockData.pagination.total_items}
              />
            </div>

            {/* Paginación server-side (T9: el BE pagina, el FE consume) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-4 mt-lg">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-surface-muted text-on-surface-deep disabled:opacity-50"
                >
                  {t('bi.common.prev', 'Anterior', {})}
                </button>
                <span className="text-xs text-on-surface-deep">
                  {t('bi.logs.page', 'Página', {})} {page} {t('bi.logs.of', 'de', {})} {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-surface-muted text-on-surface-deep disabled:opacity-50"
                >
                  {t('bi.common.next', 'Siguiente', {})}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StockLevelsReorder;
