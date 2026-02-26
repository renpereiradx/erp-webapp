import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import DashboardNav from '@/components/business-intelligence/DashboardNav';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-primary" size={48} />
        <p className="text-lg font-medium text-text-secondary">{t('receivables.loading.detail')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="p-4 bg-red-100 rounded-full text-error mb-4">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-text-main">{t('receivables.error.detail')}</h2>
        <p className="text-text-secondary mb-6 max-w-md">No se pudo recuperar la información de la cuenta #{id}.</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/dashboard')} className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 hover:text-primary transition-colors">
                {t('receivables.breadcrumb.home')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="opacity-20" />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/receivables/list')} className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 hover:text-primary transition-colors">
                {t('receivables.master.title')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="opacity-20" />
            <BreadcrumbItem>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-main">{t('receivables.detail.title', { id: data.id })}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Section */}
        <DetailHeader
          id={data.id}
          client={data.client || {}}
          transaction={data.transaction || {}}
        />

        <DashboardNav />

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
          {/* Left Column: Payment History */}
          <div className="xl:col-span-2">
            <PaymentHistoryTable
              history={data.paymentHistory || []}
              totalPaid={data.transaction?.rawPaid || 0}
              currency={data.transaction?.currency || ''}
            />
          </div>

          {/* Right Column: Actions & Contact */}
          <div className="xl:col-span-1">
            <DetailSidebar client={data.client || {}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivableDetail;
