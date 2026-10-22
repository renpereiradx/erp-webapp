import PageHeader from '@/components/ui/PageHeader'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PartialDataBanner } from '@/components/ui/PartialDataBanner'
import { useI18n } from '@/lib/i18n'
import { buildKpiGroups } from '@/domain/dashboard/kpis'
import {
  CardGridSkeleton,
  DashboardPeriodSelector,
  DashboardRefreshButton,
  KpiGroupsPanel,
  useDashboardKpis,
} from '@/features/bi-dashboard'

const DashboardKpisPage = () => {
  const { t } = useI18n()
  const kpisQuery = useDashboardKpis()
  const groups = buildKpiGroups(kpisQuery.data?.kpis)

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-container-max px-md pb-xl lg:px-lg">
        <PageHeader
          title={t('dashboard.kpis.title', 'KPIs y rendimiento')}
          subtitle={t('dashboard.kpis.subtitle', 'Indicadores del período seleccionado.')}
          actions={
            <div className="flex flex-wrap items-center gap-sm">
              <DashboardPeriodSelector />
              <DashboardRefreshButton />
            </div>
          }
        />

        <div className="space-y-xl">
          <PartialDataBanner metadata={kpisQuery.data?.metadata} />
          <QueryBoundary
            isLoading={kpisQuery.isLoading}
            error={kpisQuery.error}
            errorTitle={t('dashboard.errors.title', 'No se pudieron cargar los datos')}
            onRetry={() => void kpisQuery.refetch()}
            skeleton={<CardGridSkeleton count={5} columns={2} />}
          >
            <KpiGroupsPanel groups={groups} />
          </QueryBoundary>
        </div>
      </div>
    </div>
  )
}

export default DashboardKpisPage
