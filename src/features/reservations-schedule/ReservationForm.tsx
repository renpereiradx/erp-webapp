import React, { useState } from 'react';

interface ReservationFormProps {
  selectedSlot: string | null;
  onSubmit: (clientId: string, startTime: string, duration: number) => Promise<void>;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({ selectedSlot, onSubmit }) => {
  const [clientId, setClientId] = useState('');
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !clientId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(clientId, selectedSlot, duration);
      setClientId('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white p-8 rounded-xl shadow-lg border border-blue-50">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-blue-600 text-3xl">add_box</span>
        <h3 className="font-black text-xl">Nueva Reserva</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">Cliente / Socio</label>
          <div className="relative">
            <input 
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-lg py-3 pl-10 focus:ring-2 focus:ring-blue-100" 
              placeholder="Nombre o ID..."
              type="text" 
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person_search</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">Inicio</label>
            <input 
              className="w-full bg-slate-100 border-none rounded-lg py-3 px-4 font-mono text-slate-500 text-center" 
              readOnly 
              type="text" 
              value={selectedSlot ? new Date(selectedSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} 
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
            <select className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 font-semibold text-xs focus:ring-2 focus:ring-blue-100">
              <option>Normal</option>
              <option>Torneo</option>
              <option>Mantenimiento</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Duración (Horas)</label>
            <span className="font-mono text-blue-600 font-bold">{duration} hr{duration > 1 ? 's' : ''}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="4" 
            step="1" 
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
        </div>

        <button 
          disabled={!selectedSlot || isSubmitting}
          className="w-full bg-blue-600 py-4 rounded-xl text-white font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all transform hover:-translate-y-0.5"
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
        </button>
        <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-tighter">Acción sujeta a políticas de la empresa</p>
      </form>
    </section>
  );
};
