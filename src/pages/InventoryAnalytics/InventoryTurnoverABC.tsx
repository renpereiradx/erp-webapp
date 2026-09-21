import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { SummaryCard } from '../../components/InventoryAnalytics/SummaryCard';
import { CategoryTurnoverTable } from '../../components/InventoryAnalytics/CategoryTurnoverTable';
import { ABCParetoChart } from '../../components/InventoryAnalytics/ABCParetoChart';
import { formatNumber } from '../../utils/currencyUtils';
import { ABCProduct, TurnoverCategory } from '../../data/mockInventoryABCData';

// El backend solo acepta estos tokens en ?period= (parsePeriodQuery):
// la etiqueta es display, nunca viaja al API.
const PERIOD_OPTIONS = [
  { value: 'today', key: 'bi.inventory.period.today', fallback: 'Hoy' },
  { value: 'week', key: 'bi.inventory.period.week', fallback: 'Semana' },
  { value: 'month', key: 'bi.inventory.period.month', fallback: 'Mes' },
  { value: 'year', key: 'bi.inventory.period.year', fallback: 'Año' },
] as const;

type ApiPeriod = (typeof PERIOD_OPTIONS)[number]['value'];

interface TurnoverResponse {
  overall?: {
    turnover_rate?: number;
    days_of_inventory?: number;
  };
  by_category?: TurnoverCategory[];
}

interface ABCResponse {
  summary?: {
    class_a_value_pct?: number;
    class_b_value_pct?: number;
    class_c_value_pct?: number;
  };
  class_a?: ABCProduct[];
}

export const InventoryTurnoverABC: React.FC = () => {
  const { t } = useI18n();
  const [period, setPeriod] = useState<ApiPeriod>('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [turnover, setTurnover] = useState<TurnoverResponse | null>(null);
  const [abc, setAbc] = useState<ABCResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // La rotación y el ABC viven en endpoints distintos. allSettled:
        // fallo del turnover = error con retry; fallo del ABC = degradación
        // honesta (gráfico vacío). El cliente API lanza ApiError en !ok.
        const [turnoverRes, abcRes] = await Promise.allSettled([
          inventoryAnalyticsService.getTurnover({ period }),
          inventoryAnalyticsService.getABC({ period }),
        ]);
        if (cancelled) return;
        if (turnoverRes.status === 'fulfilled' && turnoverRes.value.success) {
          setTurnover(turnoverRes.value.data);
        } else {
          const reason = turnoverRes.status === 'rejected' ? turnoverRes.reason : null;
          setError(reason instanceof Error ? reason.message : 'error');
        }
        if (abcRes.status === 'fulfilled' && abcRes.value.success) {
          setAbc(abcRes.value.data);
        } else {
          setAbc(null);
        }
      } catch (err) {
        console.error('Error fetching turnover/ABC data:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [period, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.fallback ?? period;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg" aria-busy="true" data-testid="inventory-turnover-skeleton">
          <div className="h-16 bg-surface-muted rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
            <div className="h-72 bg-surface-muted rounded-md animate-pulse" />
            <div className="h-72 bg-surface-muted rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.inventory.breadcrumb', 'Inventario', {})}
          title={t('bi.inventory.turnover.title', 'Análisis de Rotación y ABC', {})}
          subtitle={t('bi.inventory.turnover.subtitle', 'Análisis detallado de rotación por categoría y valorización ABC en Guaraníes (Gs.)', {})}
          actions={
            <div className="flex h-10 items-center rounded-lg bg-surface-subtle/50 p-1 shadow-sm font-mono" role="group" aria-label={t('bi.inventory.period', 'Período', {})}>
              {PERIOD_OPTIONS.map((p) => (
                <label key={p.value} className="flex cursor-pointer h-full items-center justify-center rounded px-4 text-sm font-bold text-on-surface-deep hover:text-foreground transition-all has-[:checked]:bg-surface has-[:checked]:text-primary has-[:checked]:shadow-sm">
                  <span>{t(p.key, p.fallback, {})}</span>
                  <input
                    className="hidden"
                    name="periodo"
                    type="radio"
                    value={p.value}
                    checked={period === p.value}
                    onChange={() => setPeriod(p.value)}
                  />
                </label>
              ))}
            </div>
          }
        />

        {error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.inventory.turnover.errorTitle', 'No se pudo cargar el análisis de rotación y ABC', {})}
              message={error}
              onRetry={refetch}
            />
          </div>
        )}

        {!error && !turnover && (
          <div className="mt-lg">
            <EmptyState
              title={t('bi.inventory.turnover.emptyTitle', 'Sin datos de rotación para el período', {})}
              actionLabel={t('action.refresh', 'Actualizar', {})}
              onAction={refetch}
            />
          </div>
        )}

        {!error && turnover && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-lg">
              <SummaryCard
                title={t('bi.inventory.turnover.rate', 'Tasa Promedio de Rotación', {})}
                icon="sync_alt"
                value={`${formatNumber(turnover.overall?.turnover_rate ?? 0)}x`}
                changeDescription={t('bi.inventory.turnover.vsPrevious', 'Vs. periodo anterior ({period})', { period: periodLabel })}
                isPositiveGood={true}
              />
              <SummaryCard
                title={t('bi.inventory.turnover.days', 'Días Promedio de Inventario', {})}
                icon="calendar_today"
                value={t('bi.inventory.turnover.daysValue', '{n} días', { n: Math.round(turnover.overall?.days_of_inventory ?? 0) })}
                changeDescription={t('bi.inventory.turnover.efficiencyNote', 'Eficiencia en la gestión de stock', {})}
                isPositiveGood={false}
              />
            </div>

            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mt-lg">
              <CategoryTurnoverTable categories={turnover.by_category ?? []} />
              <ABCParetoChart
                classAProducts={abc?.class_a ?? []}
                classAPct={abc?.summary?.class_a_value_pct}
                classBPct={abc?.summary?.class_b_value_pct}
                classCPct={abc?.summary?.class_c_value_pct}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryTurnoverABC;
