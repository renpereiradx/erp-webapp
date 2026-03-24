import React, { useState } from 'react';
import { useReservation } from '../../hooks/useReservation';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ReservationForm } from './ReservationForm';
import { ScheduleSettings } from './ScheduleSettings';
import { useToast } from '../../hooks/useToast';

const ReservationDashboard: React.FC = () => {
  const { addToast } = useToast();
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
    confirmReservation,
    cancelReservation,
    searchClients,
    products,
    updateConfig,
    refresh: fetchSchedules,
  } = useReservation('CANCHA_01');

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleNewReservation = () => {
    setSelectedSlot(null);
    setIsFormOpen(true);
  };

  const handleConfirm = async (id: number) => {
    try {
      await confirmReservation(id);
      addToast({ title: 'Reserva Confirmada', description: 'El turno ha sido marcado como confirmado.', type: 'success' });
    } catch (err) {
      addToast({ title: 'Error', description: 'No se pudo confirmar la reserva.', type: 'error' });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelReservation(id);
      addToast({ title: 'Reserva Cancelada', description: 'El turno ha sido anulado.', type: 'success' });
    } catch (err) {
      addToast({ title: 'Error', description: 'No se pudo cancelar la reserva.', type: 'error' });
    }
  };

  const handleGenerate = async () => {
    try {
      await handleGenerateToday();
      addToast({ title: 'Horarios Generados', description: 'Slots creados exitosamente para hoy.', type: 'success' });
    } catch (err) {
      addToast({ title: 'Error', description: 'No se pudieron generar los horarios.', type: 'error' });
    }
  };

  const handleUpdateConfig = async (newConfig: any) => {
    try {
      await updateConfig(newConfig);
      addToast({ title: 'Configuración Guardada', description: 'Los parámetros operativos han sido actualizados.', type: 'success' });
    } catch (err) {
      addToast({ title: 'Error', description: 'No se pudo guardar la configuración.', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 relative min-h-screen bg-slate-50/40 -m-8 p-8">
      {/* Mensaje de Error si existe */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <span className="material-symbols-outlined">error</span>
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Header Editorial Section */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-5xl font-black tracking-tighter leading-none mb-2">Planificación y Reservas</h2>
          <p className="text-slate-500 font-medium opacity-70">Gestione la disponibilidad de recursos y coordine citas en tiempo real.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white border border-slate-200/60 px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">file_download</span> Exportar
          </button>
          <button 
            onClick={handleNewReservation}
            className="bg-blue-600 px-6 py-3 rounded-xl font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add</span> Nueva Reserva
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Sidebar Control */}
        <div className="col-span-12 lg:col-span-3 space-y-8">
          <section className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">Selección de Recurso</label>
            <select 
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-semibold focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
            >
              {products.length > 0 ? (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.product_name || p.id}
                  </option>
                ))
              ) : (
                <option value="">Cargando recursos...</option>
              )}
            </select>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">Fecha de Operación</label>
            <input 
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-mono focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
            />
          </section>

          <section className="bg-blue-600 p-6 rounded-2xl text-white relative overflow-hidden group shadow-xl shadow-blue-600/10 transition-all hover:shadow-blue-600/20">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-2">Acciones Rápidas</h3>
              <p className="text-blue-100 text-sm mb-6">Genera bloques de disponibilidad basados en la configuración actual.</p>
              <button 
                onClick={handleGenerate}
                className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
              >
                Generar Horarios para Hoy
              </button>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/10 text-[120px] group-hover:scale-110 transition-transform duration-500">auto_mode</span>
          </section>
        </div>

        {/* Main Timeline Grid */}
        <div className="col-span-12 lg:col-span-9">
          {error?.includes('No hay horarios') ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-sm flex flex-col items-center gap-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-3xl">calendar_today</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Sin Horarios Disponibles</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">Este recurso no tiene bloques de tiempo generados para la fecha seleccionada.</p>
              </div>
              <button 
                onClick={handleGenerate}
                className="mt-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">auto_mode</span>
                Generar Horarios del Día
              </button>
            </div>
          ) : (
            <ScheduleTimeline 
              slots={slots} 
              loading={loading} 
              onSelectSlot={(time) => {
                setSelectedSlot(time);
                setIsFormOpen(true);
              }}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      {/* Bottom Settings Panel */}
      <div className="mt-4">
        <ScheduleSettings 
          config={config} 
          onSave={handleUpdateConfig}
        />
      </div>

      {/* Overlay Drawer para Nueva Reserva */}
      {isFormOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
            onClick={() => setIsFormOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500 border-l border-slate-100">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black tracking-tight">Nueva Reserva</h3>
                  <p className="text-xs text-slate-500 font-medium">Complete los datos para confirmar el turno.</p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-all text-slate-400 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <ReservationForm 
                  selectedSlot={selectedSlot}
                  onSearchClients={searchClients}
                  onSubmit={async (clientId, startTime, duration) => {
                    try {
                      await createReservation(clientId, startTime, duration);
                      addToast({ title: 'Reserva Exitosa', description: 'El turno ha sido registrado correctamente.', type: 'success' });
                      setIsFormOpen(false);
                    } catch (err) {
                      addToast({ title: 'Error', description: 'No se pudo crear la reserva.', type: 'error' });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReservationDashboard;
