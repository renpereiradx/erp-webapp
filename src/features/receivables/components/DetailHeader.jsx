import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Encabezado detallado para una factura específica.
 */
const DetailHeader = ({ id, client, transaction }) => {
  const { t } = useI18n();

  return (
    <div className="rec-card rec-card--header">
      <div className="receivable-detail__main-info">
        <div className="receivable-detail__title-group">
          <div className="receivable-detail__icon-box">
            <span className="material-symbols-outlined text-3xl">domain</span>
          </div>
          <div>
            <div className="receivable-detail__title">
              <h1>{t('receivables.detail.title', { id })}</h1>
              <div className={`rec-badge ${transaction.status === 'Overdue' ? 'rec-badge--danger' : 'rec-badge--success'}`}>
                <span className="material-symbols-outlined text-sm">
                  {transaction.status === 'Overdue' ? 'warning' : 'check_circle'}
                </span>
                <span>{transaction.status}</span>
              </div>
            </div>
            <p className="receivable-detail__subtitle">
              {client.name} • {t('receivables.profile.client_id')}: {client.id}
            </p>
            <div className="receivable-detail__meta">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              <span>{t('receivables.detail.issued')}: <strong>{transaction.issueDate}</strong></span>
              <span className="size-1 rounded-full bg-gray-300"></span>
              <span>{t('receivables.detail.due')}: <strong>{transaction.dueDate}</strong></span>
              {transaction.status === 'Overdue' && (
                <>
                  <span className="size-1 rounded-full bg-gray-300"></span>
                  <span className="text-danger font-medium">
                    {t('receivables.detail.overdue_days', { days: 15 })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="receivable-detail__actions">
          <Button variant="outline">
            <span className="material-symbols-outlined">download</span>
            <span>PDF</span>
          </Button>
          <Button variant="outline">
            <span className="material-symbols-outlined">print</span>
            <span>{t('action.print', 'Imprimir')}</span>
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="receivable-detail__stats-bar">
        <div className="receivable-detail__stat-item">
          <p className="receivable-detail__stat-label">{t('receivables.detail.stats.total_invoiced')}</p>
          <p className="receivable-detail__stat-value">{transaction.currency}{transaction.amount}</p>
        </div>
        <div className="receivable-detail__stat-item has-connector">
          <p className="receivable-detail__stat-label">{t('receivables.detail.stats.total_paid')}</p>
          <p className="receivable-detail__stat-value text-success">
            {transaction.currency}{transaction.paid}
          </p>
        </div>
        <div className="receivable-detail__stat-item has-equal">
          <p className="receivable-detail__stat-label">{t('receivables.detail.stats.balance_due')}</p>
          <p className="receivable-detail__stat-value text-primary">
            {transaction.currency}{transaction.balance}
          </p>
          <div className="receivable-detail__progress">
            <div className="receivable-detail__progress-fill" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailHeader;
