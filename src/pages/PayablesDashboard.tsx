import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import { usePayables } from '@/features/accounts-payable/hooks/usePayables';
import FilterRibbon from '@/features/accounts-payable/components/FilterRibbon';
import KPICards from '@/features/accounts-payable/components/KPICards';
import AgingSummary from '@/features/accounts-payable/components/AgingSummary';
import UpcomingPayments from '@/features/accounts-payable/components/UpcomingPayments';
import SuppliersDebtTable from '@/features/accounts-payable/components/SuppliersDebtTable';
import { buildAgingBars, buildAgingStats, buildPayablesKpis, buildSuppliersDebtRows, buildUpcomingPayments } from '@/domain/payables/dashboard';

/**
 * Resumen de Cuentas por Pagar.
 * Migración FASE 4: .tsx + PageHeader + 3 estados (el legacy usaba spinner
 * sin estado de error). Las transformaciones viven en
 * domain/payables/dashboard (F1).
 */
const PayablesDashboard = () => {
  const { t } = useI18n();
  const { loading, error, overview, topSuppliers, schedule, fetchOverview, fetchTopSuppliers, fetchSchedule } = usePayables();

  const [filters, setFilters] = useState({ period: 'month', currency: 'PYG', search: '' });
  const [suppliersPagination, setSuppliersPagination] = useState({ page: 1, pageSize: 5 });

  useEffect(() => {
    document.title = t('bi.payables.dashboard.docTitle', 'Resumen de Cuentas por Pagar | ERP System', {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = () => {
    fetchOverview();
    fetchTopSuppliers(10); // Dashboard siempre muestra top 10
    fetchSchedule(30);
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.period]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage: number) => {
    setSuppliersPagination((prev) => ({ ...prev, page: newPage }));
  };

  const transformedKpis = buildPayablesKpis(overview);
  const agingData = buildAgingBars(overview);
  const agingStats = buildAgingStats(overview);
  const transformedPayments = buildUpcomingPayments(schedule);
  const transformedVendors = buildSuppliersDebtRows(topSuppliers, filters.search);

  const lastUpdate = new Date().toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.payables.breadcrumb', 'Finanzas', {})}
          title={t('bi.payables.dashboard.title', 'Resumen de Cuentas por Pagar', {})}
          subtitle={`${t('bi.payables.dashboard.lastUpdate', 'Última actualización', {})}: ${lastUpdate}`}
          actions={
            <button
              type="button"
              onClick={refreshData}
              className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              {t('bi.profitability.action.refresh', 'Actualizar', {})}
            </button>
          }
        />

        {loading && !overview && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="payables-dashboard-skeleton">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-muted rounded-md animate-pulse" />
              ))}
            </div>
            <GenericSkeletonList count={6} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && !overview && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.payables.dashboard.errorTitle', 'No se pudo cargar el dashboard de CxP', {})}
              message={error}
              onRetry={refreshData}
            />
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="mt-lg">
              <FilterRibbon filters={filters} onFilterChange={handleFilterChange} />
            </section>

            <section className="mt-lg">
              <KPICards kpis={transformedKpis} />
            </section>

            {/* Middle Section: Split Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-md mt-lg">
              <div className="xl:col-span-2">
                <AgingSummary aging={agingData} stats={agingStats} />
              </div>
              <div>
                <UpcomingPayments payments={transformedPayments} />
              </div>
            </div>

            <section className="mt-lg">
              <SuppliersDebtTable
                vendors={transformedVendors.slice(
                  (suppliersPagination.page - 1) * suppliersPagination.pageSize,
                  suppliersPagination.page * suppliersPagination.pageSize,
                )}
                pagination={{
                  page: suppliersPagination.page,
                  pageSize: suppliersPagination.pageSize,
                  totalItems: transformedVendors.length,
                  totalPages: Math.max(1, Math.ceil(transformedVendors.length / suppliersPagination.pageSize)),
                }}
                onPageChange={handlePageChange}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default PayablesDashboard
