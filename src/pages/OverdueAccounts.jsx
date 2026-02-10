import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

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
      <div className="client-profile__loading">
        <div className="client-profile__spinner"></div>
        <p className="text-secondary">{t('receivables.loading.generic')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-profile__error">
        <span className="material-symbols-outlined text-danger" style={{ fontSize: '48px' }}>error</span>
        <h3 className="text-danger">{error}</h3>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="overdue-accounts">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <header className="receivables-master__header">
          <div className="flex flex-col gap-2">
            <h1 className="receivables-master__title">{t('receivables.overdue.title')}</h1>
            <p className="receivables-master__subtitle">{t('receivables.overdue.subtitle')}</p>
          </div>
          <div className="receivables-master__actions">
            <Button variant="outline">
              <span className="material-symbols-outlined">download</span>
              <span>{t('action.export', 'Exportar')}</span>
            </Button>
            <Button variant="primary">
              <span className="material-symbols-outlined">add_task</span>
              <span>{t('receivables.overdue.action.create_task')}</span>
            </Button>
          </div>
        </header>

        {/* KPI Grid */}
        <OverdueKpiGrid stats={stats} />

        {/* Main Content: Table & Sidebar */}
        <div className="overdue-accounts__grid">
          <OverdueTable accounts={accounts} />
          <OverdueSidebar />
        </div>
      </div>
    </div>
  );
};

export default OverdueAccounts;
