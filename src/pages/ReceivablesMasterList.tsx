import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import { CircleDollarSign, RefreshCcw } from 'lucide-react';
import { useReceivablesMasterList } from '@/features/receivables/hooks/useReceivablesMasterList';
import MasterListFilters from '@/features/receivables/components/MasterListFilters';
import MasterListTable from '@/features/receivables/components/MasterListTable';

/**
 * Lista maestra de cuentas por cobrar.
 * Migración FASE 3: .tsx + PageHeader + tokens. Botones Exportar/Nuevo
 * Cobro sin handler eliminados (§2.6).
 */
const ReceivablesMasterList = () => {
  const { t } = useI18n();
  const {
    invoices,
    loading,
    error,
    filters,
    pagination,
    sorting,
    handleFilterChange,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    refresh,
  } = useReceivablesMasterList();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.receivables.breadcrumb', 'Cuentas por Cobrar', {})}
          title={t('receivables.master.title', 'Cuentas por Cobrar', {})}
          subtitle={t('bi.receivables.master.subtitle', 'Gestión masiva de pagos pendientes y recaudo', {})}
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

        {error && (
          <p className="mt-lg text-body-md text-error" role="alert">
            {error}
          </p>
        )}

        <section className="mt-lg">
          <MasterListFilters filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} />
        </section>

        <main className="mt-lg flex flex-col gap-sm">
          <div className="flex items-center gap-xs text-label-caps uppercase text-on-surface-deep">
            <CircleDollarSign size={14} className="shrink-0" />
            {t('bi.receivables.master.listHint', 'Los filtros de fecha y estado se aplican en el servidor.', {})}
          </div>
          <MasterListTable
            invoices={invoices}
            loading={loading}
            pagination={pagination}
            sorting={sorting}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSort={handleSort}
            onRefresh={refresh}
          />
        </main>
      </div>
    </div>
  );
};

export default ReceivablesMasterList;
