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
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

/**
 * Receivable Detail & Payment History
 */
const ReceivableDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap gap-2 mb-6 text-sm">
          <a className="text-[#617589] dark:text-gray-400 font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/receivables/list')}>
            {t('receivables.master.title', 'Cuentas por Cobrar')}
          </a>
          <span className="text-[#617589] dark:text-gray-500 font-medium">/</span>
          <span className="text-[#617589] dark:text-gray-400 font-medium">Activas</span>
          <span className="text-[#617589] dark:text-gray-500 font-medium">/</span>
          <span className="text-[#111418] dark:text-white font-medium">{t('receivables.detail.title', { id: data.id }, `Factura #${data.id}`)}</span>
        </div>

        {/* Header Section */}
        <div className="mb-6">
          <DetailHeader
            id={data.id}
            client={data.client || {}}
            transaction={data.transaction || {}}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Payment History (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <PaymentHistoryTable
              history={data.paymentHistory || []}
              totalPaid={data.transaction?.rawPaid || 0}
              currency={data.transaction?.currency || ''}
            />
          </div>

          {/* Right Column: Actions & Contact (1/3 width) */}
          <div className="flex flex-col gap-6">
            <DetailSidebar 
              client={data.client || {}} 
              activities={data.activities || []}
              toast={toast} 
            />
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default ReceivableDetail;
