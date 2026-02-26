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
    <div className='space-y-8'>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">{t('receivables.overdue.title')}</h1>
            <p className="text-sm text-text-secondary font-medium">{t('receivables.overdue.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" className="shadow-sm border-border-subtle bg-surface">
              <Download className="mr-2 size-4" />
              <span>{t('action.export', 'Exportar')}</span>
            </Button>
            <Button variant="primary" size="md" className="shadow-md">
              <span className="material-symbols-outlined text-[18px] mr-2">add_task</span>
              <span>{t('receivables.overdue.action.create_task')}</span>
            </Button>
          </div>
        </header>

        <DashboardNav />

        {/* KPI Grid */}
        <OverdueKpiGrid stats={stats} />

        {/* Main Content: Table & Sidebar */}
        <div className='grid grid-cols-1 xl:grid-cols-4 gap-8 pb-10'>
          <div className="xl:col-span-3">
            <OverdueTable accounts={accounts} />
          </div>
          <div className="xl:col-span-1">
            <OverdueSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverdueAccounts;
