import React from 'react';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Tarjetas de resumen para el reporte de antigüedad.
 */
const AgingOverviewCards = ({ stats }) => {
  const { t } = useI18n();

  return (
    <div className="aging-report__stats-grid">
      <Card className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">{t('receivables.aging_report.total_os')}</p>
          <span className="material-symbols-outlined text-tertiary">account_balance</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="kpi-card__value">{formatPYG(stats.total_billed)}</p>
          <span className="status-pill status-pill--danger">+2.5%</span>
        </div>
        <p className="text-tertiary mt-2" style={{ fontSize: '10px' }}>
          {t('receivables.aging_report.vs_previous')}
        </p>
      </Card>

      <Card className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">{t('receivables.aging_report.dso')}</p>
          <span className="material-symbols-outlined text-tertiary">schedule</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="kpi-card__value">{stats.average_dso} Días</p>
          <span className="status-pill status-pill--success">-1.2 d</span>
        </div>
        <p className="text-tertiary mt-2" style={{ fontSize: '10px' }}>
          {t('receivables.aging_report.industry_avg_msg')}
        </p>
      </Card>

      <Card className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">{t('receivables.aging_report.efficiency')}</p>
          <span className="material-symbols-outlined text-tertiary">pie_chart</span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="kpi-card__value">{stats.collection_rate}%</p>
          <span className="status-pill status-pill--success">+0.5%</span>
        </div>
        <p className="text-tertiary mt-2" style={{ fontSize: '10px' }}>
          {t('receivables.statistics.collection_rate') || 'Tasa de Cobranza'}
        </p>
      </Card>
    </div>
  );
};

export default AgingOverviewCards;
