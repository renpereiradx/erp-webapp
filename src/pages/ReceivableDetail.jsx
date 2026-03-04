import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

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
 * Refactorizado para 100% fidelidad visual y consistencia con Payables.
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
        <p className="text-lg font-medium text-slate-500">Cargando expediente de cuenta...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="p-4 bg-red-50 rounded-full text-fluent-danger mb-4 shadow-sm">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white uppercase tracking-tight">Error en la carga</h2>
        <p className="text-slate-500 mb-6 max-w-md font-medium">No se pudo recuperar la información de la cuenta #{id}. Por favor, intente de nuevo.</p>
        <Button variant="primary" className="rounded-xl px-8" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          <button onClick={() => navigate('/receivables/list')} className="hover:text-primary transition-colors flex items-center gap-1">
            Cuentas por Cobrar
          </button>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <span className="opacity-50">Activas</span>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <span className="text-slate-600 dark:text-slate-300">Expediente #{data.id}</span>
        </nav>

        {/* Header Section */}
        <DetailHeader
          id={data.id}
          client={data.client || {}}
          transaction={data.transaction || {}}
        />

        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Payment History (2/3 width) */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
            <PaymentHistoryTable
              history={data.paymentHistory || []}
              totalPaid={data.transaction?.rawPaid || 0}
              currency={data.transaction?.currency || ''}
            />
          </div>

          {/* Right Column: Actions & Contact (1/3 width) */}
          <aside className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            <DetailSidebar 
              client={data.client || {}} 
              activities={data.activities || []}
              toast={toast} 
            />
          </aside>
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default ReceivableDetail;
