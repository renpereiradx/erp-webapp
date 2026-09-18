import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useOverdueAccounts } from '@/features/receivables/hooks/useOverdueAccounts';
import OverdueKpiGrid from '@/features/receivables/components/OverdueKpiGrid';
import OverdueTable from '@/features/receivables/components/OverdueTable';

/**
 * Cuentas Vencidas y Cobranzas.
 * Migración FASE 3: .tsx + 3 estados (el legacy usaba spinner + reload);
 * el retry usa el refresh del hook (window.location.reload eliminado);
 * sidebar de widgets mock eliminado del árbol.
 */
const OverdueAccounts = () => {
  const { t } = useI18n();
  const { stats, accounts, loading, error, refresh } = useOverdueAccounts();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.receivables.breadcrumb', 'Cuentas por Cobrar', {})}
          title={t('receivables.overdue.title', 'Cuentas Vencidas y Cobranzas', {})}
          subtitle={t('bi.receivables.overdue.subtitle', 'Gestión estratégica de deudas y tareas de recaudo', {})}
          actions={
            <button
              type="button"
              onClick={() => refresh()}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('bi.profitability.action.refresh', 'Actualizar', {})}
            </button>
          }
        />

        {loading && (
          <div className="mt-lg" aria-busy="true" data-testid="overdue-skeleton">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <GenericSkeletonList count={6} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.receivables.overdue.errorTitle', 'Error en la carga', {})}
              message={error}
              onRetry={refresh}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="mt-lg">
              <OverdueKpiGrid stats={stats} />
            </section>
            <section className="mt-lg">
              <OverdueTable accounts={accounts} />
            </section>
          </>
        )}

        {!loading && !error && (
          <div className="flex items-center gap-xs mt-lg text-label-caps uppercase text-on-surface-deep">
            <AlertCircle size={14} className="shrink-0" />
            {t('bi.receivables.overdue.hint', 'Los datos provienen del reporte de vencidos en tiempo real.', {})}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverdueAccounts;
