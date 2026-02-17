import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { FileDown, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Hooks
import { useReceivablesMasterList } from '@/features/receivables/hooks/useReceivablesMasterList';

// Sub-componentes
import MasterListFilters from '@/features/receivables/components/MasterListFilters';
import MasterListTable from '@/features/receivables/components/MasterListTable';

/**
 * Receivables Master List & Filters
 * Gestión masiva de cuentas por cobrar con filtros avanzados.
 */
const ReceivablesMasterList = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    invoices,
    loading,
    filters,
    pagination,
    sorting,
    handleFilterChange,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    refresh
  } = useReceivablesMasterList();

  return (
    <div className="receivables-master">
      <div className="receivables-master__content">
        
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/dashboard')} className="cursor-pointer">
                {t('receivables.breadcrumb.home')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Finanzas</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('receivables.master.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="receivables-master__header">
          <div>
            <h1 className="receivables-master__title">{t('receivables.master.title')}</h1>
            <p className="receivables-master__subtitle">{t('receivables.master.subtitle')}</p>
          </div>
          <div className="receivables-master__actions">
            <Button variant="outline">
              <FileDown className="size-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            <Button variant="default">
              <Plus className="size-4" />
              <span>{t('receivables.master.action.new')}</span>
            </Button>
          </div>
        </div>

        {/* Panel de Filtros */}
        <MasterListFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onReset={resetFilters} 
        />

        {/* Grid de Datos */}
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
      </div>
    </div>
  );
};

export default ReceivablesMasterList;