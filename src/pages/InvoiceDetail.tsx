import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileBadge, RefreshCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import { usePayables } from '@/features/accounts-payable/hooks/usePayables';
import PageHeader from '@/components/ui/PageHeader';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import ErrorState from '@/components/ui/ErrorState';

/**
 * Detalle de Factura de Pagos e Historial (CxP).
 * Migración FASE 4: .tsx + PageHeader + 3 estados; los botones muertos
 * PDF / Registrar Pago se eliminaron (§2.6 — decisión de fase); retry vía
 * refetch (no reload).
 */
const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { loading, error, fetchPayableById, selectedPayable: invoice } = usePayables();

  useEffect(() => {
    if (id) {
      fetchPayableById(id);
    }
  }, [id, fetchPayableById]);

  const statusTone =
    invoice?.status === 'VENCIDO'
      ? 'bg-error/10 text-error border-error/20'
      : invoice?.status === 'PAGADO'
        ? 'bg-success/10 text-success border-success/20'
        : 'bg-warning/10 text-warning border-warning/20';
  const statusDot =
    invoice?.status === 'VENCIDO'
      ? 'bg-error'
      : invoice?.status === 'PAGADO'
        ? 'bg-success'
        : 'bg-warning animate-pulse';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('bi.payables.breadcrumb', 'Finanzas', {})}
          title={invoice ? `${t('bi.payables.detail.title', 'Factura', {})} #${invoice.id}` : t('bi.payables.detail.title', 'Factura', {})}
          subtitle={invoice?.purchaseOrderId ? `${t('bi.payables.detail.orderId', 'ID Orden', {})}: ${invoice.purchaseOrderId}` : undefined}
          actions={
            <div className="flex items-center gap-sm">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
              >
                <ArrowLeft size={16} />
                {t('common.back', 'Volver', {})}
              </button>
              <button
                type="button"
                onClick={() => id && fetchPayableById(id)}
                className="inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors duration-150"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                {t('bi.profitability.action.refresh', 'Actualizar', {})}
              </button>
            </div>
          }
        />

        {loading && (
          <div className="mt-lg space-y-lg" aria-busy="true" data-testid="invoice-detail-skeleton">
            <div className="h-32 bg-surface-muted rounded-md animate-pulse" />
            <GenericSkeletonList count={5} data-testid="page-skeleton-list" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-lg">
            <ErrorState
              title={t('bi.payables.detail.errorTitle', 'Error de Carga', {})}
              message={t(
                'bi.payables.detail.errorBody',
                'No se pudo cargar el detalle de la factura. Verifique su conexión e intente nuevamente.',
                {},
              )}
              onRetry={() => id && fetchPayableById(id)}
            />
          </div>
        )}

        {!loading && !error && !invoice && (
          <ErrorState
            title={t('bi.payables.detail.errorTitle', 'Error de Carga', {})}
            message={t('bi.payables.detail.notFound', 'No se encontró la factura solicitada.', {})}
            onRetry={() => id && fetchPayableById(id)}
          />
        )}

        {!loading && !error && invoice && (
          <div className="flex flex-col gap-lg mt-lg">
            {/* Header Card */}
            <div className="bg-surface rounded-md border border-border-subtle shadow-whisper p-md">
              <div className="flex items-start gap-md">
                <div className="flex flex-col gap-xs">
                  <div className="flex items-center gap-sm flex-wrap">
                    <span
                      className={`flex items-center px-sm py-xs text-body-sm-bold rounded-sm border uppercase shadow-sm ${statusTone}`}
                    >
                      <span className={`size-1.5 rounded-full mr-xs ${statusDot}`} aria-hidden="true" />
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-xs text-label-caps uppercase text-on-surface-deep mt-xs">
                    <FileBadge size={14} className="opacity-50" />
                    <span>
                      {t('bi.payables.detail.orderId', 'ID Orden', {})}:{' '}
                      <span className="font-data-mono text-data-mono">{invoice.purchaseOrderId}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md mt-lg pt-lg border-t border-border-subtle">
                <div className="flex flex-col gap-xs">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.payables.detail.stats.total', 'Monto Original', {})}
                  </p>
                  <p className="text-title-md font-data-mono text-data-mono text-foreground">
                    {formatPYG(invoice.totalAmount || 0)}
                  </p>
                </div>
                <div className="flex flex-col gap-xs md:border-l border-border-subtle md:pl-md">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.payables.detail.stats.paid', 'Pagado', {})}
                  </p>
                  <p className="text-title-md font-data-mono text-data-mono text-success">
                    {formatPYG(invoice.paidAmount || 0)}
                  </p>
                </div>
                <div className="flex flex-col gap-xs md:border-l border-border-subtle md:pl-md">
                  <p className="text-label-caps uppercase text-on-surface-deep">
                    {t('bi.payables.detail.stats.balance', 'Pendiente', {})}
                  </p>
                  <p className="text-title-md font-data-mono text-data-mono text-error">
                    {formatPYG(invoice.pendingAmount || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Detalle + pagos */}
            <div className="grid grid-cols-12 gap-md">
              <div className="col-span-12 xl:col-span-7 bg-surface rounded-md border border-border-subtle shadow-whisper p-md">
                <h2 className="text-title-md text-foreground mb-md">
                  {t('bi.payables.detail.info.title', 'Datos de la Factura', {})}
                </h2>
                <dl className="space-y-sm">
                  {[
                    { label: t('bi.payables.detail.info.vendor', 'Proveedor', {}), value: invoice.detalle?.proveedor },
                    { label: t('bi.payables.detail.info.ruc', 'RUC', {}), value: invoice.detalle?.ruc },
                    { label: t('bi.payables.detail.info.emision', 'Emisión', {}), value: invoice.detalle?.emision },
                    { label: t('bi.payables.detail.info.vencimiento', 'Vencimiento', {}), value: invoice.detalle?.vencimiento },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between gap-md border-b border-border-subtle pb-xs">
                      <dt className="text-body-md text-on-surface-deep">{row.label}</dt>
                      <dd className="text-body-md-bold text-foreground">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="col-span-12 xl:col-span-5 bg-surface rounded-md border border-border-subtle shadow-whisper p-md">
                <h2 className="text-title-md text-foreground mb-md">
                  {t('bi.payables.detail.payments.title', 'Pagos Registrados', {})}
                </h2>
                {(invoice.pagos || []).length === 0 ? (
                  <p className="text-body-md text-on-surface-deep italic">
                    {t('bi.payables.detail.payments.empty', 'Sin pagos registrados', {})}
                  </p>
                ) : (
                  <ul className="space-y-sm">
                    {invoice.pagos.map((p: { fecha: string; monto: number; metodo: string }, idx: number) => (
                      <li key={idx} className="flex justify-between items-center border-b border-border-subtle pb-xs">
                        <span className="text-body-md text-foreground font-data-mono text-data-mono">{p.fecha}</span>
                        <span className="text-body-md text-on-surface-deep">{p.metodo}</span>
                        <span className="text-body-md-bold font-data-mono text-data-mono text-success">
                          {formatPYG(p.monto)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <p className="text-body-sm text-on-surface-deep">
              {t('common.backTo', 'Vuelve al', {})}{' '}
              <Link to="/payables/invoices" className="text-primary hover:underline">
                {t('bi.payables.invoices.title', 'Lista Maestra de Facturas', {})}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail
