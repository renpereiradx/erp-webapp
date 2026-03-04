import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { RefreshCw, AlertTriangle, Download, ChevronRight, AlertCircle, Plus, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';

// Hooks
import { useOverdueAccounts } from '@/features/receivables/hooks/useOverdueAccounts';

// Sub-componentes
import OverdueKpiGrid from '@/features/receivables/components/OverdueKpiGrid';
import OverdueTable from '@/features/receivables/components/OverdueTable';
import OverdueSidebar from '@/features/receivables/components/OverdueSidebar';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

/**
 * Overdue Accounts & Collection Tasks
 * Refactorizado para 100% fidelidad visual y consistencia con Payables.
 */
const OverdueAccounts = () => {
  const { t } = useI18n();
  const toast = useToast();
  const { stats, accounts, loading, error } = useOverdueAccounts();

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <RefreshCw className='animate-spin text-primary' size={48} />
        <p className='text-lg font-medium text-slate-500'>Analizando mora y tareas de cobranza...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="p-4 bg-red-50 rounded-full text-fluent-danger mb-4 shadow-sm border border-red-100">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight uppercase">Error en la carga</h2>
        <p className="text-slate-500 mb-6 max-w-md font-medium">{error}</p>
        <Button variant="primary" className="rounded-xl px-8" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            <Link to="/receivables" className="hover:text-primary transition-colors flex items-center gap-1">
              Cuentas por Cobrar
            </Link>
            <ChevronRight size={12} className="mx-2 opacity-30" />
            <span className="text-slate-600 dark:text-slate-300">Cuentas Vencidas</span>
          </nav>

          {/* Title & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl text-fluent-danger shadow-sm border border-red-100 dark:border-red-900/10 flex-shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate">
                  {t('receivables.overdue.title', 'Cuentas Vencidas y Cobranzas')}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5 truncate">
                  Gestión estratégica de deudas y tareas de recaudo
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => toast.info(t('common.not_implemented'))}
                className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
              >
                <FileDown size={16} className="mr-2 text-slate-400" />
                Reporte
              </button>
              <button 
                onClick={() => toast.info(t('common.not_implemented'))}
                className="flex items-center px-5 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md shadow-primary/20 active:scale-95"
              >
                <Plus size={16} className="mr-1.5" />
                Nueva Tarea
              </button>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <OverdueKpiGrid stats={stats} />

        {/* Main Content Area - Grid 9/12 para la tabla */}
        <div className="grid grid-cols-12 gap-6 mt-2">
          {/* Left Column: Filters & Data Grid (9 de 12 columnas) */}
          <div className="col-span-12 xl:col-span-9 flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
            <OverdueTable accounts={accounts} toast={toast} />
          </div>
          {/* Right Column: Sidebar Widgets (3 de 12 columnas) */}
          <aside className="col-span-12 xl:col-span-3 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-700">
            <OverdueSidebar toast={toast} />
          </aside>
        </div>

        <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default OverdueAccounts;
