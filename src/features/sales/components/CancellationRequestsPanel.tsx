/**
 * CancellationRequestsPanel — bandeja de solicitudes de anulación para roles
 * con sales:cancel (FASE C, PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES). Pestaña
 * dentro de Ventas: lista pendientes (y revisadas por filtro), permite aprobar
 * (anula la venta vía backend) o rechazar (con motivo obligatorio).
 * Presentacional: los datos y callbacks vienen de useCancellationRequests.
 */
import React, { useState } from 'react';
import { Check, Clock, ShieldX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DataState from '@/components/ui/DataState';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { useI18n } from '@/lib/i18n';
import type { CancellationRequest, CancellationRequestStatus } from '../types/cancellation';

interface CancellationRequestsPanelProps {
  requests: CancellationRequest[];
  total: number;
  loading: boolean;
  error: string | null;
  statusFilter: CancellationRequestStatus;
  onStatusFilterChange: (s: CancellationRequestStatus) => void;
  onRetry: () => void;
  onApprove: (request: CancellationRequest) => void;
  onReject: (request: CancellationRequest, reason: string) => void;
  /** id de la solicitud en curso (approve/reject en vuelo). */
  actingId: number | null;
  testIdPrefix?: string;
}

const filterTabs: { value: CancellationRequestStatus; labelKey: string; fallback: string }[] = [
  { value: 'pending', labelKey: 'sales.cancellation.filterPending', fallback: 'Pendientes' },
  { value: 'approved', labelKey: 'sales.cancellation.filterApproved', fallback: 'Aprobadas' },
  { value: 'rejected', labelKey: 'sales.cancellation.filterRejected', fallback: 'Rechazadas' },
];

const statusVariant = (status: CancellationRequestStatus) =>
  status === 'approved' ? 'success' : status === 'rejected' ? 'destructive' : 'warning';

export const CancellationRequestsPanel: React.FC<CancellationRequestsPanelProps> = ({
  requests,
  total,
  loading,
  error,
  statusFilter,
  onStatusFilterChange,
  onRetry,
  onApprove,
  onReject,
  actingId,
  testIdPrefix = 'cancellation-requests',
}) => {
  const { t } = useI18n();
  const [rejecting, setRejecting] = useState<CancellationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const openRejectModal = (request: CancellationRequest) => {
    setRejecting(request);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!rejecting || !rejectReason.trim()) return;
    onReject(rejecting, rejectReason.trim());
    setRejecting(null);
    setRejectReason('');
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="space-y-4" data-testid={testIdPrefix}>
      <div className="flex items-center gap-2" role="tablist" aria-label={t('sales.cancellation.filterAria', 'Filtrar por estado')}>
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={statusFilter === tab.value}
            onClick={() => onStatusFilterChange(tab.value)}
            data-testid={`${testIdPrefix}-filter-${tab.value}`}
            className={
              statusFilter === tab.value
                ? 'px-3 h-8 rounded-button text-body-sm-bold uppercase bg-primary text-on-primary'
                : 'px-3 h-8 rounded-button text-body-sm-bold uppercase bg-surface text-on-surface-deep border border-border-subtle hover:text-foreground'
            }
          >
            {t(tab.labelKey, tab.fallback)}
          </button>
        ))}
      </div>

      <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
        {loading ? (
          <div className="p-md">
            <DataState variant="loading" skeletonProps={{ count: 3, variant: 'list' }} testId={`${testIdPrefix}-loading`} />
          </div>
        ) : error ? (
          <div className="p-md">
            <DataState
              variant="error"
              title={t('sales.cancellation.loadErrorTitle', 'Error al cargar solicitudes')}
              message={error}
              onRetry={onRetry}
              testId={`${testIdPrefix}-error`}
            />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-md">
            <DataState
              variant="empty"
              title={t('sales.cancellation.empty', 'No hay solicitudes')}
              description={t('sales.cancellation.emptyHint', 'Cuando un vendedor solicite anular una venta, va a aparecer acá.')}
              testId={`${testIdPrefix}-empty`}
            />
          </div>
        ) : (
          <ul className="divide-y divide-divider">
            {requests.map((request) => (
              <li key={request.id} className="p-4 space-y-2" data-testid={`${testIdPrefix}-row-${request.id}`}>
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-body-md font-data-mono text-primary">#{request.sale_id}</span>
                    <Badge variant={statusVariant(request.status)} size="sm">
                      {t(`sales.cancellation.status.${request.status}`, request.status)}
                    </Badge>
                  </div>
                  <span className="text-label-caps text-outline-fg uppercase flex items-center gap-1">
                    <Clock size={12} aria-hidden="true" /> {formatDate(request.created_at)}
                  </span>
                </div>

                <p className="text-body-md text-foreground">{request.reason}</p>
                <p className="text-body-sm text-muted-foreground">
                  {t('sales.cancellation.requestedBy', 'Solicitada por')}{' '}
                  <span className="text-body-sm-bold text-foreground">{request.requested_by_name || request.requested_by}</span>
                </p>

                {request.status === 'rejected' && request.rejection_reason && (
                  <p className="text-body-sm text-error">
                    {t('sales.cancellation.rejectedReason', 'Motivo del rechazo:')} {request.rejection_reason}
                  </p>
                )}
                {request.status === 'approved' && request.reviewed_by_name && (
                  <p className="text-body-sm text-muted-foreground">
                    {t('sales.cancellation.reviewedBy', 'Revisada por')}{' '}
                    <span className="text-body-sm-bold text-foreground">{request.reviewed_by_name}</span>
                  </p>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onApprove(request)}
                      disabled={actingId === request.id}
                      data-testid={`${testIdPrefix}-approve-${request.id}`}
                      className="gap-1.5"
                    >
                      <Check size={14} aria-hidden="true" />
                      {t('sales.cancellation.approve', 'Aprobar y Anular')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRejectModal(request)}
                      disabled={actingId === request.id}
                      data-testid={`${testIdPrefix}-reject-${request.id}`}
                      className="gap-1.5 text-error"
                    >
                      <ShieldX size={14} aria-hidden="true" />
                      {t('sales.cancellation.reject', 'Rechazar')}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Contador visible fuera del estado vacío (badge de la pestaña lo completa) */}
      {!loading && !error && total > 0 && (
        <p className="text-label-caps text-outline-fg uppercase" data-testid={`${testIdPrefix}-total`}>
          {total} {t('sales.cancellation.records', 'solicitudes')}
        </p>
      )}

      <EnhancedModal
        isOpen={!!rejecting}
        onClose={() => setRejecting(null)}
        title={t('sales.cancellation.rejectTitle', 'Rechazar solicitud #{id}', { id: rejecting?.id ?? '' })}
        variant="error"
        size="sm"
        footer={
          <div className="flex justify-end gap-sm">
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason.trim()}
              data-testid={`${testIdPrefix}-reject-confirm`}
            >
              {t('sales.cancellation.rejectConfirm', 'Rechazar Solicitud')}
            </Button>
          </div>
        }
      >
        <div className="space-y-md py-2">
          <p className="text-body-md text-on-surface-deep">
            {t('sales.cancellation.rejectWarning', 'La venta NO se anula: el vendedor verá el rechazo con tu motivo.')}
          </p>
          <div className="space-y-xs">
            <Label htmlFor="reject-reason" className="text-body-md-bold text-foreground">
              {t('sales.cancellation.rejectReason', 'Motivo del rechazo')}
            </Label>
            <Textarea
              id="reject-reason"
              data-testid={`${testIdPrefix}-reject-reason`}
              className="text-sm"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder={t('sales.cancellation.rejectReasonPlaceholder', 'Ej: el cobro ya fue conciliado, verificar con caja...')}
            />
          </div>
        </div>
      </EnhancedModal>
    </div>
  );
};
