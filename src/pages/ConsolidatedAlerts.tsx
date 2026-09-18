import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardStore from '@/store/useDashboardStore';
import { useI18n } from '@/lib/i18n';
import { formatTimeInParaguayTimezone, formatDateInParaguayTimezone, formatReserveDate } from '@/utils/timeUtils';
import { filterAlerts, getAlertMetrics, getAvailableCategories, getCategoryIcon, getCategoryLabel, isFinancialDetailKey } from '@/domain/dashboard/alerts';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Alertas Consolidadas.
 * Migración FASE 5: .tsx + PageHeader + tokens + loading/error por slice.
 * Fuera (§2.6): "Marcar todo como leído", "Silenciar", "Ver Reporte" y el
 * botón de orden sin handler.
 */

/**
 * Renderizador de detalles de alerta para mejorar legibilidad
 */
const DetailItem = ({ label, value, navigate }: { label: string; value: unknown; navigate: (to: string) => void }) => {
  const formattedLabel = label.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const renderValue = () => {
    if ((label.toLowerCase().includes('product') || label.toLowerCase().includes('item')) && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-sm">
          {value.map((p: any, i: number) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(`/productos?search=${p.name || p.id || p}`)}
              className="flex items-center gap-xs px-sm py-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-xs text-body-sm-bold transition-colors border border-primary/20"
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">package_2</span>
              {p.name || p.id || p}
            </button>
          ))}
        </div>
      );
    }

    if (
      (label.toLowerCase().includes('client') || label.toLowerCase().includes('customer')) &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      return (
        <button
          type="button"
          onClick={() => navigate('/parties?tab=clientes')}
          className="flex items-center gap-xs text-primary hover:underline text-body-md-bold"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">person</span>
          {value}
        </button>
      );
    }

    if (isFinancialDetailKey(label) && (typeof value === 'number' || !isNaN(Number(value)))) {
      return <span className="text-body-md-bold font-data-mono text-data-mono text-primary">{formatPYG(Number(value))}</span>;
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <pre className="text-body-sm bg-surface-muted p-xs rounded-sm overflow-x-auto w-full text-foreground">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return String(value);
  };

  return (
    <div className="flex flex-col gap-xs w-full">
      <span className="text-label-caps uppercase text-on-surface-deep">{formattedLabel}</span>
      <div className="text-body-md text-foreground bg-surface-muted px-sm py-xs rounded-sm border border-border-subtle flex items-center min-h-[40px]">
        {renderValue()}
      </div>
    </div>
  );
};

