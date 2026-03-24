import React from 'react';
import { ScheduleSlot } from '../../domain/reservation';

interface ScheduleTimelineProps {
  slots: ScheduleSlot[];
  loading: boolean;
  onSelectSlot: (time: string) => void;
  onConfirm: (reserveId: number) => Promise<void>;
  onCancel: (reserveId: number) => Promise<void>;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ 
  slots, 
  loading, 
  onSelectSlot,
  onConfirm,
  onCancel 
}) => {
  if (loading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Consultando disponibilidad...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04),0_4px_6px_-2px_rgba(0,0,0,0.02)] overflow-hidden border border-slate-100/80">
      <div className="bg-slate-50/40 px-6 py-4 flex items-center justify-between border-b border-slate-100/60">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Cronograma Diario</span>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> LIBRE
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> RESERVADO
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100/50">
        {slots.map((slot) => (
          <div key={slot.id} className="group flex items-stretch min-h-[110px] hover:bg-slate-50/50 transition-colors">
            <div className="w-24 p-4 border-r border-slate-100/60 flex flex-col justify-center bg-slate-50/20">
              <span className="font-mono text-xs font-bold text-slate-400 text-center">
                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex-1 p-4 relative">
              {slot.status === 'AVAILABLE' ? (
                <div 
                  onClick={() => onSelectSlot(slot.start_time)}
                  className="w-full h-full rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group/slot"
                >
                  <span className="text-slate-300 group-hover/slot:text-emerald-500 font-black text-[10px] tracking-widest uppercase transition-colors">DISPONIBLE</span>
                </div>
              ) : (
                <div className={`h-full rounded-xl p-4 flex justify-between items-center border-l-4 shadow-sm ${
                  slot.status === 'RESERVED' ? 'bg-amber-50/40 border-amber-400' : 'bg-blue-50/40 border-blue-500'
                }`}>
                  <div>
                    <p className={`font-mono text-[10px] font-bold mb-1 uppercase ${
                      slot.status === 'RESERVED' ? 'text-amber-700' : 'text-blue-700'
                    }`}>{slot.status}</p>
                    <p className="font-bold text-slate-900 tracking-tight">{slot.reserve?.client_name || 'Reserva Ocupada'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {slot.reserve?.id}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {slot.status === 'RESERVED' && (
                      <button 
                        onClick={() => slot.reserve && onConfirm(slot.reserve.id)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center gap-1"
                        title="Confirmar Reserva"
                      >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span className="text-[10px] font-bold uppercase pr-1">Confirmar</span>
                      </button>
                    )}
                    <button 
                      onClick={() => slot.reserve && onCancel(slot.reserve.id)}
                      className="p-2 bg-white text-slate-400 border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all"
                      title="Cancelar"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {slots.length === 0 && (
          <div className="p-12 text-center text-slate-400">No hay horarios generados para esta fecha.</div>
        )}
      </div>
    </div>
  );
};
