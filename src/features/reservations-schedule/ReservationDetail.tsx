import React from 'react';
import { useI18n } from '@/lib/i18n';
import { CalendarDays, Clock, CreditCard, Info, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduleSlot } from '../../domain/reservation';

interface ReservationDetailProps {
  slot: ScheduleSlot;
  onConfirm: (reserveId: number) => Promise<void>;
  onCancel: (reserveId: number) => Promise<void>;
  onInvoice?: (reserveId: number, clientId: string) => void;
  onClose: () => void;
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T');
    if (parts.length >= 2) {
      const datePart = parts[0].split('-').reverse().join('/');
      const timePart = parts[1].substring(0, 5);
      return `${datePart} ${timePart}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const getSlotDurationHours = (slot: ScheduleSlot): number => {
  try {
    const ms = new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime();
    return Math.max(1, Math.round(ms / (60 * 60 * 1000)));
  } catch {
    return 1;
  }
};

const getStatusView = (status: string): { key: string; variant: 'warning' | 'info' | 'secondary' | 'success' } => {
  const upper = (status || '').toUpperCase();
  switch (upper) {
    case 'RESERVED':
    case 'RESERVADO':
      return { key: 'RESERVED', variant: 'warning' };
    case 'CONFIRMED':
    case 'CONFIRMADO':
      return { key: 'CONFIRMED', variant: 'info' };
    case 'CANCELLED':
    case 'CANCELADO':
      return { key: 'CANCELLED', variant: 'secondary' };
    case 'COMPLETED':
    case 'COMPLETADO':
      return { key: 'COMPLETED', variant: 'success' };
    default:
      return { key: upper || 'PENDING', variant: 'secondary' };
  }
};

const DetailField: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }> = ({
  icon,
  label,
  value,
  mono,
}) => (
  <div className="flex items-center gap-sm">
    <span className="text-on-surface-deep [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{icon}</span>
    <div className="min-w-0">
      <p className="text-label-caps uppercase text-on-surface-deep">{label}</p>
      <p className={`text-body-md-bold text-foreground ${mono ? 'text-data-mono font-data-mono' : ''}`}>
        {value}
      </p>
    </div>
  </div>
);

export const ReservationDetail: React.FC<ReservationDetailProps> = ({
  slot,
  onConfirm,
  onCancel,
  onInvoice,
  onClose
}) => {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const statusView = getStatusView(slot.status);
  const isReserved = statusView.key === 'RESERVED';
  const isConfirmed = statusView.key === 'CONFIRMED';
  const isCompleted = statusView.key === 'COMPLETED';
  const isCancelled = statusView.key === 'CANCELLED';

  const statusLabel = t(`reservations.status.${statusView.key}`, statusView.key);
  const durationHours = getSlotDurationHours(slot);

  const handleConfirm = async () => {
    if (!slot.reserve?.id) return;
    setIsProcessing(true);
    try {
      await onConfirm(slot.reserve.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!slot.reserve?.id) return;
    setIsProcessing(true);
    try {
      await onCancel(slot.reserve.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInvoice = async () => {
    if (!slot.reserve?.id || !onInvoice) return;
    setIsProcessing(true);
    try {
      // El pos-checkout exige reserva CONFIRMED (el backend NO auto-confirma):
      // si está RESERVED, se confirma acá primero para que la venta no falle
      // con RESERVE_NOT_AVAILABLE al facturar.
      if (isReserved) {
        await onConfirm(slot.reserve.id);
      }
      onInvoice(slot.reserve.id, slot.reserve.client_id || '');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between gap-sm">
        <div className="flex min-w-0 items-center gap-sm">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary-container text-title-md text-on-secondary-container">
            {(slot.reserve?.client_name || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-title-md text-foreground">
              {slot.reserve?.client_name || t('reservations.form.client')}
            </h3>
            <p className="text-data-mono font-data-mono text-body-sm text-on-surface-deep">
              {t('reservations.group.reserveId', 'Reserva #{id}', { id: slot.reserve?.id || slot.id })}
            </p>
          </div>
        </div>
        <Badge variant={statusView.variant}>{statusLabel}</Badge>
      </div>

      <div className="space-y-md rounded-md bg-surface-muted p-md">
        <DetailField
          icon={<CalendarDays />}
          label={t('reservations.detail.dateTime')}
          value={formatDateTime(slot.start_time)}
          mono
        />
        <DetailField
          icon={<Clock />}
          label={t('reservations.detail.duration')}
          value={t('reservations.group.hours', '{n} h', { n: durationHours })}
          mono
        />
        <DetailField
          icon={<UserRound />}
          label={t('reservations.detail.clientId')}
          value={slot.reserve?.client_id || '—'}
          mono
        />
      </div>

      {!isCancelled && !isCompleted && (
        <div className="flex items-start gap-sm rounded-md border border-border-subtle bg-surface p-md">
          <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-body-sm text-on-surface-deep">
            {isReserved ? t('reservations.detail.infoPending') : t('reservations.detail.infoConfirmed')}
          </p>
        </div>
      )}

      <div className="space-y-sm pt-sm">
        {/* Cobrable desde CONFIRMED y también desde RESERVED: en este último
            caso handleInvoice confirma la reserva primero (el backend exige
            CONFIRMED en el pos-checkout y no auto-confirma). */}
        {(isReserved || isConfirmed || isCompleted) && onInvoice && (
          <Button
            variant="primary"
            className="w-full"
            onClick={handleInvoice}
            loading={isProcessing}
          >
            <CreditCard className="h-4 w-4" />
            {isReserved ? t('reservations.detail.invoiceNow') : t('reservations.detail.invoiceService')}
          </Button>
        )}

        {!isCancelled && !isCompleted && isReserved && (
          <Button
            variant="success"
            className="w-full"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {t('reservations.detail.confirm')}
          </Button>
        )}

        {!isCancelled && !isCompleted && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            {t('reservations.detail.cancel')}
          </Button>
        )}

        <Button variant="secondary" className="w-full" onClick={onClose} disabled={isProcessing}>
          {t('reservations.detail.close')}
        </Button>
      </div>
    </div>
  );
};
