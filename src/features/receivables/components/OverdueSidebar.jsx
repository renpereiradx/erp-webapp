import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Sidebar con tareas del día y ranking de deudores.
 */
const OverdueSidebar = () => {
  const { t } = useI18n();

  return (
    <aside className="overdue-accounts__sidebar">
      {/* Tareas de Hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3 mb-4">
          <CardTitle className="mb-0">{t('receivables.overdue.sidebar.tasks_title')}</CardTitle>
          <Button variant="link" size="sm">{t('action.view', 'Ver')}</Button>
        </CardHeader>
        <CardContent>
          <div className="task-widget">
            <div className="task-widget__donut">
              <div className="task-widget__donut-inner">
                <span className="task-widget__value">28</span>
                <span className="task-widget__label">{t('common.total', 'Total')}</span>
              </div>
            </div>
            
            <div className="task-widget__stats">
              <div className="task-widget__stat-box">
                <p className="text-xs text-tertiary mb-1">Completadas</p>
                <p className="font-bold text-primary text-lg">14</p>
              </div>
              <div className="task-widget__stat-box">
                <p className="text-xs text-tertiary mb-1">Pendientes</p>
                <p className="font-bold text-lg">14</p>
              </div>
            </div>
          </div>
          
          <Button variant="outline" block className="mt-4 bg-secondary border-none">
            {t('receivables.overdue.sidebar.calling_session')}
          </Button>
        </CardContent>
      </Card>

      {/* Ranking de Deudores */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3 mb-4">
          <CardTitle className="mb-0">Principales Deudores</CardTitle>
          <Button variant="ghost" size="icon">
            <span className="material-symbols-outlined">more_horiz</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="debtor-list">
            {[
              { name: 'Global Industries', amount: '$52k', width: '90%', color: '#ef4444' },
              { name: 'Blue Moon Ltd', amount: '$38k', width: '70%', color: '#f59e0b' },
              { name: 'Acme Corp', amount: '$25k', width: '45%', color: '#3b82f6' },
              { name: 'Zenith Partners', amount: '$12k', width: '25%', color: '#3b82f6' }
            ].map((debtor, i) => (
              <div key={i} className="debtor-list__item">
                <div className="debtor-list__info">
                  <span className="debtor-list__name">{i+1}. {debtor.name}</span>
                  <span className="debtor-list__amount">{debtor.amount}</span>
                </div>
                <div className="debtor-list__track">
                  <div className="debtor-list__fill" style={{ width: debtor.width, backgroundColor: debtor.color }}></div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="link" block className="mt-5">
            Ver Ranking Completo
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
};

export default OverdueSidebar;
