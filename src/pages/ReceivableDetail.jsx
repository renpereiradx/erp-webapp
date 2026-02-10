import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

// Hooks
import { useReceivableDetail } from '@/features/receivables/hooks/useReceivableDetail';

// Sub-componentes
import DetailHeader from '@/features/receivables/components/DetailHeader';
import PaymentHistoryTable from '@/features/receivables/components/PaymentHistoryTable';
import DetailSidebar from '@/features/receivables/components/DetailSidebar';

/**
 * Receivable Detail & Payment History
 * Vista granular de una factura específica con historial y acciones.
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
        <span className="material-symbols-outlined text-danger" style={{ fontSize: '48px' }}>error</span>
        <h3 className="text-danger">{t('receivables.error.detail')}</h3>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="receivable-detail">
      {/* Breadcrumbs */}
      <nav className="client-profile__breadcrumb">
        <a href="#" className="client-profile__breadcrumb-link" onClick={() => navigate('/receivables')}>
          {t('receivables.title')}
        </a>
        <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
        <span className="client-profile__breadcrumb-current">Detalle</span>
        <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
        <span className="client-profile__breadcrumb-current">{t('receivables.detail.title', { id: data.id })}</span>
      </nav>

      {/* Header Section */}
      <DetailHeader 
        id={data.id} 
        client={data.client} 
        transaction={data.transaction} 
      />

      {/* Content Grid */}
      <div className="receivable-detail__content-grid">
        {/* Left Column: Payment History */}
        <PaymentHistoryTable 
          history={data.paymentHistory} 
          totalPaid={data.transaction.paid} 
          currency={data.transaction.currency} 
        />

        {/* Right Column: Actions & Contact */}
        <DetailSidebar client={data.client} />
      </div>
    </div>
  );
};

export default ReceivableDetail;