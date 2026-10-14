import React, { useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { Ban, Check, CheckCircle2, PlusCircle, ReceiptText, Star, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduleSlot } from '../../domain/reservation';

interface ScheduleTimelineProps {
  slots: ScheduleSlot[];
  loading: boolean;
  selectedSlot: string | null;
  selectedDuration: number;
  onSelectSlot: (time: string) => void;
  onShowDetail: (slot: ScheduleSlot) => void;
  onConfirm: (reserveId: number) => Promise<void>;
  onCancel: (reserveId: number) => Promise<void>;
  onInvoice?: (reserveId: number, clientId: string) => void;
}

interface ReservationGroup {
  reserve_id: string | number;
  client_name: string;
  reserve_status: string;
  start_time: string;
  end_time: string;
  slot_count: number;
  slots: ScheduleSlot[];
}

interface GroupedItem {
  type: 'available' | 'reservation';
  slot?: ScheduleSlot;
  group?: ReservationGroup;
}

const groupSlotsByReservation = (slots: ScheduleSlot[]): GroupedItem[] => {
  const availableSlots: ScheduleSlot[] = [];
  const reservationGroups = new Map<string | number, ReservationGroup>();

  const sortedSlots = [...slots].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (const slot of sortedSlots) {
    const resId = slot.reserve?.id || (slot as any).reserve_id || (slot as any).reservation_id;

    if (resId) {
      const existing = reservationGroups.get(resId);
      const clientName = slot.reserve?.client_name || (slot as any).reserved_by || (slot as any).client_name;
      const resStatus = slot.reserve?.status || (slot as any).reserve_status || slot.status;
      const clientId = slot.reserve?.client_id || (slot as any).client_id;

      // Asegurarnos de que el slot tenga la info para onInvoice() si viene plana
      if (!slot.reserve) {
         slot.reserve = {
            id: resId,
            client_name: clientName,
            client_id: clientId,
            status: resStatus
         } as any;
      }

      if (!existing) {
        reservationGroups.set(resId, {
          reserve_id: resId,
          client_name: clientName,
          reserve_status: resStatus,
          start_time: slot.start_time,
          end_time: slot.end_time,
          slot_count: 1,
          slots: [slot],
        });
      } else {
        existing.slots.push(slot);
        existing.end_time = slot.end_time;
        existing.slot_count = existing.slots.length;
        existing.reserve_status = resStatus;
      }
    } else {
      availableSlots.push(slot);
    }
  }

  const groupedItems: GroupedItem[] = [];

  for (const slot of availableSlots) {
    groupedItems.push({ type: 'available', slot });
  }

  const sortedReservations = Array.from(reservationGroups.values()).sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (const group of sortedReservations) {
    groupedItems.push({ type: 'reservation', group });
  }

  return groupedItems.sort((a, b) => {
    const timeA = a.slot?.start_time || a.group?.start_time || '';
    const timeB = b.slot?.start_time || b.group?.start_time || '';
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });
};

// ─── Formato de horas (UI pura, sin estado) ───

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  try {
    const parts = timeStr.split('T');
    if (parts.length >= 2) {
      const timePart = parts[1].split(':');
      return `${timePart[0]}:${timePart[1]}`;
    }
    return timeStr.substring(11, 16);
  } catch {
    return timeStr;
  }
};

const formatTimeRange = (start: string, end: string): string =>
  `${formatTime(start)} - ${formatTime(end)}`;

const isSlotAvailable = (slot: ScheduleSlot): boolean => {
  const status = (slot.status || '').toUpperCase();
  return !slot.reserve && (status === 'AVAILABLE' || status === 'FREE' || status === 'LIBRE' || status === '');
};

type StatusVariant = 'warning' | 'info' | 'secondary' | 'success';