const ConsolidatedAlerts = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const alerts = useDashboardStore((s) => s.alerts);
  const fetchDashboardData = useDashboardStore((s) => s.fetchDashboardData);
  const loading = useDashboardStore((s) => s.loadingBySlice.dashboard);
  const error = useDashboardStore((s) => s.errorBySlice.dashboard);

  const [expandedAlertId, setExpandedAlertId] = useState<string | number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchDashboardData().then(() => setLastUpdated(new Date()));
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    await fetchDashboardData();
    setLastUpdated(new Date());
  };

  const toggleAlert = (id: string | number) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  const getRelativeTime = (dateString?: string | null) => {
    if (!dateString) return t('bi.dashboard.alerts.recently', 'hace poco', {});
    const formatted = formatReserveDate(dateString);
    return formatted ? formatted.relativeTime : t('bi.dashboard.alerts.recently', 'hace poco', {});
  };

  const availableCategories = useMemo(() => getAvailableCategories(alerts), [alerts]);
  const metrics = useMemo(() => getAlertMetrics(alerts), [alerts]);
  const filteredAlerts = useMemo(
    () => filterAlerts(alerts, { severity: filterSeverity, category: filterCategory, search: searchQuery }),
    [alerts, filterSeverity, filterCategory, searchQuery],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.dashboard.breadcrumb', 'Dashboard', {})}
          title={t('bi.dashboard.alerts.title', 'Alertas Consolidadas', {})}
          subtitle={`${t('bi.dashboard.alerts.monitoring', 'Monitoreo en tiempo real de eventos críticos del sistema.', {})} ${t('bi.dashboard.alerts.updated', 'Actualizado:', {})} ${formatTimeInParaguayTimezone(lastUpdated)}`}
          actions={
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-primary text-on-primary text-body-sm-bold hover:bg-primary-container transition-colors shadow-whisper disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden="true">refresh</span>
              {t('bi.payables.invoices.sync', 'Sincronizar', {})}
            </button>
          }
        />

        {loading && alerts.length === 0 && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="alerts-skeleton">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <GenericSkeletonList count={6} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && alerts.length === 0 && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.dashboard.alerts.errorTitle', 'No se pudieron cargar las alertas', {})}
              message={error}
              onRetry={handleRefresh}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
              <div className="flex flex-col p-md rounded-md bg-surface border border-border-subtle shadow-whisper">
                <div className="flex items-center justify-between mb-xs">
                  <span className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.dashboard.alerts.total', 'Total Activas', {})}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-deep text-body-lg" aria-hidden="true">notifications</span>
                </div>
                <div className="flex items-baseline gap-xs">
                  <span className="text-headline-lg-mobile font-data-mono text-data-mono text-foreground">{metrics.total}</span>
                </div>
              </div>

              <div
                className={`flex flex-col p-md rounded-md bg-surface border border-border-subtle border-l-4 border-l-warning shadow-whisper cursor-pointer transition-shadow hover:shadow-fluent-8 ${
                  filterCategory === 'inventory' ? 'ring-2 ring-warning/20' : ''
                }`}
                onClick={() => setFilterCategory(filterCategory === 'inventory' ? 'all' : 'inventory')}
              >
                <div className="flex items-center justify-between mb-xs">
                  <span className="text-label-caps uppercase text-warning">{t('bi.dashboard.alerts.lowStock', 'Stock Bajo', {})}</span>
                  <span className="material-symbols-outlined text-warning text-body-lg" aria-hidden="true">inventory_2</span>
                </div>
                <div className="flex items-baseline gap-xs">
                  <span className="text-headline-lg-mobile font-data-mono text-data-mono text-foreground">{metrics.inventory}</span>
                  <span className="text-label-caps uppercase text-on-surface-deep ml-sm">{t('bi.dashboard.alerts.alerts', 'Alertas', {})}</span>
                </div>
              </div>

              <div
                className={`flex flex-col p-md rounded-md bg-surface border border-border-subtle border-l-4 border-l-primary shadow-whisper cursor-pointer transition-shadow hover:shadow-fluent-8 ${
                  filterCategory === 'sales' ? 'ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setFilterCategory(filterCategory === 'sales' ? 'all' : 'sales')}
              >
                <div className="flex items-center justify-between mb-xs">
                  <span className="text-label-caps uppercase text-primary">{t('bi.dashboard.alerts.salesClients', 'Clientes / Ventas', {})}</span>
                  <span className="material-symbols-outlined text-primary text-body-lg" aria-hidden="true">groups</span>
                </div>
                <div className="flex items-baseline gap-xs">
                  <span className="text-headline-lg-mobile font-data-mono text-data-mono text-foreground">{metrics.sales}</span>
                  <span className="text-label-caps uppercase text-on-surface-deep ml-sm">{t('bi.dashboard.alerts.events', 'Eventos', {})}</span>
                </div>
              </div>

              <div
                className={`flex flex-col p-md rounded-md bg-surface border border-border-subtle border-l-4 border-l-error shadow-whisper cursor-pointer transition-shadow hover:shadow-fluent-8 ${
                  filterSeverity === 'critical' ? 'ring-2 ring-error/20' : ''
                }`}
                onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
              >
                <div className="flex items-center justify-between mb-xs">
                  <span className="text-label-caps uppercase text-error">{t('bi.dashboard.alerts.urgent', 'Acción Urgente', {})}</span>
                  <span className="material-symbols-outlined text-error text-body-lg" aria-hidden="true">error</span>
                </div>
                <div className="flex items-baseline gap-xs">
                  <span className="text-headline-lg-mobile font-data-mono text-data-mono text-foreground">{metrics.critical}</span>
                  <span className="text-label-caps uppercase text-on-surface-deep ml-sm">{t('bi.dashboard.alerts.criticalCount', 'Críticas', {})}</span>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-sm justify-between items-center bg-surface p-sm rounded-md border border-border-subtle shadow-whisper mt-lg">
              <div className="flex flex-1 w-full md:w-auto items-center gap-sm overflow-x-auto py-xs px-xs">
                <div className="relative min-w-[240px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep">
                    <span className="material-symbols-outlined text-body-lg" aria-hidden="true">search</span>
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-md border border-border-subtle bg-surface-muted pl-10 pr-3 text-body-md text-foreground focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-deep"
                    placeholder={t('bi.dashboard.alerts.searchPlaceholder', 'Filtrar por contenido o ID...', {})}
                    aria-label={t('bi.dashboard.alerts.searchPlaceholder', 'Filtrar por contenido o ID...', {})}
                  />
                </div>
                <div className="h-6 w-px bg-border-subtle mx-xs shrink-0" />

                <button
                  type="button"
                  className={`flex shrink-0 h-9 items-center gap-sm rounded-full px-sm text-label-caps uppercase transition-colors ${
                    filterSeverity === 'all' && filterCategory === 'all'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-muted border border-border-subtle text-on-surface-deep hover:bg-surface'
                  }`}
                  onClick={() => {
                    setFilterSeverity('all');
                    setFilterCategory('all');
                  }}
                >
                  {t('bi.dashboard.alerts.all', 'Todas', {})}
                </button>

                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  aria-label={t('bi.dashboard.alerts.severityLabel', 'Severidad', {})}
                  className="flex shrink-0 h-9 items-center rounded-md border border-border-subtle bg-surface-muted px-sm text-label-caps uppercase text-foreground outline-none cursor-pointer"
                >
                  <option value="all">{t('bi.dashboard.alerts.severityAll', 'Severidad: Todas', {})}</option>
                  <option value="critical">{t('bi.dashboard.alerts.severityCritical', 'Crítica / Error', {})}</option>
                  <option value="warning">{t('bi.dashboard.alerts.severityWarning', 'Advertencia', {})}</option>
                  <option value="info">{t('bi.dashboard.alerts.severityInfo', 'Información', {})}</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  aria-label={t('bi.dashboard.alerts.categoryLabel', 'Categoría', {})}
                  className="flex shrink-0 h-9 items-center rounded-md border border-border-subtle bg-surface-muted px-sm text-label-caps uppercase text-foreground outline-none cursor-pointer"
                >
                  <option value="all">{t('bi.dashboard.alerts.categoryAll', 'Categoría: Todas', {})}</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Alertas */}
            <div className="flex flex-col gap-sm mt-lg">
              {filteredAlerts.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-xl bg-surface rounded-md border border-dashed border-border-subtle animate-in fade-in duration-300">
                  <div className="size-20 rounded-full bg-surface-muted flex items-center justify-center mb-md">
                    <span className="material-symbols-outlined text-5xl text-on-surface-deep opacity-40" aria-hidden="true">notifications_off</span>
                  </div>
                  <p className="text-body-md-bold text-on-surface-deep uppercase">{t('bi.dashboard.alerts.emptyTitle', 'Sistema Sin Alertas', {})}</p>
                  <p className="text-body-sm-bold text-on-surface-deep opacity-60 mt-xs">
                    {t('bi.dashboard.alerts.emptyBody', 'No se encontraron alertas activas bajo estos filtros.', {})}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSeverity('all');
                      setFilterCategory('all');
                      setSearchQuery('');
                    }}
                    className="mt-md text-primary text-body-sm-bold hover:underline"
                  >
                    {t('bi.dashboard.alerts.clearFilters', 'Limpiar todos los filtros', {})}
                  </button>
                </div>
              )}

              {filteredAlerts.map((alert) => {
                const isExpanded = expandedAlertId === alert.id;
                const isCritical = alert.severity === 'critical' || alert.severity === 'error';
                const severityColorClass = isCritical ? 'bg-error' : alert.severity === 'warning' ? 'bg-warning' : 'bg-primary';
                const severityBg = isCritical
                  ? 'bg-error/10'
                  : alert.severity === 'warning'
                    ? 'bg-warning/10'
                    : 'bg-primary/10';
                const severityText = isCritical ? 'text-error' : alert.severity === 'warning' ? 'text-warning' : 'text-primary';
                const badgeClass = isCritical
                  ? 'bg-error/10 text-error ring-error/20'
                  : alert.severity === 'warning'
                    ? 'bg-warning/10 text-warning ring-warning/20'
                    : 'bg-primary/10 text-primary ring-primary/20';
                const severityLabel = isCritical
                  ? t('bi.dashboard.alerts.severityCriticalShort', 'Crítica', {})
                  : alert.severity === 'warning'
                    ? t('bi.dashboard.alerts.severityWarningShort', 'Advertencia', {})
                    : t('bi.dashboard.alerts.severityInfoShort', 'Información', {});

                return (
                  <div
                    key={alert.id}
                    className={`group relative flex flex-col rounded-md bg-surface border border-border-subtle shadow-whisper transition-all duration-300 ${
                      isExpanded ? 'ring-2 ring-primary/30 border-transparent' : 'hover:shadow-fluent-8'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${severityColorClass} rounded-l-md z-10`} aria-hidden="true" />

                    <button
                      type="button"
                      className="flex flex-col sm:flex-row items-start sm:items-center p-md pl-lg gap-sm cursor-pointer hover:bg-surface-muted transition-colors w-full text-left"
                      onClick={() => toggleAlert(alert.id)}
                    >
                      <div className="flex items-center gap-md flex-1">
                        <div className={`size-12 rounded-md ${severityBg} flex items-center justify-center shrink-0 ${severityText}`}>
                          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">{getCategoryIcon(alert.category)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <h3 className="text-body-lg-bold text-foreground leading-tight tracking-tight">{alert.title || alert.message}</h3>
                          <div className="flex items-center gap-sm">
                            <span className="text-label-caps uppercase text-on-surface-deep">{getCategoryLabel(alert.category)}</span>
                            <span className="size-1 rounded-full bg-on-surface-deep/40" aria-hidden="true" />
                            <span className="text-body-sm-bold text-on-surface-deep font-data-mono text-data-mono">
                              ID: {alert.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-sm mt-sm sm:mt-0">
                        <span
                          className={`inline-flex items-center rounded-xs px-sm py-xs text-label-caps uppercase ring-1 ring-inset ${badgeClass}`}
                        >
                          {severityLabel}
                        </span>
                        <div className="flex items-center gap-xs text-label-caps uppercase text-on-surface-deep">
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">schedule</span>
                          {getRelativeTime(alert.created_at)}
                        </div>
                        <span
                          className={`material-symbols-outlined text-body-lg text-on-surface-deep transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        >
                          expand_more
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="flex flex-col lg:flex-row gap-lg border-t border-border-subtle bg-surface-muted/50 p-lg animate-in slide-in-from-top-2 duration-300">
                        <div className="flex-1 space-y-lg">
                          <div>
                            <h4 className="text-label-caps uppercase text-on-surface-deep mb-sm opacity-70">
                              {t('bi.dashboard.alerts.detail.description', 'Descripción del Evento', {})}
                            </h4>
                            <p className="text-body-lg text-foreground leading-relaxed">{alert.message}</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                            <div className="flex flex-col gap-xs">
                              <span className="text-label-caps uppercase text-on-surface-deep">
                                {t('bi.dashboard.alerts.detail.reference', 'Referencia Interna', {})}
                              </span>
                              <span className="text-body-md-bold font-data-mono text-data-mono text-primary bg-primary/10 px-sm py-xs rounded-xs inline-block w-fit">
                                ALT_SYS_{alert.id}
                              </span>
                            </div>
                            <div className="flex flex-col gap-xs">
                              <span className="text-label-caps uppercase text-on-surface-deep">
                                {t('bi.dashboard.alerts.detail.timestamp', 'Registro Temporal', {})}
                              </span>
                              <span className="text-body-md-bold text-foreground">
                                {formatDateInParaguayTimezone(alert.created_at ?? '')} • {formatTimeInParaguayTimezone(alert.created_at ?? '')}
                              </span>
                            </div>
                          </div>

                          {alert.details && Object.keys(alert.details).length > 0 && (
                            <div className="space-y-md pt-md border-t border-border-subtle">
                              <h4 className="text-label-caps uppercase text-on-surface-deep opacity-70">
                                {t('bi.dashboard.alerts.detail.metadata', 'Metadatos y Contexto', {})}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                                {Object.entries(alert.details).map(([key, val]) => (
                                  <DetailItem key={key} label={key} value={val} navigate={navigate} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="lg:w-80 space-y-md">
                          <div className="bg-surface rounded-md p-md border border-border-subtle shadow-whisper relative overflow-hidden">
                            <div className="flex justify-between items-center mb-md">
                              <span className="text-label-caps uppercase text-on-surface-deep">
                                {t('bi.dashboard.alerts.detail.resolution', 'Resolución', {})}
                              </span>
                              <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
                            </div>
                            <div className="space-y-sm">
                              {alert.category?.includes('inv') && (
                                <button
                                  type="button"
                                  onClick={() => navigate('/productos')}
                                  className="flex items-center gap-sm w-full p-sm hover:bg-surface-muted rounded-md transition-colors"
                                >
                                  <div className="size-10 rounded-md bg-warning/10 flex items-center justify-center text-warning">
                                    <span className="material-symbols-outlined text-body-lg" aria-hidden="true">inventory_2</span>
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span className="text-body-sm-bold text-foreground">{t('bi.dashboard.alerts.actions.restock', 'Reponer Stock', {})}</span>
                                    <span className="text-label-caps uppercase text-on-surface-deep opacity-70">
                                      {t('bi.dashboard.alerts.actions.viewCatalog', 'Ver Catálogo', {})}
                                    </span>
                                  </div>
                                </button>
                              )}
                              {(alert.category?.includes('sal') || alert.category?.includes('client')) && (
                                <button
                                  type="button"
                                  onClick={() => navigate('/parties?tab=clientes')}
                                  className="flex items-center gap-sm w-full p-sm hover:bg-surface-muted rounded-md transition-colors"
                                >
                                  <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-body-lg" aria-hidden="true">person_search</span>
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span className="text-body-sm-bold text-foreground">
                                      {t('bi.dashboard.alerts.actions.reviewClients', 'Revisar Clientes', {})}
                                    </span>
                                    <span className="text-label-caps uppercase text-on-surface-deep opacity-70">CRM</span>
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>

                          {alert.action_url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(alert.action_url!);
                              }}
                              className="flex items-center justify-center gap-sm h-11 w-full rounded-md bg-primary text-on-primary text-body-sm-bold uppercase hover:bg-primary-container transition-colors shadow-whisper"
                            >
                              {t('bi.dashboard.alerts.actions.manage', 'Gestionar', {})}
                              <span className="material-symbols-outlined text-body-lg" aria-hidden="true">arrow_forward</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConsolidatedAlerts;
