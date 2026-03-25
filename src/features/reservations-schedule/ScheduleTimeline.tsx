import React from 'react';
import { ScheduleSlot } from '../../domain/reservation';

interface ScheduleTimelineProps {
  slots: ScheduleSlot[];
  loading: boolean;
  selectedSlot: string | null;
  selectedDuration: number;
  onSelectSlot: (time: string) => void;
  onConfirm: (reserveId: number) => Promise<void>;
  onCancel: (reserveId: number) => Promise<void>;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ 
  slots, 
  loading, 
  selectedSlot,
  selectedDuration,
  onSelectSlot,
  onConfirm,
  onCancel 
}) => {
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200/60"></div>
      ))}
    </div>
  );

  const formatTime = (timeStr: string) => {
    try {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  // 🔧 Lógica para calcular qué slots están dentro del rango seleccionado
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Cronograma de Disponibilidad</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Haz clic en un horario libre para reservar</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase">Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase">Tu Selección</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.isArray(slots) && slots.map((slot) => {
          // 🔧 Normalización de estado para mayor robustez
          const status = (slot.status || '').toUpperCase();
          const isAvailable = status === 'AVAILABLE' || status === 'FREE' || status === 'LIBRE';
          const isReserved = status === 'RESERVED' || status === 'RESERVADO';
          const isConfirmed = status === 'CONFIRMED' || status === 'CONFIRMADO' || status === 'COMPLETED';
          
          const isSelectedStart = isSameDateTime(selectedSlot, slot.start_time);
          const isInRange = isSlotInSelectionRange(slot.start_time);
          const isHighlighted = isAvailable && isInRange;
          
          // Verificar si hay conflicto (un slot reservado dentro de tu selección de duración)
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
                      : isReserved
                        ? 'bg-amber-50/30 border-amber-100/60 shadow-sm'
                        : 'bg-slate-50 border-slate-200/60 opacity-80'
              }`}
              onClick={() => isAvailable && onSelectSlot(slot.start_time)}
            >
              {/* Header de la Card: Hora */}
              <div className={`px-4 py-2 border-b flex justify-between items-center transition-colors ${
                isHighlighted 
                  ? 'bg-blue-600 text-white'
                  : hasConflict
                    ? 'bg-red-600 text-white'
                    : isAvailable ? 'bg-emerald-50/50 border-emerald-100' : isReserved ? 'bg-amber-100/40 border-amber-100/60' : 'bg-slate-100 border-slate-200'
              }`}>
                <span className={`font-mono text-xs font-black ${
                  isHighlighted || hasConflict ? 'text-white' : isAvailable ? 'text-emerald-700' : isReserved ? 'text-amber-700' : 'text-slate-500'
                }`}>
                  {formatTime(slot.start_time)}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  isHighlighted || hasConflict ? 'bg-white/20 text-white' : isAvailable ? 'text-emerald-600 bg-emerald-100/50' : isReserved ? 'text-amber-600 bg-white' : 'text-slate-600 bg-white'
                }`}>
                  {isSelectedStart ? 'INICIO' : isHighlighted ? 'INCLUIDO' : hasConflict ? 'OCUPADO' : status}
                </span>
              </div>

              {/* Cuerpo de la Card */}
              <div className="p-4 min-h-[80px] flex flex-col justify-center">
                {hasConflict ? (
                  <div className="text-center space-y-1">
                    <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                    <p className="text-[9px] font-black text-red-600 uppercase">Conflicto de Horario</p>
                  </div>
                ) : isAvailable ? (
                  <div className="text-center space-y-1">
                    <span className={`material-symbols-outlined text-3xl transition-colors ${
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
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        isReserved ? 'bg-amber-200 text-amber-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {(slot.reserve?.client_name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 truncate leading-tight">{slot.reserve?.client_name || 'Ocupado'}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">RES-{slot.reserve?.id}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      {isReserved && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); slot.reserve && onConfirm(slot.reserve.id); }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-md shadow-blue-200"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span className="text-[9px] font-black uppercase">Confirmar</span>
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); slot.reserve && onCancel(slot.reserve.id); }}
                        className={`py-1.5 rounded-lg transition-all flex items-center justify-center border ${
                          isReserved 
                            ? 'flex-none px-3 border-amber-200 text-amber-600 hover:bg-amber-100' 
                            : 'flex-1 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(!Array.isArray(slots) || slots.length === 0) && (
        <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
            <span className="material-symbols-outlined text-4xl">event_busy</span>
          </div>
          <h4 className="text-slate-900 font-black text-lg">No hay horarios disponibles</h4>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Intenta cambiar la fecha o utiliza el botón de generación rápida para crear slots.</p>
        </div>
      )}
    </div>
  );
};
