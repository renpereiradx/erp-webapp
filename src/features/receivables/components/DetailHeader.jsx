import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, Download, Printer, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Encabezado detallado para una factura específica.
 */
const DetailHeader = ({ id, client = {}, transaction = {} }) => {
  const { t } = useI18n();

  const progressPercent = transaction.rawAmount > 0
    ? Math.round((transaction.rawPaid / transaction.rawAmount) * 100)
    : 0;

  const isOverdue = transaction.status === 'Overdue';

  return (
    <Card>
      <CardContent className="receivable-detail__header-card">
        <div className="receivable-detail__main-info">
          <div className="receivable-detail__title-group">
            <div className="receivable-detail__icon-box">
              <Building2 size={24} />
            </div>
            <div>
              <div className="receivable-detail__title">
                <h1>{t('receivables.detail.title', { id })}</h1>
                <Badge variant={isOverdue ? 'destructive' : 'success'}>
                  {isOverdue
                    ? <><AlertTriangle size={12} /> {transaction.status}</>
                    : <><CheckCircle2 size={12} /> {transaction.status}</>
                  }
                </Badge>
              </div>
              <p className="receivable-detail__subtitle">
                {client.name} {client.id ? `\u2022 ${t('receivables.profile.client_id')}: ${client.id}` : ''}
              </p>
              <div className="receivable-detail__meta">
                <Calendar size={16} />
                <span>{t('receivables.detail.issued')}: <strong>{transaction.issueDate}</strong></span>
                <span className="receivable-detail__meta-separator"></span>
                <span>{t('receivables.detail.due')}: <strong>{transaction.dueDate}</strong></span>
                {isOverdue && transaction.daysOverdue > 0 && (
                  <>
                    <span className="receivable-detail__meta-separator"></span>
                    <span className="receivable-detail__overdue-label">
                      {t('receivables.detail.overdue_days', { days: transaction.daysOverdue })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="receivable-detail__actions">
            <Button variant="outline">
              <Download size={16} />
              <span>PDF</span>
            </Button>
            <Button variant="outline">
              <Printer size={16} />
              <span>{t('action.print', 'Imprimir')}</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats Bar */}
        <div className="receivable-detail__stats-bar">
          <div className="receivable-detail__stat-item">
            <p className="receivable-detail__stat-label">{t('receivables.detail.stats.total_invoiced')}</p>
            <p className="receivable-detail__stat-value">{transaction.amount}</p>
          </div>
          <div className="receivable-detail__stat-item">
            <p className="receivable-detail__stat-label">{t('receivables.detail.stats.total_paid')}</p>
            <p className="receivable-detail__stat-value receivable-detail__stat-value--success">
              {transaction.paid}
            </p>
          </div>
          <div className="receivable-detail__stat-item">
            <p className="receivable-detail__stat-label">{t('receivables.detail.stats.balance_due')}</p>
            <p className="receivable-detail__stat-value receivable-detail__stat-value--primary">
              {transaction.balance}
            </p>
            <div className="receivable-detail__progress-bar">
              <div className="receivable-detail__progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailHeader;
