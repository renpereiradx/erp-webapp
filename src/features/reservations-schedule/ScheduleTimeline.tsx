import React from 'react';
import { ScheduleSlot } from '../../domain/reservation';

interface ScheduleTimelineProps {
  slots: ScheduleSlot[];
  loading: boolean;
  onSelectSlot: (time: string) => void;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ slots, loading, onSelectSlot }) => {
  if (loading) return <div className="p-8 text-center text-slate-400">Cargando cronograma...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
      <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Cronograma Diario</span>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> LIBRE
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> RESERVADO
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {slots.map((slot) => (
          <div key={slot.id} className="group flex items-stretch min-h-[100px] hover:bg-slate-50 transition-colors">
            <div className="w-20 p-4 border-r border-slate-50 flex flex-col justify-center bg-slate-50/30">
              <span className="font-mono text-xs font-bold text-slate-400">
                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex-1 p-4 relative">
              {slot.status === 'AVAILABLE' ? (
                <div 
                  onClick={() => onSelectSlot(slot.start_time)}
                  className="w-full h-full rounded-lg border-2 border-dashed border-emerald-100 flex items-center justify-center group-hover:bg-emerald-50/50 transition-all cursor-pointer"
                >
                  <span className="text-emerald-500 font-black text-xs tracking-widest uppercase">DISPONIBLE</span>
                </div>
              ) : (
                <div className={`h-full rounded-lg p-4 flex justify-between items-start border-l-4 ${
                  slot.status === 'RESERVED' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-600'
                }`}>
                  <div>
                    <p className={`font-mono text-[10px] font-bold mb-1 uppercase ${
                      slot.status === 'RESERVED' ? 'text-amber-700' : 'text-blue-700'
                    }`}>{slot.status}</p>
                    <p className="font-bold text-slate-900">{slot.reserve?.client_name || 'Reserva Ocupada'}</p>
                  </div>
                  <span className={`material-symbols-outlined ${
                    slot.status === 'RESERVED' ? 'text-amber-500' : 'text-blue-600'
                  }`}>
                    {slot.status === 'RESERVED' ? 'pending_actions' : 'check_circle'}
                  </span>
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
