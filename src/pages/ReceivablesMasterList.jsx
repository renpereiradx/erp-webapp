import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CircleDollarSign, Plus, Download } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Hooks
import { useReceivablesMasterList } from '@/features/receivables/hooks/useReceivablesMasterList';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

// Sub-componentes
import MasterListFilters from '@/features/receivables/components/MasterListFilters';
import MasterListTable from '@/features/receivables/components/MasterListTable';

/**
 * Receivables Master List & Filters
 * Refactorizado para 100% fidelidad visual y consistencia con Payables.
 */
const ReceivablesMasterList = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
            
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors flex items-center gap-1">
            Inicio
          </button>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <span className="text-slate-600 dark:text-slate-300">Cuentas por Cobrar</span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary shadow-sm border border-primary/20 flex-shrink-0">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate">
                {t('receivables.master.title', 'Cuentas por Cobrar')}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5 truncate">
                Gestión masiva de pagos pendientes y recaudo
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => toast.info(t('common.not_implemented'))}
              className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
            >
              <Download size={16} className="mr-2 text-slate-400" />
              Exportar
            </button>
            <button className="flex items-center px-5 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md shadow-primary/20 active:scale-95">
              <Plus size={16} className="mr-1.5" />
              Nuevo Cobro
            </button>
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
      <main>
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default ReceivablesMasterList;
