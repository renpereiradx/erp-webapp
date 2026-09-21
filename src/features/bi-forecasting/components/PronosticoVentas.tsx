import { useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useBIForecasting } from '../hooks/useBIForecasting';
import BIForecastingNav from './BIForecastingNav';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Detalle de Pronóstico de Ventas (/forecast/sales, mapeado por
 * biForecastingService). Deuda de formato e i18n (VERIFICACION_POST_CIERRE
 * 2026-09-21 §5.1): archivo des-minificado y tipado; las etiquetas de UI
 * salen de i18n (`bi.forecast.sales.*`) y no del payload del BE (los
 * `ui_labels` servidos por la API eran español fijo y rompían el locale
 * en). El badge muestra el modelo que reporta el servicio y los rótulos de
 * las tablas de horizonte acotado acompañan su largo real. Los dos botones
 * refrescan y se rotulan como tal (H7: "Exportar Reporte" hacía refetch).
 */

interface VentasKPIs {
  crecimiento?: { valor?: number | string; periodo_anterior?: number | string; label?: string };
  confianza?: { valor?: number | string };
  mae?: { valor?: number; porcentaje?: number | string; label?: string };
  r_cuadrado?: { valor?: number | string; label?: string };
}

interface VentasFila {
  periodo?: string;
  valor?: number;
  variacion?: string;
  positivo?: boolean | null;
  destacado?: boolean;
}

interface VentasData {
  periodo_proyectado?: string;
  model_info?: {
    granularidad?: string;
    modelo?: string;
    confianza_label?: string;
  };
  kpis?: VentasKPIs;
  historial?: VentasFila[];
  proyeccion?: VentasFila[];
  estacionalidad?: {
    picos?: Array<{ mes?: string; descripcion?: string }>;
    valles?: Array<{ mes?: string; descripcion?: string }>;
    factores?: Array<{ mes?: string; factor?: number | string; tipo?: string }>;
  };
}

