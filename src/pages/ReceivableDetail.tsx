import { lazy, Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';
import { salePaymentService } from '@/services/salePaymentService';
import { useReceivableDetail } from '@/features/receivables/hooks/useReceivableDetail';
import DetailHeader from '@/features/receivables/components/DetailHeader';
import PaymentHistoryTable from '@/features/receivables/components/PaymentHistoryTable';
import DetailSidebar from '@/features/receivables/components/DetailSidebar';

/**
 * Detalle de cuenta por cobrar + historial de pagos.
 * Migración FASE 3: .tsx + tokens. El modal de registro de cobro (927 LOC)
 * ahora es React.lazy dentro de la página lazy; el retry usa el refresh del
 * hook (window.location.reload eliminado).
 */

const RegisterSalePaymentModal = lazy(() => import('@/components/sales/RegisterSalePaymentModal'));

const ReceivableDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data, loading, error, refresh } = useReceivableDetail(id);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePaymentSubmit = async (paymentData: Record<string, unknown>) => {
    await salePaymentService.processSalePaymentWithCashRegister(paymentData as never);
    if (refresh) await refresh();
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.receivables.breadcrumb', 'Cuentas por Cobrar', {})}
          title={t('bi.receivables.detail.pageTitle', 'Expediente de Cuenta', {})}
          subtitle={id ? `#${id}` : undefined}
          actions={
            <button
              type="button"
              onClick={() => navigate('/receivables/list')}
              className="inline-flex items-center px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
            >
              {t('bi.receivables.detail.backToList', 'Volver al listado', {})}
            </button>
          }
        />

        {loading && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="detail-skeleton">
            <div className="h-40 bg-surface-muted rounded-md animate-pulse" />
            <GenericSkeletonList count={5} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && (error || !data) && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.receivables.detail.errorTitle', 'Error en la carga', {})}
              message={
                error ||
                t('bi.receivables.detail.errorBody', 'No se pudo recuperar la información de la cuenta.', {})
              }
              onRetry={refresh}
            />
          </div>
        )}

        {!loading && data && (
          <>
            <section className="mt-lg">
              <DetailHeader
                id={String(data.id ?? '')}
                client={data.client}
                transaction={data.transaction}
                onRegisterPayment={() => setIsPaymentModalOpen(true)}
              />
            </section>

            {/* Content Grid */}
            <div className="grid grid-cols-12 gap-md mt-lg">
              <div className="col-span-12 xl:col-span-8 flex flex-col gap-md">
                <PaymentHistoryTable history={data.paymentHistory || []} totalPaid={data.transaction?.rawPaid || 0} />
              </div>

              <aside className="col-span-12 xl:col-span-4 flex flex-col gap-md">
                <DetailSidebar
                  client={data.client}
                  activities={data.activities || []}
                  onRegisterPayment={() => setIsPaymentModalOpen(true)}
                />
              </aside>
            </div>

            <Suspense fallback={null}>
              <RegisterSalePaymentModal
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                sale={{
                  id: data.id,
                  sale_id: data.id,
                  balance_due: data.transaction?.rawBalance || 0,
                  total_amount: data.transaction?.rawAmount || 0,
                  client_name: data.client?.name || '',
                  currency: 'PYG',
                }}
                onSubmit={handlePaymentSubmit}
              />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
};

export default ReceivableDetail;
