import { useEffect, useMemo, useState } from 'react';
import useDashboardStore from '@/store/useDashboardStore';
import { formatPYG } from '@/utils/currencyUtils';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import { PackageSearch, Search } from 'lucide-react';

/**
 * Rendimiento de Productos Top.
 * Migración FASE 5: .tsx + PageHeader + tokens. Honestidad (§2.6): la
 * paginación dummy (Anterior/Siempre disabled), los checkboxes sin estado,
 * el botón Exportar sin handler, el botón Filtros sin handler y el menú
 * "más" por fila se eliminaron.
 */
const TopProductsOverview = () => {
  const { t } = useI18n();
  const topProducts = useDashboardStore((s) => s.topProducts);
  const topProductsMetrics = useDashboardStore((s) => s.topProductsMetrics);
  const alerts = useDashboardStore((s) => s.alerts);
  const fetchTopProducts = useDashboardStore((s) => s.fetchTopProducts);
  const fetchDashboardData = useDashboardStore((s) => s.fetchDashboardData);
  const loading = useDashboardStore((s) => s.loadingBySlice.topProducts);
  const error = useDashboardStore((s) => s.errorBySlice.topProducts);
  const summary = useDashboardStore((s) => s.summary);

  const [period, setPeriod] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(() => {
    fetchTopProducts(period, 10, sortBy);
  }, [fetchTopProducts, period, sortBy]);

  useEffect(() => {
    // Carga la data del dashboard global solo si no existe en el store
    // Esto evita hacer 8 requests a la API cada vez que se abre esta pestaña.
    if (!summary) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDashboardData]);

  const topPerformer = topProducts && topProducts.length > 0 ? topProducts[0] : null;

  const inventoryAlertsCount = useMemo(() => {
    if (!alerts) return 0;
    return alerts.filter((a) => a.category === 'inventory' || a.category?.includes('inv')).length;
  }, [alerts]);

  const filteredProducts = useMemo(() => {
    if (!topProducts) return [];
    if (!searchQuery) return topProducts;
    const query = searchQuery.toLowerCase();
    return topProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        String(p.id).includes(query),
    );
  }, [topProducts, searchQuery]);

  const getProfitabilityStyle = (margin?: number | null) => {
    if (margin == null)
      return { tone: 'text-foreground', dot: 'bg-on-surface-deep/40', text: '-' };
    if (margin >= 40)
      return { tone: 'text-success', dot: 'bg-success', text: t('bi.dashboard.topProducts.highMargin', 'Alto Margen', {}) };
    if (margin >= 20)
      return { tone: 'text-primary', dot: 'bg-primary', text: t('bi.dashboard.topProducts.goodMargin', 'Buen Margen', {}) };
    if (margin > 0)
      return { tone: 'text-warning', dot: 'bg-warning', text: t('bi.dashboard.topProducts.lowMargin', 'Margen Bajo', {}) };
    return { tone: 'text-error', dot: 'bg-error', text: t('bi.dashboard.topProducts.loss', 'Pérdida', {}) };
  };

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case 'today':
        return t('dashboard.dashboard.actions.today', 'Hoy', {});
      case 'week':
        return t('dashboard.dashboard.actions.thisWeek', 'Última Semana', {});
      case 'month':
        return t('dashboard.dashboard.actions.thisMonth', 'Últimos 30 Días', {});
      case 'year':
        return t('dashboard.dashboard.actions.thisYear', 'Último Año', {});
      default:
        return p;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.dashboard.breadcrumb', 'Dashboard', {})}
          title={t('dashboard.dashboard.nav.topProducts', 'Rendimiento de Productos Top', {})}
          subtitle={`${getPeriodLabel(period)} | ${t('dashboard.dashboard.topProductsPanel.subtitle', 'Resumen de los SKUs con mejor desempeño', {})}`}
          actions={
            <div
              className="flex items-center gap-xs bg-surface p-xs rounded-md border border-border-subtle shadow-whisper"
              role="group"
              aria-label={t('bi.dashboard.period.label', 'Período', {})}
            >
              {['today', 'week', 'month', 'year'].map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={period === p}
                  data-testid={`top-products-period-${p}`}
                  onClick={() => setPeriod(p)}
                  className={`px-sm py-xs text-label-caps uppercase rounded-sm transition-colors duration-150 ${
                    period === p ? 'bg-primary text-on-primary' : 'text-on-surface-deep hover:bg-surface-muted'
                  }`}
                >
                  {p === 'today' ? 'Hoy' : p === 'week' ? '7D' : p === 'month' ? '30D' : '1A'}
                </button>
              ))}
            </div>
          }
        />

        {loading && topProducts.length === 0 && (
          <div className="mt-lg" aria-busy="true" data-testid="top-products-skeleton">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <GenericSkeletonList count={8} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.dashboard.topProducts.errorTitle', 'No se pudo cargar el ranking', {})}
              message={error}
              onRetry={() => fetchTopProducts(period, 10, sortBy)}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md mt-lg">
              <div className="flex flex-col gap-sm rounded-md p-md bg-surface border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8">
                <div className="flex justify-between items-start">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('dashboard.dashboard.kpi.revenue', 'Ingresos Totales', {})}
                  </p>
                  <div className="size-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">payments</span>
                  </div>
                </div>
                <div className="flex flex-col gap-xs">
                  <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight leading-tight">
                    {formatPYG(topProductsMetrics?.total_revenue || 0)}
                  </p>
                  <div className="flex items-center gap-xs">
                    <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
                    <span className="text-label-caps uppercase text-on-surface-deep">
                      {t('bi.dashboard.topProducts.selectedPeriod', 'Período Seleccionado', {})}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-sm rounded-md p-md bg-surface border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8">
                <div className="flex justify-between items-start">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('dashboard.dashboard.topProductsPanel.starProduct', 'Producto Estrella', {})}
                  </p>
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">emoji_events</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-title-md text-foreground tracking-tight leading-tight truncate" title={topPerformer?.name}>
                    {topPerformer ? topPerformer.name : t('common.loading', 'Cargando...', {})}
                  </p>
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {topPerformer
                      ? `${topPerformer.category || t('common.general', 'General', {})} • ${topPerformer.quantity_sold} ${t('common.units', 'Unidades', {})}`
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-sm rounded-md p-md bg-surface border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8">
                <div className="flex justify-between items-start">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('dashboard.dashboard.activity.titleShort', 'Alertas de Stock', {})}
                  </p>
                  <div className="size-8 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">warning</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-title-md font-data-mono text-data-mono text-foreground tracking-tight leading-tight">
                    {inventoryAlertsCount} {t('common.products', 'Productos', {})}
                  </p>
                  <span className="text-warning text-label-caps uppercase">
                    {t('dashboard.dashboard.kpi.lowStock', 'Stock Bajo Detectado', {})}
                  </span>
                </div>
              </div>
            </div>

            {/* Toolbar & Table */}
            <div className="flex flex-col bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden mt-lg">
              <div className="flex flex-wrap justify-between gap-sm p-sm border-b border-border-subtle items-center">
                <div className="relative max-w-sm w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep">
                    <Search size={18} aria-hidden="true" />
                  </span>
                  <input
                    type="text"
                    aria-label={t('common.search', 'Buscar producto o categoría...', {})}
                    placeholder={t('common.search', 'Buscar producto o categoría...', {})}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full pl-10 pr-4 bg-surface-muted border border-border-subtle rounded-md text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border-subtle">
                      <th className="p-sm text-label-caps uppercase text-on-surface-deep">
                        {t('dashboard.dashboard.topProductsPanel.table.productName', 'Nombre del Producto', {})}
                      </th>
                      <th className="p-sm text-label-caps uppercase text-on-surface-deep">
                        {t('common.category', 'Categoría', {})}
                      </th>
                      <th className="p-sm text-label-caps uppercase text-on-surface-deep text-right">
                        {t('dashboard.dashboard.topProductsPanel.table.avgPrice', 'Precio Prom.', {})}
                      </th>
                      <th
                        className="p-sm text-label-caps uppercase text-on-surface-deep text-right cursor-pointer hover:text-primary transition-colors select-none"
                        onClick={() => setSortBy('quantity')}
                      >
                        {t('dashboard.dashboard.topProductsPanel.table.unitsSold', 'Und. Vendidas', {})} {sortBy === 'quantity' && '↓'}
                      </th>
                      <th
                        className="p-sm text-label-caps uppercase text-on-surface-deep text-right cursor-pointer hover:text-primary transition-colors select-none"
                        onClick={() => setSortBy('revenue')}
                      >
                        {t('dashboard.dashboard.revenue', 'Ingresos', {})} {sortBy === 'revenue' && '↓'}
                      </th>
                      <th
                        className="p-sm text-label-caps uppercase text-on-surface-deep cursor-pointer hover:text-primary transition-colors select-none"
                        onClick={() => setSortBy('profit')}
                      >
                        {t('dashboard.dashboard.topProductsPanel.table.profitability', 'Rentabilidad', {})} {sortBy === 'profit' && '↓'}
                      </th>
                      <th className="p-sm text-label-caps uppercase text-on-surface-deep text-center">
                        {t('dashboard.dashboard.topProductsPanel.table.trend7d', 'Tendencia', {})}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredProducts.map((product) => {
                      const profitInfo = getProfitabilityStyle(product.margin_percentage);
                      const avgPrice = product.quantity_sold > 0 ? product.revenue / product.quantity_sold : 0;

                      return (
                        <tr key={product.id} className="hover:bg-surface-muted transition-colors duration-150">
                          <td className="p-sm">
                            <div className="flex items-center gap-sm">
                              <div className="h-12 w-12 rounded-md bg-surface-muted flex items-center justify-center text-on-surface-deep border border-border-subtle shrink-0">
                                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">inventory_2</span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-body-md-bold text-foreground">{product.name}</span>
                                <span className="text-label-caps uppercase text-on-surface-deep font-data-mono text-data-mono">
                                  ID: {product.id}
                                </span>
                                {product.brand_name && (
                                  <span className="text-label-caps uppercase text-on-surface-deep bg-surface-muted px-xs py-0.5 rounded-xs w-fit mt-0.5">
                                    {product.brand_name}
                                  </span>
                                )}
                                {product.tags && product.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-xs mt-0.5">
                                    {product.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-body-sm-bold text-primary bg-primary/10 px-xs py-0.5 rounded-xs border border-primary/20"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-sm">
                            <span className="inline-flex items-center px-sm py-xs rounded-md text-label-caps uppercase bg-primary/10 text-primary border border-primary/20">
                              {product.category || t('common.general', 'General', {})}
                            </span>
                          </td>
                          <td className="p-sm text-body-md font-data-mono text-data-mono text-foreground text-right">
                            {formatPYG(avgPrice)}
                          </td>
                          <td className="p-sm text-body-md font-data-mono text-data-mono text-foreground text-right">
                            {product.quantity_sold}
                          </td>
                          <td className="p-sm text-body-md font-data-mono text-data-mono text-primary text-right">
                            {formatPYG(product.revenue)}
                          </td>
                          <td className="p-sm">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-sm">
                                <span className={`h-2 w-2 rounded-full ${profitInfo.dot}`} aria-hidden="true" />
                                <span className={`text-body-sm-bold uppercase ${profitInfo.tone}`}>{profitInfo.text}</span>
                              </div>
                              {product.margin_percentage != null && (
                                <span className="text-label-caps uppercase text-on-surface-deep font-data-mono text-data-mono ml-sm">
                                  Mgn: {product.margin_percentage.toFixed(1)}% | {t('bi.dashboard.topProducts.profit', 'Utilidad', {})}:{' '}
                                  {formatPYG(product.profit || 0)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-sm text-center">
                            <div className="flex justify-center items-center h-8">
                              {product.trend === 'up' ? (
                                <div className="text-success flex items-center justify-center gap-xs font-data-mono text-data-mono">
                                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">trending_up</span>
                                  {product.trend_percentage != null && <span className="text-body-sm-bold">{product.trend_percentage}%</span>}
                                </div>
                              ) : product.trend === 'down' ? (
                                <div className="text-error flex items-center justify-center gap-xs font-data-mono text-data-mono">
                                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">trending_down</span>
                                  {product.trend_percentage != null && <span className="text-body-sm-bold">{product.trend_percentage}%</span>}
                                </div>
                              ) : (
                                <div className="text-on-surface-deep flex items-center justify-center gap-xs">
                                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">trending_flat</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!loading && filteredProducts.length === 0 && (
                <div className="p-xl text-center border-none">
                  <div className="flex flex-col items-center justify-center gap-sm">
                    <PackageSearch size={48} className="text-on-surface-deep" />
                    <p className="text-body-md-bold text-on-surface-deep uppercase">
                      {t('dashboard.dashboard.topProductsPanel.table.noResults', 'Sin resultados para los criterios de búsqueda.', {})}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setPeriod('month');
                      }}
                      className="text-primary text-body-sm-bold uppercase hover:underline mt-xs"
                    >
                      {t('bi.dashboard.topProducts.resetFilters', 'Restablecer filtros', {})}
                    </button>
                  </div>
                </div>
              )}

              {/* Conteo real (el legacy mostraba una paginación dummy) */}
              <div className="flex items-center justify-between px-md py-sm border-t border-border-subtle bg-surface-muted">
                <span className="text-label-caps uppercase text-on-surface-deep">
                  {t('bi.receivables.overdue.showing', 'Mostrando {n} cuentas', { n: filteredProducts.length })}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TopProductsOverview;
