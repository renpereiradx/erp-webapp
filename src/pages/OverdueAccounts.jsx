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

/**
 * Overdue Accounts & Collection Tasks
 * Lista optimizada para esfuerzos de cobranza con prioridades y acciones rápidas.
 */
const OverdueAccounts = () => {
  const { t } = useI18n();
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
    <div className='bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col min-h-screen overflow-x-hidden font-display'>
      <div className="flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-8">
        
        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('receivables.overdue.title', 'Cuentas Vencidas y Cobranzas')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              {t('receivables.overdue.subtitle', 'Gestione deudas pendientes, asigne prioridad a cuentas y ejecute tareas de cobranza eficientemente.')}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1A2633] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
              <span className="material-symbols-outlined !text-lg">download</span>
              {t('action.export_report', 'Exportar Reporte')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
              <span className="material-symbols-outlined !text-lg">add_task</span>
              {t('receivables.overdue.action.create_task', 'Crear Tarea')}
            </button>
          </div>
        </div>

        {/* Dashboard Nav (If needed, although Stitch does not have it here explicitly, we can keep it if it's application logic) */}
        {/* <DashboardNav /> */}

        {/* KPI Grid */}
        <OverdueKpiGrid stats={stats} />

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 mt-8">
          {/* Left Column: Filters & Data Grid */}
          <div className="w-full lg:w-3/4 flex flex-col gap-6">
            <OverdueTable accounts={accounts} />
          </div>
          {/* Right Column: Sidebar Widgets */}
          <aside className="w-full lg:w-1/4 flex flex-col gap-6">
            <OverdueSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OverdueAccounts;
