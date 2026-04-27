import React from 'react';
import { ScheduleSlot } from '../../domain/reservation';

interface ReservationDetailProps {
  slot: ScheduleSlot;
  onConfirm: (reserveId: number) => Promise<void>;
  onCancel: (reserveId: number) => Promise<void>;
  onInvoice?: (reserveId: number, clientId: string) => void;
  onClose: () => void;
}

export const ReservationDetail: React.FC<ReservationDetailProps> = ({
  slot,
  onConfirm,
  onCancel,
  onInvoice,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const status = (slot.status || '').toUpperCase();
  const isReserved = status === 'RESERVED' || status === 'RESERVADO';
  const isConfirmed = status === 'CONFIRMED' || status === 'CONFIRMADO';
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';

  const formatDateTime = (dateStr: string) => {
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

  const getStatusBadge = () => {
    if (isCancelled) return { text: 'CANCELADO', class: 'bg-red-100 text-red-700' };
    if (isCompleted) return { text: 'COMPLETADO', class: 'bg-slate-100 text-slate-700' };
    if (isConfirmed) return { text: 'CONFIRMADO', class: 'bg-blue-100 text-blue-700' };
    if (isReserved) return { text: 'RESERVADO', class: 'bg-amber-100 text-amber-700' };
    return { text: status, class: 'bg-slate-100 text-slate-700' };
  };

  const statusBadge = getStatusBadge();

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

  const handleInvoice = () => {
    if (slot.reserve?.id && onInvoice) {
      onInvoice(slot.reserve.id, slot.reserve.client_id || '');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
            isCancelled ? 'bg-red-100 text-red-600' :
            isConfirmed ? 'bg-blue-100 text-blue-600' :
            isReserved ? 'bg-amber-100 text-amber-600' :
            'bg-slate-100 text-slate-600'
          }`}>
            {(slot.reserve?.client_name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">{slot.reserve?.client_name || 'Cliente'}</h3>
            <p className="text-xs text-slate-500 font-mono">RES-{slot.reserve?.id || slot.id}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge.class}`}>
          {statusBadge.text}
        </span>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-icons-round text-slate-400">calendar_today</span>
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Fecha y Hora</p>
            <p className="text-sm font-bold text-slate-900">{formatDateTime(slot.start_time)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="material-icons-round text-slate-400">schedule</span>
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Duración</p>
            <p className="text-sm font-bold text-slate-900">1 hora</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="material-icons-round text-slate-400">person</span>
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">ID Cliente</p>
            <p className="text-sm font-bold text-slate-900 font-mono">{slot.reserve?.client_id || 'N/A'}</p>
          </div>
        </div>
      </div>

      {!isCancelled && !isCompleted && (
        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-icons-round text-blue-500">info</span>
            <p className="text-xs font-bold text-blue-700">Información de la Reserva</p>
          </div>
          <p className="text-xs text-blue-700/80">
            El turno ha sido reservado y está {isReserved ? 'pendiente de confirmación' : 'confirmado'} para la fecha indicada.
          </p>
        </div>
      )}

      <div className="pt-4 space-y-3">
        {(isConfirmed || isCompleted) && onInvoice && (
          <button
            onClick={handleInvoice}
            className="w-full bg-slate-900 py-4 rounded-2xl text-white font-black shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            <span className="material-icons-round text-sm">receipt_long</span>
            Facturar Servicio
          </button>
        )}

        {!isCancelled && !isCompleted && isReserved && (
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full bg-blue-600 py-4 rounded-2xl text-white font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span className="material-icons-round">check_circle</span>
            {isProcessing ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        )}

        {!isCancelled && !isCompleted && (
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full bg-white py-4 rounded-2xl text-red-600 font-bold border-2 border-red-200 hover:bg-red-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-icons-round">cancel</span>
            {isProcessing ? 'Procesando...' : 'Cancelar Reserva'}
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full bg-slate-100 py-4 rounded-2xl text-slate-600 font-bold hover:bg-slate-200 transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
