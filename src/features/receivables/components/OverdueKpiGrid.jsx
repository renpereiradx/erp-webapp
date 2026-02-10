import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';

/**
 * Grid de KPIs para la página de cuentas vencidas.
 */
const OverdueKpiGrid = ({ stats }) => {
  const { t } = useI18n();

  return (
    <div className="receivables-dashboard__kpi-grid">
      <Card className="kpi-card">
        <p className="kpi-card__label">{t('receivables.overdue.kpi.total_overdue')}</p>
        <div className="flex items-end gap-2">
          <h3 className="kpi-card__value">{stats.totalOverdue}</h3>
          <span className="kpi-card__trend is-bad">
            <span className="material-symbols-outlined">arrow_upward</span> 5.2%
          </span>
        </div>
      </Card>

      <Card className="kpi-card">
        <p className="kpi-card__label">{t('receivables.overdue.kpi.at_risk')}</p>
        <div className="flex items-end gap-2">
          <h3 className="kpi-card__value">{stats.atRisk}</h3>
          <span className="kpi-card__trend is-bad">
            <span className="material-symbols-outlined">arrow_upward</span> 2
          </span>
        </div>
      </Card>

      <Card className="kpi-card">
        <p className="kpi-card__label">{t('receivables.overdue.kpi.efficiency')}</p>
        <div className="flex items-end gap-2">
          <h3 className="kpi-card__value">{stats.efficiency}%</h3>
          <span className="text-tertiary" style={{ fontSize: '10px', marginBottom: '4px' }}>Target: 75%</span>
        </div>
        <Progress value={stats.efficiency} className="h-1.5 mt-2" />
      </Card>

      <Card className="kpi-card">
        <p className="kpi-card__label">{t('receivables.overdue.kpi.promises')}</p>
        <div className="flex items-end gap-2">
          <h3 className="kpi-card__value">{stats.promises}</h3>
          <span className="text-tertiary" style={{ fontSize: '10px', marginBottom: '4px' }}>
            {t('receivables.overdue.kpi.due_this_week')}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default OverdueKpiGrid;
