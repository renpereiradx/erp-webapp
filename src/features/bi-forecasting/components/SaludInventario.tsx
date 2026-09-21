import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useBIForecasting, formatNumber } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';

const PAGE_SIZE = 10;

/**
 * Salud del Inventario (/forecast/inventory, mapeado por biForecastingService).
 * Deuda ≤10 filas + i18n (VERIFICACION_POST_CIERRE 2026-09-21): la tabla
 * pagina server-side (patrón PronosticoDemanda — el FE solo consume la
 * metadata del BE); el botón "Exportar Reporte" que en realidad hacía
 * refetch ahora se rotula "Actualizar" (H7); fuera el botón muerto "Ver
 * Detalles" y la clase hover malformada.
 */

interface InventoryKPI {
  valor?: number | string;
  variacion?: number | string;
  label?: string;
}

interface InventoryKPIs {
  stock_total?: InventoryKPI;
  cobertura?: InventoryKPI;
  productos_riesgo?: InventoryKPI;
}

interface InventoryProducto {
  id?: string;
  nombre?: string;
  stock?: number;
  venta_promedio?: number;
  pronostico?: number;
  dias_restantes?: number;
  reorden?: number;
  riesgo?: 'ALTO' | 'MEDIO' | 'BAJO' | string;
}

interface InventoryData {
  updated_text?: string;
  periodo_proyectado?: string;
  kpis?: InventoryKPIs;
  notificaciones?: string;
  productos?: InventoryProducto[];
  paginacion?: { total?: number; mostrando?: number; page?: number; total_pages?: number };
  ui_labels?: {
    title?: string;
    alerts_title?: string;
    unit_label?: string;
    global_label?: string;
    items_label?: string;
    unit_short?: string;
    table_headers?: Record<string, string>;
  };
}

