import React, { useState, useEffect } from 'react';
import { ProductScheduleConfig } from '../../domain/reservation';

interface ScheduleSettingsProps {
  config: ProductScheduleConfig | null;
  onSave: (config: any) => Promise<void>;
}

export const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({ config, onSave }) => {
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(23);
  const [timezone, setTimezone] = useState('America/Asuncion');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (config) {
      setStartHour(config.start_hour);
      setEndHour(config.end_hour);
      setTimezone(config.timezone);
      setIsActive(config.is_active);
    }
  }, [config]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave({
        start_hour: startHour,
        end_hour: endHour,
        timezone,
        is_active: isActive
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h3 className="text-2xl font-black mb-1 tracking-tight text-slate-900">Ventana de Generación</h3>
          <p className="text-slate-500 text-sm opacity-70">Define los parámetros operativos globales para este recurso.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 max-w-4xl">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Hora Apertura</label>
            <input 
              type="number" 
              min="0" max="23"
              value={startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl font-mono text-sm py-3 px-4 focus:ring-2 focus:ring-blue-100" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Hora Cierre</label>
            <input 
              type="number" 
              min="1" max="24"
              value={endHour}
              onChange={(e) => setEndHour(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl font-mono text-sm py-3 px-4 focus:ring-2 focus:ring-blue-100" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-2">Zona Horaria</label>
            <select 
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl text-sm py-3 px-4 font-semibold focus:ring-2 focus:ring-blue-100"
            >
              <option value="America/Asuncion">UTC-4 (PY)</option>
              <option value="America/Bogota">UTC-5 (BOG/LIM)</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span className={`${isActive ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
            </div>
            <span className="font-bold text-sm text-slate-700">Recurso Activo</span>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:bg-slate-400"
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </section>
  );
};