const PronosticoVentas = () => {
  const { t } = useI18n();
  const { data: rawData, loading, error, refetch } = useBIForecasting('ventas');
  const data = rawData as VentasData | null;

  const factoresClass = useMemo(
    () =>
      (tipo?: string) =>
        tipo === 'alto' || tipo === 'destacado'
          ? 'text-success'
          : tipo === 'bajo'
            ? 'text-warning'
            : 'text-foreground',
    [],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg" aria-busy="true" data-testid="forecast-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
            {Array.from({ length: 4 }).map((_, i) => (
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
          <EmptyState title={t('bi.forecast.emptyTitle', 'Sin datos de pronóstico', {})} actionLabel={t('action.refresh', 'Actualizar', {})} onAction={refetch} />
        </div>
      </div>
    );
  }

  const { kpis, historial, proyeccion, estacionalidad, model_info } = data;
  const granularidad = model_info?.granularidad || t('bi.forecast.sales.granularityDefault', 'MENSUAL');
  const modelo = model_info?.modelo || t('bi.forecast.sales.modelDefault', 'Exponential Smoothing');
  const confianzaLabel = model_info?.confianza_label || t('bi.forecast.sales.kpi.confidenceHint', 'Intervalo de confianza 95%');

  return (
    <div className="flex flex-col gap-6 max-w-[1280px] mx-auto w-full font-display">
      <BIForecastingNav active="ventas" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">{t('bi.forecast.sales.title', 'Detalle de Pronóstico de Ventas')}</h1>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{modelo}</span>
          </div>
          <p className="text-on-surface-deep font-medium">
            {t('bi.forecast.sales.granularityLabel', 'Granularidad:')} <span className="text-foreground">{granularidad}</span>
            {' | '}
            {t('bi.forecast.sales.periodLabel', 'Periodo:')} <span className="text-foreground">{data.periodo_proyectado || '—'}</span>
          </p>
        </div>
        <div className="flex gap-3">
          {/* H7: ambos botones refrescan; los rótulos dicen lo que hacen
              (antes "Exportar Reporte" hacía refetch). */}
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-lg text-sm font-semibold hover:bg-surface-muted transition-colors">
            <span className="material-symbols-outlined text-lg">refresh</span>
            {t('action.refresh', 'Actualizar')}
          </button>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-lg">refresh</span>
            {t('bi.forecast.sales.recalc', 'Recalcular')}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-on-surface-deep">{t('bi.forecast.sales.kpi.growth', 'Tasa de Crecimiento')}</p>
            <span className={`${Number(kpis?.crecimiento?.periodo_anterior) > 0 ? 'text-success bg-success/10' : 'text-error bg-error/10'} px-2 py-0.5 rounded text-xs font-bold`}>
              {Number(kpis?.crecimiento?.periodo_anterior) > 0 ? '+' : ''}{kpis?.crecimiento?.periodo_anterior ?? 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">{Number(kpis?.crecimiento?.valor) > 0 ? '+' : ''}{kpis?.crecimiento?.valor ?? 0}%</p>
          <p className="text-xs text-on-surface-deep mt-1">{kpis?.crecimiento?.label || t('bi.forecast.vsPrevious', 'vs. periodo anterior')}</p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-on-surface-deep">{t('bi.forecast.sales.kpi.confidence', 'Nivel de Confianza')}</p>
            <span className="material-symbols-outlined text-on-surface-deep text-lg">verified_user</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-foreground font-mono">{kpis?.confianza?.valor ?? 0}%</p>
            <div className="w-16 h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${kpis?.confianza?.valor ?? 0}%` }}></div>
            </div>
          </div>
          <p className="text-xs text-on-surface-deep mt-1">{confianzaLabel}</p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-on-surface-deep">{t('bi.forecast.sales.kpi.mae', 'MAE (Error Absoluto)')}</p>
            <span className="text-error bg-error/10 px-2 py-0.5 rounded text-xs font-bold">{kpis?.mae?.porcentaje ?? 0}%</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">{formatPYG(kpis?.mae?.valor ?? 0)}</p>
          <p className="text-xs text-on-surface-deep mt-1">{kpis?.mae?.label || t('bi.forecast.sales.kpi.maeHint', 'Promedio mensual de error')}</p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border-subtle shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-on-surface-deep">{t('bi.forecast.sales.kpi.r2', 'R-Cuadrado')}</p>
            <span className="material-symbols-outlined text-primary text-lg">query_stats</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">{kpis?.r_cuadrado?.valor ?? '—'}</p>
          <p className="text-xs text-on-surface-deep mt-1">{kpis?.r_cuadrado?.label || t('bi.forecast.sales.kpi.r2Hint', 'Bondad de ajuste del modelo')}</p>
        </div>
      </div>

      {/* Data Grid: 60/40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-4">
        {/* Left: Recent History */}
        <div className="lg:col-span-6 bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-surface-muted">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              {t('bi.forecast.sales.historyTitle', 'Historial Reciente')} · {(historial?.length ?? 0)} {t('bi.forecast.sales.months', 'meses')}
            </h3>
            <span className="text-xs font-bold text-on-surface-deep uppercase tracking-widest">{t('bi.forecast.sales.historyBadge', 'Datos Reales')}</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-muted text-on-surface-deep font-semibold border-b border-border-subtle">
                <th className="px-6 py-3">{t('bi.forecast.sales.col.period', 'Periodo')}</th>
                <th className="px-6 py-3 text-right">{t('bi.forecast.sales.col.actualSale', 'Venta Real (₲)')}</th>
                <th className="px-6 py-3 text-right">{t('bi.forecast.sales.col.variation', 'Variación')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(historial ?? []).map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-muted transition-colors">
                  <td className="px-6 py-3 font-medium">{item.periodo}</td>
                  <td className="px-6 py-3 text-right font-mono">{formatPYG(item.valor ?? 0)}</td>
                  <td className={`px-6 py-3 text-right ${item.positivo === true ? 'text-success' : item.positivo === false ? 'text-error' : 'text-on-surface-deep'}`}>
                    {item.variacion ?? '—'}
                  </td>
                </tr>
              ))}
              {(!historial || historial.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-on-surface-deep font-medium italic text-xs uppercase tracking-widest">
                    {t('bi.forecast.sales.emptyHistory', 'Sin historial disponible.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Projected Sales */}
        <div className="lg:col-span-4 bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-primary/5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">online_prediction</span>
              {t('bi.forecast.sales.forecastTitle', 'Proyección')} · {(proyeccion?.length ?? 0)} {t('bi.forecast.sales.months', 'meses')}
            </h3>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">{t('bi.forecast.sales.forecastBadge', 'Modelo')}</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-muted text-on-surface-deep font-semibold border-b border-border-subtle">
                <th className="px-6 py-3">{t('bi.forecast.sales.col.period', 'Periodo')}</th>
                <th className="px-6 py-3 text-right">{t('bi.forecast.sales.col.projectedSale', 'Venta Proyectada (₲)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(proyeccion ?? []).map((item, idx) => (
                <tr key={idx} className={`${item.destacado ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-muted'} transition-colors`}>
                  <td className={`px-6 py-5 ${item.destacado ? 'font-bold text-primary' : 'font-medium'}`}>{item.periodo}</td>
                  <td className={`px-6 py-5 text-right font-mono ${item.destacado ? 'text-primary font-bold' : ''}`}>
                    {formatPYG(item.valor ?? 0)}
                  </td>
                </tr>
              ))}
              {(!proyeccion || proyeccion.length === 0) && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-on-surface-deep font-medium italic text-xs uppercase tracking-widest">
                    {t('bi.forecast.sales.emptyForecast', 'Sin proyección disponible.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seasonality Panel */}
      <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-border-subtle">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            {t('bi.forecast.sales.seasonalityTitle', 'Análisis de Estacionalidad')}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm font-bold text-on-surface-deep uppercase tracking-widest mb-4">{t('bi.forecast.sales.peaksLabel', 'Picos de Demanda')}</p>
              <div className="flex flex-wrap gap-3">
                {(estacionalidad?.picos ?? []).map((pico, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg border border-success/20">
                    <span className="font-bold">{pico.mes}</span>
                    <span className="text-xs opacity-75">{pico.descripcion}</span>
                  </div>
                ))}
                {(!estacionalidad?.picos || estacionalidad.picos.length === 0) && (
                  <span className="text-xs text-on-surface-deep italic">{t('bi.forecast.sales.emptySeasonality', 'Sin datos de estacionalidad.')}</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface-deep uppercase tracking-widest mb-4">{t('bi.forecast.sales.valleysLabel', 'Valles de Demanda')}</p>
              <div className="flex flex-wrap gap-3">
                {(estacionalidad?.valles ?? []).map((valle, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-lg border border-warning/20">
                    <span className="font-bold">{valle.mes}</span>
                    <span className="text-xs opacity-75">{valle.descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm font-bold text-on-surface-deep uppercase tracking-widest mb-4">{t('bi.forecast.sales.factorsLabel', 'Factores Estacionales por Mes')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {(estacionalidad?.factores ?? []).map((factor, idx) => (
              <div key={idx} className={`p-3 bg-surface-muted rounded-lg border border-border-subtle text-center ${factor.tipo === 'destacado' ? 'ring-2 ring-primary/20 ring-offset-1' : ''}`}>
                <p className="text-xs font-bold text-on-surface-deep mb-1">{factor.mes}</p>
                <p className={`text-sm font-mono font-bold ${factoresClass(factor.tipo)}`}>{factor.factor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PronosticoVentas;
