import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useBIForecasting, formatCurrency, formatNumber } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';

const PAGE_SIZE = 10;

/** Contrato de GET /forecast/demand (mapeado por biForecastingService). */
interface DemandaKPIs {
  categoria_crecimiento?: { nombre?: string; variacion?: number | string; label?: string };
  producto_demanda?: { nombre?: string; unidades?: number | string; label?: string };
}

interface DemandaCategoria {
  nombre?: string;
  historico?: number;
  proyectado?: number;
  crecimiento?: string;
  tendencia?: 'up' | 'down' | 'flat' | string;
  confianza?: number;
}

interface DemandaProducto {
  producto?: string;
  categoria?: string;
  unidades?: number;
  valor?: number;
  confianza?: string;
}

interface DemandaData {
  periodo_proyectado?: string;
  kpis?: DemandaKPIs;
  categorias?: DemandaCategoria[];
  productos_top?: DemandaProducto[];
  pagination?: { total_pages?: number; total_items?: number };
}

const PronosticoDemanda = () => {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ page, page_size: PAGE_SIZE }), [page]);
  const { data: rawData, loading, error, refetch } = useBIForecasting('demanda', params);
  const data = rawData as DemandaData | null;

  if (loading) return <div className="p-8 text-center font-bold text-on-surface-deep">{t('bi.forecast.demand.loading', 'Cargando pronóstico de demanda...')}</div>;
  if (error) return <div className="p-8 text-center font-bold text-error">{t('bi.common.errorPrefix', 'Error: ')}{error}</div>;
  if (!data) return null;

  const { kpis, categorias, productos_top, pagination } = data;

  // Paginación server-side (cierre ② auditoría BI): el BE manda la página de
  // productos y la metadata; el FE solo consume.
  const totalPages = pagination?.total_pages || 1;
  const totalItems = pagination?.total_items || (productos_top?.length || 0);
  const startIndex = (page - 1) * PAGE_SIZE;

  return (
    <div className="flex flex-col gap-8 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="demanda" />

      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex min-w-72 flex-col gap-1">
          <h1 className="text-foreground text-4xl font-black leading-tight tracking-[-0.033em]">{t('bi.forecast.demand.title', 'Pronóstico de Demanda')}</h1>
          <p className="text-on-surface-deep text-base font-medium">{t('bi.forecast.projectedPeriod', 'Periodo proyectado:')} <span className="text-primary">{data.periodo_proyectado || '—'}</span></p>
        </div>
        {/* H7 (FASE 5): no hay endpoint de export; el botón refresca y se
            rotula como tal (antes "Exportar Análisis Completo" hacía refetch). */}
        <button
          onClick={() => refetch()}
          className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-6 bg-surface text-foreground border border-border-subtle text-sm font-bold tracking-[0.015em] shadow-sm hover:bg-surface-muted"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span className="truncate">{t('action.refresh', 'Actualizar')}</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-on-surface-deep text-sm font-bold uppercase tracking-wider">{t('bi.forecast.demand.topCategory', 'Categoría de Mayor Crecimiento')}</p>
            <span className="material-symbols-outlined text-primary">trending_up</span>
          </div>
          <p className="text-foreground text-3xl font-black leading-tight">{kpis?.categoria_crecimiento?.nombre || '—'}</p>
          <div className="flex items-center gap-2">
            <span className="text-success text-lg font-bold">+{kpis?.categoria_crecimiento?.variacion ?? '—'}%</span>
            <span className="text-on-surface-deep text-sm">{kpis?.categoria_crecimiento?.label || t('bi.forecast.vsPrevious', 'vs. periodo anterior')}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-on-surface-deep text-sm font-bold uppercase tracking-wider">{t('bi.forecast.demand.topProduct', 'Producto con Mayor Demanda')}</p>
            <span className="material-symbols-outlined text-primary">stars</span>
          </div>
          <p className="text-foreground text-3xl font-black leading-tight">{kpis?.producto_demanda?.nombre || '—'}</p>
          <div className="flex items-center gap-2">
            <span className="text-primary text-lg font-bold font-mono">{formatNumber(kpis?.producto_demanda?.unidades)} {t('bi.forecast.units', 'unidades')}</span>
            <span className="text-on-surface-deep text-sm">{kpis?.producto_demanda?.label || t('bi.forecast.quarterly', 'Proyección trimestral')}</span>
          </div>
        </div>
      </div>

      {/* Main Data Grid (Categories) */}
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground text-2xl font-bold leading-tight">{t('bi.forecast.categoriesTitle', 'Desglose por Categoría')}</h2>
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border-subtle">
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.col.category', 'Categoría')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.col.historic', 'Histórico')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider text-primary">{t('bi.forecast.col.projected', 'Proyectado')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.col.growth', 'Crecimiento')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider text-center">{t('bi.forecast.col.trend', 'Tendencia')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.col.confidence', 'Confianza')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(categorias || []).map((cat, idx) => (
                <tr key={idx} className="hover:bg-surface-muted transition-colors">
                  <td className="px-6 py-4 text-foreground font-semibold">{cat.nombre}</td>
                  <td className="px-6 py-4 text-on-surface-deep font-mono">{formatNumber(cat.historico)}</td>
                  <td className="px-6 py-4 text-primary font-bold font-mono">{formatNumber(cat.proyectado)}</td>
                  <td className={`px-6 py-4 font-medium font-mono ${cat.tendencia === 'up' ? 'text-success' : cat.tendencia === 'down' ? 'text-error' : 'text-on-surface-deep'}`}>
                    {cat.crecimiento}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`material-symbols-outlined ${cat.tendencia === 'up' ? 'text-success' : cat.tendencia === 'down' ? 'text-error' : 'text-on-surface-deep'}`}>
                      {cat.tendencia === 'up' ? 'trending_up' : cat.tendencia === 'down' ? 'trending_down' : 'trending_flat'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${cat.confianza}%` }}></div>
                      </div>
                      <p className="text-foreground text-sm font-bold">{cat.confianza}%</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Star Products */}
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground text-2xl font-bold leading-tight">{t('bi.sales.topProducts', 'Top Productos')}</h2>
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border-subtle">
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.sales.col.product', 'Producto')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.col.category', 'Categoría')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.col.estUnits', 'Unidades Estimadas')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.col.estValue', 'Valor Estimado (₲)')}</th>
                <th className="px-6 py-4 text-on-surface-deep text-xs font-bold uppercase tracking-wider">{t('bi.forecast.col.confidenceLevel', 'Nivel de Confianza')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(productos_top || []).map((prod, idx) => (
                <tr key={idx} className="hover:bg-surface-muted transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{prod.producto}</td>
                  <td className="px-6 py-4 text-on-surface-deep">{prod.categoria}</td>
                  <td className="px-6 py-4 text-foreground font-bold font-mono">{formatNumber(prod.unidades)}</td>
                  <td className="px-6 py-4 text-on-surface-deep font-mono">{formatCurrency(prod.valor)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      prod.confianza === 'Alta' ? 'bg-success/10 text-success' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {prod.confianza}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer de Paginación (server-side: metadata del BE) */}
          <div className="flex items-center justify-between px-6 py-4 bg-surface-muted border-t border-border-subtle">
            <p className="text-xs text-on-surface-deep font-medium">
              {t('bi.forecast.showingProducts', 'Mostrando {a} - {b} de {c} productos', { a: totalItems === 0 ? 0 : startIndex + 1, b: Math.min(startIndex + PAGE_SIZE, totalItems), c: totalItems })}
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
    </div>
  );
};

export default PronosticoDemanda;
