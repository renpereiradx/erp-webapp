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
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 flex flex-1 justify-center py-6">
          <div className="layout-content-container flex flex-col w-full max-w-[1400px] flex-1 gap-6">
            
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 px-1">
              <a className="text-[#617589] hover:text-primary text-sm font-medium leading-normal transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>
                {t('receivables.breadcrumb.home')}
              </a>
              <span className="text-[#617589] text-sm font-medium leading-normal">/</span>
              <span className="text-[#617589] text-sm font-medium leading-normal">Finanzas</span>
              <span className="text-[#617589] text-sm font-medium leading-normal">/</span>
              <span className="text-[#111418] dark:text-white text-sm font-medium leading-normal">{t('receivables.master.title')}</span>
            </div>

            {/* Header & Main Actions */}
            <div className="flex flex-wrap justify-between gap-4 items-end px-1">
              <div className="flex min-w-72 flex-col gap-2">
                <h1 className="text-[#111418] dark:text-white text-3xl font-bold leading-tight tracking-[-0.02em]">Cuentas por Cobrar</h1>
                <p className="text-[#617589] text-sm font-normal leading-normal">Gestiona pagos pendientes y recaudo de clientes.</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center justify-center rounded-lg h-9 bg-white dark:bg-gray-800 border border-[#d1d5db] dark:border-gray-700 text-[#111418] dark:text-white gap-2 text-sm font-medium px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">ios_share</span>
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>
                <button className="flex items-center justify-center rounded-lg h-9 bg-primary text-white gap-2 text-sm font-bold px-4 hover:bg-blue-600 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>Nuevo Cobro</span>
                </button>
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
      </div>
    </div>
  );
};

export default ReceivablesMasterList;