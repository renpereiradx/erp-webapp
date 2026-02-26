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
    <div className="space-y-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header & Breadcrumbs */}
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/dashboard')} className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 hover:text-primary transition-colors">
                  {t('receivables.breadcrumb.home')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="opacity-20" />
              <BreadcrumbItem>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Finanzas</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="opacity-20" />
              <BreadcrumbItem>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-main">{t('receivables.master.title')}</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">{t('receivables.master.title')}</h1>
              <p className="text-sm text-text-secondary font-medium">{t('receivables.master.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="md" className="shadow-sm border-border-subtle bg-surface">
                <FileDown className="mr-2 size-4" />
                <span>Exportar CSV</span>
              </Button>
              <Button variant="primary" size="md" className="shadow-md">
                <Plus className="mr-2 size-4" />
                <span>{t('receivables.master.action.new')}</span>
              </Button>
            </div>
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