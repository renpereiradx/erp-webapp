import React, { useMemo } from 'react';
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
    if (slot.reserve?.id) {
      const existing = reservationGroups.get(slot.reserve.id);
      if (!existing) {
        reservationGroups.set(slot.reserve.id, {
          reserve_id: slot.reserve.id,
          client_name: slot.reserve.client_name,
          reserve_status: slot.status,
          start_time: slot.start_time,
          end_time: slot.end_time,
          slot_count: 1,
          slots: [slot],
        });
      } else {
        existing.slots.push(slot);
        existing.end_time = slot.end_time;
        existing.slot_count = existing.slots.length;
        existing.reserve_status = slot.status;
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
  const groupedItems = useMemo(() => groupSlotsByReservation(slots), [slots]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200/60"></div>
      ))}
    </div>
  );

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const parts = timeStr.split('T');
      if (parts.length >= 2) {
        const timePart = parts[1].split(':');
        return `${timePart[0]}:${timePart[1]}`;
      }
      return timeStr.substring(11, 16);
    } catch (e) {
      return timeStr;
    }
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const getDurationText = (slotCount: number) => {
    return slotCount === 1 ? '1h' : `${slotCount}h`;
  };

  const getStatusConfig = (status: string) => {
    const upper = (status || '').toUpperCase();
    switch (upper) {
      case 'RESERVED':
      case 'RESERVADO':
        return { label: 'RESERVADO', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      case 'CONFIRMED':
      case 'CONFIRMADO':
        return { label: 'CONFIRMADO', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      case 'CANCELLED':
      case 'CANCELADO':
        return { label: 'CANCELADO', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
      case 'COMPLETED':
      case 'COMPLETADO':
        return { label: 'COMPLETADO', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      default:
        return { label: upper, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
    }
  };

  const isSlotInSelectionRange = (slotStartTime: string) => {
    if (!selectedSlot) return false;
    try {
      const start = new Date(selectedSlot).getTime();
      const current = new Date(slotStartTime).getTime();
      const durationMs = selectedDuration * 60 * 60 * 1000;
      const end = start + durationMs;
      return current >= start && current < end;
    } catch (e) {
      return false;
    }
  };

  const isSameDateTime = (t1: string | null, t2: string) => {
    if (!t1 || !t2) return false;
    try {
      return new Date(t1).getTime() === new Date(t2).getTime();
    } catch (e) {
      return t1 === t2;
    }
  };

  const renderAvailableSlot = (slot: ScheduleSlot) => {
    const status = (slot.status || '').toUpperCase();
    const isAvailable = !slot.reserve && (status === 'AVAILABLE' || status === 'FREE' || status === 'LIBRE' || status === '');

    const isSelectedStart = isSameDateTime(selectedSlot, slot.start_time);
    const isInRange = isSlotInSelectionRange(slot.start_time);
    const isHighlighted = isAvailable && isInRange;
    const hasConflict = isInRange && !isAvailable && !isSelectedStart;

    return (
      <div
        key={slot.id || slot.start_time}
        className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
          isHighlighted
            ? 'bg-blue-50 border-blue-500 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/20 scale-[1.02] z-10'
            : hasConflict
              ? 'bg-red-50 border-red-500 animate-pulse'
              : isAvailable
                ? 'bg-white border-emerald-100 hover:border-emerald-400 hover:shadow-[0_10px_20px_-5px_rgba(16,185,129,0.1)] cursor-pointer'
                : 'bg-slate-50 border-slate-200/60 opacity-80'
        }`}
        onClick={() => isAvailable && onSelectSlot(slot.start_time)}
      >
        <div className={`px-4 py-2 border-b flex justify-between items-center transition-colors ${
          isHighlighted
            ? 'bg-blue-600 text-white'
            : hasConflict
              ? 'bg-red-600 text-white'
              : isAvailable ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-100 border-slate-200'
        }`}>
          <span className={`font-mono text-xs font-black ${
            isHighlighted || hasConflict ? 'text-white' : isAvailable ? 'text-emerald-700' : 'text-slate-500'
          }`}>
            {formatTime(slot.start_time)}
          </span>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            isHighlighted || hasConflict ? 'bg-white/20 text-white' : isAvailable ? 'text-emerald-600 bg-emerald-100/50' : 'text-slate-600 bg-white'
          }`}>
            {isSelectedStart ? 'INICIO' : isHighlighted ? 'INCLUIDO' : hasConflict ? 'CONFLICTO' : 'DISPONIBLE'}
          </span>
        </div>

        <div className="p-4 min-h-[80px] flex flex-col justify-center">
          {hasConflict ? (
            <div className="text-center space-y-1">
              <span className="material-icons-round text-red-500 text-3xl">error</span>
              <p className="text-[9px] font-black text-red-600 uppercase">Conflicto</p>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <span className={`material-icons-round text-3xl transition-colors ${
                isHighlighted ? 'text-blue-500' : 'text-emerald-300 group-hover:text-emerald-500'
              }`}>
                {isSelectedStart ? 'stars' : isHighlighted ? 'check_circle' : 'add_circle'}
              </span>
              <p className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${
                isHighlighted ? 'text-blue-600' : 'text-emerald-600/60 group-hover:text-emerald-700'
              }`}>
                {isSelectedStart ? 'Hora de Inicio' : isHighlighted ? 'Bloque Seleccionado' : 'Disponible'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReservationGroup = (group: ReservationGroup) => {
    const statusConfig = getStatusConfig(group.reserve_status);
    const isCancelled = statusConfig.label === 'CANCELADO';
    const isCompleted = statusConfig.label === 'COMPLETADO';
    const canConfirm = statusConfig.label === 'RESERVADO';
    const isConfirmed = statusConfig.label === 'CONFIRMADO';
    const canCancel = !isCancelled && !isCompleted;

    const firstSlot = group.slots[0];

    return (
      <div
        key={`reservation-${group.reserve_id}`}
        className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 bg-amber-50/30 border-amber-100/60 shadow-sm hover:bg-amber-100/50`}
      >
        <div className={`px-4 py-2 border-b flex justify-between items-center ${statusConfig.bg} border-b-amber-200/60`}>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xs font-black ${statusConfig.text}`}>
              {formatTimeRange(group.start_time, group.end_time)}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-white/60 px-2 py-0.5 rounded-full">
              <span className="material-icons-round text-[10px]">schedule</span>
              {getDurationText(group.slot_count)}
            </span>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0 bg-amber-200 text-amber-700">
              {(group.client_name || 'U')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-slate-900 leading-tight">{group.client_name || 'Cliente'}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Reserva #{group.reserve_id} · {group.slot_count} {group.slot_count === 1 ? 'hora' : 'horas'}
              </p>
              {isCancelled && (
                <p className="text-[9px] text-red-500 font-medium mt-0.5">Esta reserva fue cancelada</p>
              )}
            </div>
          </div>

          {!isCancelled && !isCompleted && (
            <div className="flex flex-col gap-2 mt-1">
              {isConfirmed && onInvoice && (
                <button
                  onClick={() => onInvoice(group.reserve_id as number, firstSlot.reserve?.client_id || '')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-200"
                >
                  <span className="material-icons-round text-[16px]">receipt_long</span>
                  <span className="text-[10px] font-black uppercase">Facturar</span>
                </button>
              )}
              <div className="flex gap-2 w-full">
                {canConfirm && (
                  <button
                    onClick={() => onConfirm(group.reserve_id as number)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200/50"
                  >
                    <span className="material-icons-round text-[16px]">check_circle</span>
                    <span className="text-[10px] font-black uppercase">Confirmar</span>
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => onCancel(group.reserve_id as number)}
                    className="py-2.5 px-4 rounded-xl transition-all flex items-center justify-center border-2 border-amber-200 text-amber-600 hover:bg-amber-100"
                  >
                    <span className="material-icons-round text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {(isCancelled || isCompleted) && (
            <button
              onClick={() => firstSlot && onShowDetail(firstSlot)}
              className="w-full text-center text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              Ver información de la reserva
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
        <div>
          <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tighter">Cronograma de Disponibilidad</h3>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Haz clic en un horario libre para reservar</p>
        </div>
        <div className="flex gap-3 md:gap-4 self-end sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
            <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase">Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span>
            <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase">Ocupado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 px-1 md:px-0">
        {groupedItems.map((item) => {
          if (item.type === 'available' && item.slot) {
            return renderAvailableSlot(item.slot);
          } else if (item.type === 'reservation' && item.group) {
            return renderReservationGroup(item.group);
          }
          return null;
        })}
      </div>

      {(!Array.isArray(slots) || slots.length === 0) && (
        <div className="bg-white rounded-3xl p-10 md:p-20 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
            <span className="material-icons-round text-3xl md:text-4xl">event_busy</span>
          </div>
          <h4 className="text-slate-900 font-black text-lg">No hay horarios disponibles</h4>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Intenta cambiar la fecha o utiliza el botón de generación rápida para crear slots.</p>
        </div>
      )}
    </div>
  );
};
