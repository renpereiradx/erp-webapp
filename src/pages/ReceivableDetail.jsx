import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Hooks
import { useReceivableDetail } from '@/features/receivables/hooks/useReceivableDetail';

// Sub-componentes
import DetailHeader from '@/features/receivables/components/DetailHeader';
import PaymentHistoryTable from '@/features/receivables/components/PaymentHistoryTable';
import DetailSidebar from '@/features/receivables/components/DetailSidebar';

/**
 * Receivable Detail & Payment History
 */
const ReceivableDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data, loading, error } = useReceivableDetail(id);

  if (loading) {
    return (
      <div className="client-profile__loading">
        <div className="client-profile__spinner"></div>
        <p className="text-secondary">{t('receivables.loading.detail')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="client-profile__error">
        <AlertCircle size={48} className="text-destructive" />
        <h3 className="text-danger">{t('receivables.error.detail')}</h3>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="receivable-detail">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/dashboard')} className="cursor-pointer">
              {t('receivables.breadcrumb.home')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/receivables/list')} className="cursor-pointer">
              {t('receivables.master.title')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('receivables.detail.title', { id: data.id })}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <DetailHeader
        id={data.id}
        client={data.client || {}}
        transaction={data.transaction || {}}
      />

      {/* Content Grid */}
      <div className="receivable-detail__content-grid">
        {/* Left Column: Payment History */}
        <PaymentHistoryTable
          history={data.paymentHistory || []}
          totalPaid={data.transaction?.rawPaid || 0}
          currency={data.transaction?.currency || ''}
        />

        {/* Right Column: Actions & Contact */}
        <DetailSidebar client={data.client || {}} />
      </div>
    </div>
  );
};

export default ReceivableDetail;