const getStatusView = (status: string): { key: string; variant: StatusVariant } => {
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

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  slots,
  loading,
  selectedSlot,
  selectedDuration,
  onSelectSlot,
  onShowDetail,
  onConfirm,
  onCancel,
  onInvoice
}) => {
  const { t } = useI18n();
  const groupedItems = useMemo(() => groupSlotsByReservation(slots), [slots]);

  const isSlotInSelectionRange = (slotStartTime: string): boolean => {
    if (!selectedSlot) return false;
    try {
      const start = new Date(selectedSlot).getTime();
      const current = new Date(slotStartTime).getTime();
      const durationMs = selectedDuration * 60 * 60 * 1000;
      const end = start + durationMs;
      return current >= start && current < end;
    } catch {
      return false;
    }
  };

  const isSameDateTime = (t1: string | null, t2: string): boolean => {
    if (!t1 || !t2) return false;
    try {
      return new Date(t1).getTime() === new Date(t2).getTime();
    } catch {
      return t1 === t2;
    }
  };

  const renderAvailableSlot = (slot: ScheduleSlot) => {
    const available = isSlotAvailable(slot);
    const isSelectedStart = isSameDateTime(selectedSlot, slot.start_time);
    const isInRange = isSlotInSelectionRange(slot.start_time);
    const isHighlighted = available && isInRange;
    const hasConflict = isInRange && !available && !isSelectedStart;

    if (!available && !hasConflict) {
      return (
        <div
          key={slot.id || slot.start_time}
          aria-disabled="true"
          className="relative overflow-hidden rounded-md border border-border-subtle bg-surface-subtle opacity-60"
        >
          <SlotBand
            time={formatTime(slot.start_time)}
            badge={t('reservations.slot.unavailable')}
            bandClassName="bg-surface-subtle text-on-surface-deep"
          />
          <div className="flex min-h-[72px] flex-col items-center justify-center gap-xs p-md">
            <Ban className="h-5 w-5 text-outline" aria-hidden="true" />
            <span className="text-body-sm-bold text-on-surface-deep">
              {t('reservations.slot.unavailable')}
            </span>
          </div>
        </div>
      );
    }

    if (hasConflict) {
      return (
        <div
          key={slot.id || slot.start_time}
          className="relative overflow-hidden rounded-md border border-error bg-error-container"
        >
          <SlotBand
            time={formatTime(slot.start_time)}
            badge={t('reservations.slot.conflict')}
            bandClassName="bg-error-container text-on-error-container"
          />
          <div className="flex min-h-[72px] flex-col items-center justify-center gap-xs p-md">
            <TriangleAlert className="h-5 w-5 text-error" aria-hidden="true" />
            <span className="text-body-sm-bold text-on-error-container">
              {t('reservations.slot.conflict')}
            </span>
          </div>
        </div>
      );
    }

    if (isSelectedStart) {
      return (
        <button
          type="button"
          key={slot.id || slot.start_time}
          onClick={() => onSelectSlot(slot.start_time)}
          aria-pressed="true"
          className="relative overflow-hidden rounded-md border border-primary bg-primary text-on-primary shadow-fluent-8 transition-all duration-150"
        >
          <SlotBand
            time={formatTime(slot.start_time)}
            badge={t('reservations.slot.start')}
            bandClassName="bg-primary-container text-on-primary"
          />
          <div className="flex min-h-[72px] flex-col items-center justify-center gap-xs p-md">
            <Star className="h-5 w-5" aria-hidden="true" />
            <span className="text-body-sm-bold">{t('reservations.slot.start')}</span>
          </div>
        </button>
      );
    }

    if (isHighlighted) {
      return (
        <div
          key={slot.id || slot.start_time}
          className="relative overflow-hidden rounded-md border border-primary bg-primary-fixed"
        >
          <SlotBand
            time={formatTime(slot.start_time)}
            badge={t('reservations.slot.included')}
            bandClassName="bg-surface-muted text-foreground"
          />
          <div className="flex min-h-[72px] flex-col items-center justify-center gap-xs p-md">
            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="text-body-sm-bold text-foreground">{t('reservations.slot.included')}</span>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        key={slot.id || slot.start_time}
        onClick={() => onSelectSlot(slot.start_time)}
        className="relative overflow-hidden rounded-md border border-border-subtle bg-surface shadow-whisper transition-all duration-150 hover:border-primary hover:shadow-fluent-8"
      >
        <SlotBand
          time={formatTime(slot.start_time)}
          badge={t('reservations.slot.available')}
          bandClassName="bg-surface-muted text-foreground"
        />
        <div className="flex min-h-[72px] flex-col items-center justify-center gap-xs p-md">
          <PlusCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-body-sm-bold text-on-surface-deep">{t('reservations.slot.available')}</span>
        </div>
      </button>
    );
  };

  const renderReservationGroup = (group: ReservationGroup) => {
    const statusView = getStatusView(group.reserve_status);
    const statusLabel = t(
      `reservations.status.${statusView.key}`,
      statusView.key,
    );
    const isCancelled = statusView.key === 'CANCELLED';
    const isCompleted = statusView.key === 'COMPLETED';
    const canConfirm = statusView.key === 'RESERVED';
    const isConfirmed = statusView.key === 'CONFIRMED';
    const canCancel = !isCancelled && !isCompleted;

    const firstSlot = group.slots[0];

    return (
      <article
        key={`reservation-${group.reserve_id}`}
        className="overflow-hidden rounded-md border border-border-subtle bg-surface shadow-whisper transition-shadow duration-150 hover:shadow-fluent-8"
      >
        <div className="flex items-center justify-between gap-sm border-b border-divider bg-surface-muted px-md py-sm">
          <span className="text-data-mono font-data-mono text-body-md-bold text-foreground">
            {formatTimeRange(group.start_time, group.end_time)}
          </span>
          <Badge variant={statusView.variant} size="sm">{statusLabel}</Badge>
        </div>

        <div className="space-y-md p-md">
          <div className="flex items-start gap-sm">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-body-md-bold text-on-secondary-container">
              {(group.client_name || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-md-bold text-foreground">
                {group.client_name || t('reservations.form.client')}
              </p>
              <p className="text-data-mono font-data-mono text-body-sm text-on-surface-deep">
                {t('reservations.group.reserveId', 'Reserva #{id}', { id: group.reserve_id })}
                {' · '}
                {t('reservations.group.hours', '{n} h', { n: group.slot_count })}
              </p>
              {isCancelled && (
                <p className="text-body-sm text-error">{t('reservations.group.cancelledNote')}</p>
              )}
            </div>
          </div>

          {!isCancelled && !isCompleted && (
            <div className="space-y-sm">
              {isConfirmed && onInvoice && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => onInvoice(group.reserve_id as number, firstSlot.reserve?.client_id || '')}
                >
                  <ReceiptText className="h-4 w-4" />
                  {t('reservations.actions.invoice')}
                </Button>
              )}
              <div className="flex gap-sm">
                {canConfirm && (
                  <Button
                    variant="success"
                    size="sm"
                    className="flex-1"
                    onClick={() => onConfirm(group.reserve_id as number)}
                  >
                    <Check className="h-4 w-4" />
                    {t('reservations.actions.confirm')}
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('reservations.actions.cancel')}
                    onClick={() => onCancel(group.reserve_id as number)}
                    className="text-error hover:bg-error-container hover:text-on-error-container"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {(isCancelled || isCompleted) && (
            <button
              type="button"
              onClick={() => firstSlot && onShowDetail(firstSlot)}
              className="w-full text-center text-body-sm text-on-surface-deep transition-colors duration-150 hover:text-foreground"
            >
              {t('reservations.actions.viewDetail')}
            </button>
          )}
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-md bg-surface-subtle" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
        <div>
          <h3 className="text-title-md text-foreground">{t('reservations.timeline.title')}</h3>
          <p className="text-body-sm-bold text-on-surface-deep">{t('reservations.timeline.hint')}</p>
        </div>
        <div className="flex gap-md self-end sm:self-auto">
          <div className="flex items-center gap-xs">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            <span className="text-body-sm-bold text-on-surface-deep">{t('reservations.legend.free')}</span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
            <span className="text-body-sm-bold text-on-surface-deep">{t('reservations.legend.busy')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
        {groupedItems.map((item) => {
          if (item.type === 'available' && item.slot) {
            return renderAvailableSlot(item.slot);
          } else if (item.type === 'reservation' && item.group) {
            return renderReservationGroup(item.group);
          }
          return null;
        })}
      </div>
    </div>
  );
};

/** Banda superior de un slot: hora + etiqueta de estado. */
const SlotBand: React.FC<{ time: string; badge: string; bandClassName: string }> = ({
  time,
  badge,
  bandClassName,
}) => (
  <div
    className={`flex items-center justify-between gap-sm border-b border-divider px-md py-sm ${bandClassName}`}
  >
    <span className="text-data-mono font-data-mono text-body-md-bold">{time}</span>
    <span className="text-label-caps uppercase">{badge}</span>
  </div>
);