const SaludInventario = () => {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ page, page_size: PAGE_SIZE }), [page]);
  const { data: rawData, loading, error, refetch } = useBIForecasting('inventario', params);
  const data = rawData as InventoryData | null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg" aria-busy="true" data-testid="forecast-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <GenericSkeletonList count={5} data-testid="page-skeleton-list" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg mt-lg">
          <ErrorState title={t('bi.forecast.errorTitle', 'No se pudo cargar el pronóstico', {})} message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg mt-lg">
          <EmptyState title={t('bi.forecast.emptyTitle', 'Sin datos de pronóstico', {})} actionLabel={t('bi.profitability.action.refresh', 'Actualizar', {})} onAction={refetch} />
        </div>
      </div>
    );
  }

  const { kpis, notificaciones, productos, paginacion, ui_labels, updated_text } = data;
  const unitShort = ui_labels?.unit_short || t('bi.forecast.inventory.unitShort', 'Unid.');

  // Paginación server-side (patrón PronosticoDemanda): el BE manda la página
  // de productos y la metadata; el FE solo consume.
  const totalPages = paginacion?.total_pages || 1;
  const totalItems = paginacion?.total ?? productos?.length ?? 0;
  const startIndex = (page - 1) * PAGE_SIZE;

  return (
    <div className="flex flex-col gap-6 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="inventario" />

      {/* Title & Refresh */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{ui_labels?.title || t('bi.forecast.inventory.title', 'Salud del Inventario')}</h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-error"></span>
            <p className="text-error font-semibold text-sm">{kpis?.productos_riesgo?.valor ?? 0} {t('bi.forecast.inventory.criticalAlerts', 'Alertas Críticas')}</p>
            <span className="text-on-surface-deep mx-2 text-sm">|</span>
            <p className="text-on-surface-deep text-sm">{updated_text || t('bi.forecast.inventory.updatedRecently', 'Actualizado recientemente')}</p>
          </div>
        </div>
        {/* H7: no hay endpoint de export; el botón refresca y se rotula como
            tal (antes "Exportar Reporte" hacía refetch). */}
        <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm font-bold text-foreground hover:bg-surface-muted transition-colors">
          <span className="material-symbols-outlined text-lg">refresh</span>
          {t('action.refresh', 'Actualizar')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-lg border border-border-subtle flex flex-col gap-1 shadow-sm">
          <p className="text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.inventory.kpi.stock', 'Stock Total')}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-foreground font-mono">{formatNumber(kpis?.stock_total?.valor)}</p>
            <p className="text-sm font-medium text-on-surface-deep">{ui_labels?.unit_label || t('bi.forecast.units', 'unidades')}</p>
          </div>
          <p className={`${Number(kpis?.stock_total?.variacion) < 0 ? 'text-error' : 'text-success'} text-xs font-bold flex items-center gap-1 mt-1`}>
            <span className="material-symbols-outlined text-xs">{Number(kpis?.stock_total?.variacion) < 0 ? 'trending_down' : 'trending_up'}</span>
            {kpis?.stock_total?.variacion ?? 0}% {kpis?.stock_total?.label || t('bi.forecast.vsPrevious', 'vs. periodo anterior')}
          </p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-border-subtle flex flex-col gap-1 shadow-sm">
          <p className="text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.inventory.kpi.coverage', 'Cobertura (%)')}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-foreground font-mono">{kpis?.cobertura?.valor ?? 0}%</p>
            <p className="text-sm font-medium text-on-surface-deep">{ui_labels?.global_label || t('bi.forecast.inventory.kpi.global', 'Global')}</p>
          </div>
          <p className="text-success text-xs font-bold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            {Number(kpis?.cobertura?.variacion) > 0 ? '+' : ''}{kpis?.cobertura?.variacion ?? 0}% {kpis?.cobertura?.label || t('bi.forecast.inventory.kpi.efficiency', 'de eficiencia')}
          </p>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-border-subtle flex flex-col gap-1 shadow-sm">
          <p className="text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.inventory.kpi.atRisk', 'Productos en Riesgo')}</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-foreground">{kpis?.productos_riesgo?.valor ?? 0} {ui_labels?.items_label || t('bi.forecast.inventory.kpi.items', 'Items')}</p>
            <span className="px-2 py-0.5 bg-error/10 text-error text-xs font-bold rounded">{t('bi.forecast.inventory.kpi.alertChip', 'ALERTA')}</span>
          </div>
          <p className="text-error text-xs font-bold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">warning</span>
            {kpis?.productos_riesgo?.label || t('bi.forecast.inventory.kpi.riskHint', 'Crítico: Quiebre inminente')}
          </p>
        </div>
      </div>

      {/* Alerts Message Bar (fuera el botón muerto "Ver Detalles") */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-4">
        <div className="p-2 bg-primary rounded-lg text-white">
          <span className="material-symbols-outlined">campaign</span>
        </div>
        <div>
          <p className="text-foreground font-bold text-sm">{ui_labels?.alerts_title || t('bi.forecast.inventory.alertsTitle', 'Notificaciones')}</p>
          <p className="text-on-surface-deep text-sm">{notificaciones || t('bi.forecast.inventory.noAlerts', 'Sin alertas críticas por el momento.')}</p>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-surface border border-border-subtle rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-muted border-b border-border-subtle">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-deep">{ui_labels?.table_headers?.producto || t('bi.sales.col.product', 'Producto')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-deep">{ui_labels?.table_headers?.stock_actual || t('bi.forecast.inventory.col.stock', 'Stock Actual')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-deep">{ui_labels?.table_headers?.venta_diaria || t('bi.forecast.inventory.col.dailySales', 'Venta Diaria')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-deep">{ui_labels?.table_headers?.pronostico || t('bi.forecast.inventory.col.forecast', 'Pronóstico')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-deep">{ui_labels?.table_headers?.dias_restantes || t('bi.forecast.inventory.col.daysLeft', 'Días')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-deep">{ui_labels?.table_headers?.pto_reorden || t('bi.forecast.inventory.col.reorder', 'Reorden')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-deep">{ui_labels?.table_headers?.nivel_riesgo || t('bi.forecast.inventory.col.risk', 'Riesgo')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(productos || []).map((prod) => (
                <tr key={prod.id} className="hover:bg-surface-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{prod.nombre}</span>
                      <span className="text-xs font-mono text-on-surface-deep">{prod.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium font-mono">{formatNumber(prod.stock)} {unitShort}</td>
                  <td className="px-6 py-4 font-medium font-mono">{formatNumber(prod.venta_promedio)} {unitShort}</td>
                  <td className="px-6 py-4 font-medium font-mono">{formatNumber(prod.pronostico)} {unitShort}</td>
                  <td className="px-6 py-4 font-mono">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                      prod.riesgo === 'ALTO' ? 'bg-error/10 text-error' : prod.riesgo === 'MEDIO' ? 'bg-warning/10 text-warning' : 'bg-surface-muted text-on-surface-deep'
                    }`}>
                      {prod.dias_restantes} {t('bi.forecast.inventory.days', 'días')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-deep font-mono">{formatNumber(prod.reorden)}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${
                      prod.riesgo === 'ALTO' ? 'text-error' : prod.riesgo === 'MEDIO' ? 'text-warning' : 'text-success'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        prod.riesgo === 'ALTO' ? 'bg-error' : prod.riesgo === 'MEDIO' ? 'bg-warning' : 'bg-success'
                      }`}></span>
                      {prod.riesgo}
                    </span>
                  </td>
                </tr>
              ))}
              {(!productos || productos.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-on-surface-deep font-medium italic text-xs uppercase tracking-widest">
                    {t('bi.forecast.inventory.empty', 'Sin productos con datos de inventario.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Paginación (server-side: metadata del BE) */}
        <div className="p-4 bg-surface-muted border-t border-border-subtle flex justify-between items-center text-xs text-on-surface-deep">
          <p>
            {t('bi.forecast.inventory.showing', 'Mostrando {a} - {b} de {c} items de inventario', {
              a: totalItems === 0 ? 0 : startIndex + 1,
              b: Math.min(startIndex + PAGE_SIZE, totalItems),
              c: totalItems,
            })}
          </p>
          <div className="flex gap-2 items-center">
            <p className="text-xs text-on-surface-deep font-medium mr-2">{t('bi.logs.page', 'Página')} {page} {t('bi.logs.of', 'de')} {totalPages}</p>
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 text-xs font-bold rounded border transition-all ${
                page === 1
                  ? 'bg-surface-muted text-on-surface-deep border-border-subtle cursor-not-allowed'
                  : 'bg-surface text-foreground border-border-subtle hover:bg-surface-muted active:scale-95'
              }`}
            >{t('bi.common.prev', 'Anterior')}</button>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-1.5 text-xs font-bold rounded border transition-all ${
                page >= totalPages
                  ? 'bg-surface-muted text-on-surface-deep border-border-subtle cursor-not-allowed'
                  : 'bg-surface text-foreground border-border-subtle hover:bg-surface-muted active:scale-95'
              }`}
            >{t('bi.common.next', 'Siguiente')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaludInventario;
