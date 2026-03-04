import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { RefreshCw, AlertTriangle, Download } from 'lucide-react';
import DashboardNav from '@/components/business-intelligence/DashboardNav';

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
 * Lista optimizada para esfuerzos de cobranza con prioridades y acciones rápidas.
 */
const OverdueAccounts = () => {
  const { t } = useI18n();
  const toast = useToast();
  const { stats, accounts, loading, error } = useOverdueAccounts();

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <RefreshCw className='animate-spin text-primary' size={48} />
        <p className='text-lg font-medium text-text-secondary'>{t('receivables.loading.generic')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="p-4 bg-red-100 rounded-full text-error mb-4">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-text-main">Error en la carga</h2>
        <p className="text-text-secondary mb-6 max-w-md">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Page Header & Actions al estilo Stitch */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
              {t('receivables.overdue.title', 'Cuentas Vencidas y Cobranzas')}
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
              {t('receivables.overdue.subtitle', 'Gestione deudas pendientes, asigne prioridad a cuentas y ejecute tareas de cobranza eficientemente.')}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              disabled
              onClick={() => toast.info(t('common.not_implemented'))}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
            >
              <span className="material-symbols-outlined !text-lg">ios_share</span>
              {t('action.export_report', 'Exportar Reporte')}
            </button>
            <button 
              disabled
              onClick={() => toast.info(t('common.not_implemented'))}
              className="flex items-center gap-2 px-5 py-2 bg-primary/50 text-white rounded-lg text-xs font-bold cursor-not-allowed opacity-70"
            >
              <span className="material-symbols-outlined !text-lg">add</span>
              {t('receivables.overdue.action.create_task', 'Crear Tarea')}
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <OverdueKpiGrid stats={stats} />

        {/* Main Content Area - Grid 9/12 para la tabla */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          {/* Left Column: Filters & Data Grid (9 de 12 columnas) */}
          <div className="lg:col-span-9 flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
            <OverdueTable accounts={accounts} toast={toast} />
          </div>
          {/* Right Column: Sidebar Widgets (3 de 12 columnas) */}
          <aside className="lg:col-span-3 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-700">
            <OverdueSidebar toast={toast} />
          </aside>
        </div>

        <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default OverdueAccounts;
