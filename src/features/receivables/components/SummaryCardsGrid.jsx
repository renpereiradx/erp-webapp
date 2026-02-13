import React from 'react';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * Grid de tarjetas de resumen para el dashboard de CXC.
 */
const SummaryCardsGrid = ({ summary }) => {
  const { t } = useI18n();

  return (
    <div className="receivables-dashboard__kpi-grid">
      <Card className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">{t('receivables.metrics.outstanding')}</p>
          <div className="kpi-card__icon kpi-card__icon--blue">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>
        <h3 className="kpi-card__value">{formatPYG(summary.totalReceivables?.amount)}</h3>
        <div className="kpi-card__trend is-good">
          <span className="material-symbols-outlined">trending_up</span>
          <span>{summary.totalReceivables?.trend}% {t('receivables.metrics.trend.vs_last_month')}</span>
        </div>
      </Card>

      <Card className="kpi-card kpi-card--danger">
        <div className="kpi-card__header">
          <p className="kpi-card__label">Total Vencido</p>
          <div className="kpi-card__icon kpi-card__icon--red">
            <span className="material-symbols-outlined">warning</span>
          </div>
        </div>
        <h3 className="kpi-card__value">{formatPYG(summary.overdueAmount?.amount)}</h3>
        <div className="kpi-card__trend is-bad">
          <span className="material-symbols-outlined">trending_up</span>
          <span>{summary.overdueAmount?.percentage}% Crítico</span>
        </div>
      </Card>

      <Card className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">Créditos y Devoluciones</p>
          <div className="kpi-card__icon kpi-card__icon--green">
            <span className="material-symbols-outlined">assignment_return</span>
          </div>
        </div>
        <h3 className="kpi-card__value">{formatPYG(summary.creditsReturns?.amount)}</h3>
        <div className="kpi-card__trend is-good">
          <span className="material-symbols-outlined">trending_down</span>
          <span>Estable</span>
        </div>
      </Card>

      <Card className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">Estado de Sincronización</p>
          <div className="kpi-card__icon kpi-card__icon--orange">
            <span className="material-symbols-outlined">sync</span>
          </div>
        </div>
        <h3 className="kpi-card__value" style={{ fontSize: '1.125rem' }}>{summary.lastSync?.status}</h3>
        <p className="text-tertiary" style={{ fontSize: '10px' }}>Oct 26, 2023, 09:41 AM</p>
      </Card>
    </div>
  );
};

export default SummaryCardsGrid;
