import React, { useState } from 'react';
import { useReservation } from '../../hooks/useReservation';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ReservationForm } from './ReservationForm';
import { ScheduleSettings } from './ScheduleSettings';

const ReservationDashboard: React.FC = () => {
  const {
    productId,
    setProductId,
    targetDate,
    setTargetDate,
    slots,
    config,
    loading,
    error,
    handleGenerateToday,
    createReservation,
  } = useReservation('CANCHA_01');

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-8 h-16 border-b border-slate-100">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black tracking-tight">Precision ERP</h1>
          <nav className="hidden md:flex items-center space-x-6">
            <button className="text-blue-700 border-b-2 border-blue-700 pb-2 font-bold transition-all">Agenda Diaria</button>
            <button className="text-slate-500 hover:text-slate-900 transition-colors pb-2">Configuración</button>
            <button className="text-slate-500 hover:text-slate-900 transition-colors pb-2">Reportes</button>
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-12 px-8 max-w-[1600px] mx-auto">
        <div className="flex items-baseline justify-between mb-12">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-black tracking-tighter leading-none mb-2">Planificación y Reservas</h2>
            <p className="text-slate-500 font-medium opacity-70">Gestione la disponibilidad de recursos y coordine citas en tiempo real.</p>
          </div>
          <div className="flex gap-4">
            <button className="bg-slate-100 px-6 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">file_download</span> Exportar
            </button>
            <button className="bg-blue-600 px-6 py-3 rounded-lg font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">add</span> Nueva Reserva
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">Selección de Recurso</label>
              <select 
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 font-semibold focus:ring-2 focus:ring-blue-100"
              >
                <option value="CANCHA_01">CANCHA_01</option>
                <option value="CANCHA_02">CANCHA_02</option>
              </select>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">Fecha de Operación</label>
              <input 
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 font-mono focus:ring-2 focus:ring-blue-100"
              />
            </section>

            <section className="bg-blue-600 p-6 rounded-xl text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="font-black text-xl mb-2">Acciones Rápidas</h3>
                <p className="text-blue-100 text-sm mb-6">Genera bloques de disponibilidad basados en la configuración actual.</p>
                <button 
                  onClick={handleGenerateToday}
                  className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg hover:bg-blue-50 transition-all shadow-xl"
                >
                  Generar Horarios para Hoy
                </button>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/10 text-[120px] group-hover:scale-110 transition-transform duration-500">auto_mode</span>
            </section>
          </div>

          {/* Main Timeline */}
          <div className="col-span-12 lg:col-span-6">
            <ScheduleTimeline 
              slots={slots} 
              loading={loading} 
              onSelectSlot={(time) => setSelectedSlot(time)}
            />
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <ReservationForm 
              selectedSlot={selectedSlot}
              onSubmit={createReservation}
            />
          </div>
        </div>

        {/* Bottom Settings */}
        <div className="mt-12">
          <ScheduleSettings config={config} />
        </div>
      </main>
    </div>
  );
};

export default ReservationDashboard;
