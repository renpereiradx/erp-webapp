import { useI18n } from '@/lib/i18n';
import { useParams } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import { useClientCreditProfile } from '@/features/receivables/hooks/useClientCreditProfile';
import RiskGauge from '@/features/receivables/components/RiskGauge';
import ClientInfoList from '@/features/receivables/components/ClientInfoList';
import KPIStatsGrid from '@/features/receivables/components/KPIStatsGrid';
import AgingBar from '@/features/receivables/components/AgingBar';
import InvoicesTable from '@/features/receivables/components/InvoicesTable';

/**
 * Perfil de Crédito del Cliente y Análisis de Riesgo.
 * Migración FASE 3: .tsx + PageHeader + 3 estados; el retry usa el refresh
 * del hook; los botones Añadir Nota/Suspender Crédito/Exportar (todos
 * disabled con toast stub) se eliminaron (§2.6).
 */
const ClientCreditProfile = () => {
  const { clientId } = useParams();
  const { t } = useI18n();
  const { data, loading, error, refresh } = useClientCreditProfile(clientId);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.receivables.breadcrumb', 'Cuentas por Cobrar', {})}
          title={data?.client.name || t('bi.receivables.profile.title', 'Perfil de Crédito', {})}
          subtitle={data?.client.id ? `${t('bi.receivables.profile.clientId', 'ID de Cliente', {})} #${data.client.id}` : undefined}
          actions={
            <button
              type="button"
              onClick={() => refresh()}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              {t('bi.profitability.action.refresh', 'Actualizar', {})}
            </button>
          }
        />

        {loading && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="profile-skeleton">
            <div className="h-24 bg-surface-muted rounded-md animate-pulse" />
            <GenericSkeletonList count={6} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && (error || !data) && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.receivables.profile.errorTitle', 'Error al cargar el perfil', {})}
              message={error || t('bi.receivables.profile.errorBody', 'No se pudo cargar la información del cliente.', {})}
              onRetry={refresh}
            />
          </div>
        )}

        {!loading && data && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-md mt-lg">
            {/* Left Column: Risk & Info */}
            <div className="xl:col-span-3 flex flex-col gap-md">
              <RiskGauge score={data.risk.score} level={data.risk.level} recommendation={data.risk.recommendation} />
              <ClientInfoList
                address={data.client.address}
                contact={data.client.contact}
                phone={data.client.phone}
                rep={data.client.rep}
                taxId={data.client.taxId}
              />
            </div>

            {/* Right Column: Metrics & Data */}
            <div className="xl:col-span-9 flex flex-col gap-md">
              <KPIStatsGrid metrics={data.metrics} />
              <AgingBar aging={data.aging} totalAR={data.metrics.outstanding} />
              <InvoicesTable invoices={data.invoices} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCreditProfile;
