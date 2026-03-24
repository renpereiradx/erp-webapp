import React from 'react';
import { ProductScheduleConfig } from '../../domain/reservation';

interface ScheduleSettingsProps {
  config: ProductScheduleConfig | null;
}

export const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({ config }) => {
  return (
    <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h3 className="text-2xl font-black mb-1 tracking-tight">Ventana de Generación</h3>
          <p className="text-slate-500 text-sm opacity-70">Define los parámetros operativos globales para este recurso.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 max-w-4xl">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">Hora Apertura</label>
            <input 
              type="time" 
              defaultValue={config ? `${config.start_hour.toString().padStart(2, '0')}:00` : '07:00'}
              className="w-full bg-slate-50 border-none rounded-lg font-mono text-sm py-2 px-3 focus:ring-2 focus:ring-blue-100" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">Hora Cierre</label>
            <input 
              type="time" 
              defaultValue={config ? `${config.end_hour.toString().padStart(2, '0')}:00` : '23:00'}
              className="w-full bg-slate-50 border-none rounded-lg font-mono text-sm py-2 px-3 focus:ring-2 focus:ring-blue-100" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">Zona Horaria</label>
            <select className="w-full bg-slate-50 border-none rounded-lg text-sm py-2 px-3 font-semibold focus:ring-2 focus:ring-blue-100">
              <option value="America/Asuncion">UTC-4 (PY)</option>
              <option value="UTC-5">UTC-5 (BOG/LIM)</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config?.is_active ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span className={`${config?.is_active ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
            </div>
            <span className="font-bold text-sm">Recurso Activo</span>
          </div>
        </div>
        
        <button className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-black transition-all">
          Guardar Cambios
        </button>
      </div>
    </section>
  );
};
