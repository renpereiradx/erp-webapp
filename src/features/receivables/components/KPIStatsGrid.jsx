import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra el grid de KPIs clave.
 */
const KPIStatsGrid = ({ metrics }) => {
  const { t } = useI18n();

  return (
    <div className="receivables-dashboard__kpi-grid">
      <Card className="kpi-card">
        <CardHeader className="p-0 border-none mb-1">
          <p className="kpi-card__label uppercase tracking-wide">{t('receivables.metrics.outstanding')}</p>
        </CardHeader>
        <p className="kpi-card__value">{metrics.outstanding}</p>
        <div className="kpi-card__trend is-bad">
          <span className="material-symbols-outlined">trending_up</span>
          <span>+12% {t('receivables.metrics.trend.vs_last_month')}</span>
        </div>
      </Card>
      
      <Card className="kpi-card">
        <CardHeader className="p-0 border-none mb-1">
          <p className="kpi-card__label uppercase tracking-wide">{t('receivables.metrics.limit')}</p>
        </CardHeader>
        <p className="kpi-card__value">{metrics.limit}</p>
        <div className="progress progress--thin mt-2">
          <div className="progress__track">
            <div className="progress__fill" style={{ width: `${metrics.utilization}%` }}></div>
          </div>
        </div>
        <p className="text-tertiary" style={{ fontSize: '10px', marginTop: '4px', textAlign: 'right' }}>
          {metrics.utilization}% {t('receivables.metrics.utilization')}
        </p>
      </Card>
      
      <Card className="kpi-card">
        <CardHeader className="p-0 border-none mb-1">
          <p className="kpi-card__label uppercase tracking-wide">{t('receivables.metrics.avg_days')}</p>
        </CardHeader>
        <p className="kpi-card__value">{metrics.avgDays}</p>
        <div className="kpi-card__trend is-bad">
          <span className="material-symbols-outlined">warning</span>
          <span>{t('receivables.metrics.industry_avg')}</span>
        </div>
      </Card>
      
      <Card className="kpi-card">
        <CardHeader className="p-0 border-none mb-1">
          <p className="kpi-card__label uppercase tracking-wide">{t('receivables.metrics.last_payment')}</p>
        </CardHeader>
        <p className="kpi-card__value">{metrics.lastPayment}</p>
        <p className="text-tertiary" style={{ fontSize: '10px', marginTop: '4px' }}>
          {t('receivables.metrics.received', { days: 2 })}
        </p>
      </Card>
    </div>
  );
};

export default KPIStatsGrid;
