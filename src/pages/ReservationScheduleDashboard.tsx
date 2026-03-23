import React, { useState } from 'react';
import { useReservationSchedule } from '@/hooks/useReservationSchedule';
import { ScheduleSlot } from '@/domain/reservation/models';

const ReservationScheduleDashboard: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    selectedDate,
    setSelectedDate,
    config,
    setConfig,
    slots,
    isLoading,
    error,
    saveConfig,
    generateSchedules,
    manageReservation,
  } = useReservationSchedule();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [clientId, setClientId] = useState('');
  const [duration, setDuration] = useState(1);

  const handleOpenModal = (slot: ScheduleSlot) => {
    setSelectedSlot(slot);
    setClientId(slot.client_id || '');
    setDuration(1); // Default to 1 hour
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setClientId('');
  };

  const handleCreateReservation = () => {
    if (!selectedSlot) return;
    manageReservation({
      action: 'CREATE',
      product_id: selectedProduct,
      client_id: clientId,
      start_time: selectedSlot.start_time,
      duration: duration,
    }).then(() => {
      handleCloseModal();
    });
  };

  const handleConfirmReservation = () => {
    if (!selectedSlot || !selectedSlot.reservation_id) return;
    manageReservation({
      action: 'CONFIRM',
      reserve_id: selectedSlot.reservation_id,
      product_id: selectedProduct,
      client_id: selectedSlot.client_id || clientId,
      start_time: selectedSlot.start_time,
      duration: 1,
    }).then(() => handleCloseModal());
  };

  const handleCancelReservation = () => {
    if (!selectedSlot || !selectedSlot.reservation_id) return;
    manageReservation({
      action: 'CANCEL',
      reserve_id: selectedSlot.reservation_id,
      product_id: selectedProduct,
      client_id: selectedSlot.client_id || clientId,
      start_time: selectedSlot.start_time,
      duration: 1,
    }).then(() => handleCloseModal());
  };

  return (
    <div className="bg-[#f9f9ff] text-[#181c22] min-h-screen flex flex-col font-sans">
      <header className="flex justify-between items-center w-full px-8 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-blue-800">Gestión de Horarios y Reservas</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-white px-4 py-2 rounded-xl gap-3 shadow-sm border border-slate-200">
            <span className="material-symbols-outlined text-slate-500">calendar_today</span>
            <input 
              type="date" 
              className="font-mono text-sm font-bold text-blue-700 bg-transparent outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 m-4 rounded text-sm font-medium">
          {error}
        </div>
      )}

      <div className="p-8 flex gap-8 flex-1 overflow-hidden">
        <section className="w-80 flex flex-col gap-6 shrink-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">tune</span>
              CONFIGURACIÓN
            </h3>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Producto</label>
                <select 
                  className="w-full bg-slate-50 border-slate-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="CANCHA_01">CANCHA_01</option>
                  <option value="CANCHA_02">CANCHA_02</option>
                  <option value="SALA_VIP">SALA_VIP</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Inicio (Hora)</label>
                  <input 
                    className="w-full bg-slate-50 border-slate-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:ring-2 focus:ring-blue-500" 
                    type="number" 
                    value={config.start_hour}
                    onChange={(e) => setConfig({...config, start_hour: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Fin (Hora)</label>
                  <input 
                    className="w-full bg-slate-50 border-slate-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:ring-2 focus:ring-blue-500" 
                    type="number" 
                    value={config.end_hour}
                    onChange={(e) => setConfig({...config, end_hour: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Timezone</label>
                <p className="text-xs font-mono bg-slate-100 p-2 rounded-md text-slate-600">{config.timezone}</p>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={() => saveConfig(config)}
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Guardar Configuración
                </button>
                <button 
                  onClick={generateSchedules}
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-200 text-blue-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Generar Horarios
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 bg-slate-50 rounded-2xl overflow-hidden flex flex-col border border-slate-200">
          <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">grid_view</span>
              Disponibilidad Diaria
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#EAB308]"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#BA1A1A]"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Cancelado</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {isLoading && slots.length === 0 && <p className="text-center text-slate-500 col-span-3">Cargando horarios...</p>}
            {!isLoading && slots.length === 0 && <p className="text-center text-slate-500 col-span-3">No hay horarios generados para esta fecha.</p>}
            
            {slots.map((slot, index) => {
              const isAvailable = slot.status === 'AVAILABLE';
              const isReserved = slot.status === 'RESERVED' || slot.status === 'PENDING';
              const isConfirmed = slot.status === 'CONFIRMED' || slot.status === 'COMPLETED';
              const isCancelled = slot.status === 'CANCELLED';

              let borderColor = 'border-slate-200';
              let badgeColor = '';
              let badgeText = slot.status;

              if (isReserved) {
                borderColor = 'border-l-4 border-[#EAB308]';
                badgeColor = 'bg-[#EAB308]/10 text-[#EAB308]';
              } else if (isConfirmed) {
                borderColor = 'border-l-4 border-[#10B981]';
                badgeColor = 'bg-[#10B981]/10 text-[#10B981]';
              } else if (isCancelled) {
                borderColor = 'border-l-4 border-[#BA1A1A]';
                badgeColor = 'bg-[#BA1A1A]/10 text-[#BA1A1A]';
              } else {
                borderColor = 'border border-slate-200 border-dashed hover:border-blue-500/50 hover:bg-blue-50';
              }

              const timeRange = `${new Date(slot.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(slot.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

              return (
                <div 
                  key={index} 
                  onClick={() => handleOpenModal(slot)}
                  className={`bg-white p-4 rounded-xl shadow-sm transition-all cursor-pointer group ${borderColor}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-mono text-lg font-bold tracking-tighter ${isAvailable ? 'text-slate-400 group-hover:text-blue-600' : 'text-slate-700'}`}>
                      {timeRange}
                    </span>
                    {isAvailable ? (
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500">add_circle</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>{badgeText}</span>
                    )}
                  </div>
                  {isAvailable ? (
                    <div className="text-sm font-medium text-slate-400 group-hover:text-blue-500/70">Disponible</div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-800">{slot.client_name || slot.client_id || 'Cliente Anónimo'}</div>
                      <div className="text-xs text-slate-400 mt-1">ID: {slot.reservation_id}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">{selectedSlot.status === 'AVAILABLE' ? 'Nueva Reserva' : 'Detalle de Reserva'}</h2>
              <button onClick={handleCloseModal} className="hover:bg-white/20 p-1 rounded-full"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Producto ID</label>
                  <div className="font-mono text-sm bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-500">{selectedProduct}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Inicio Slot</label>
                  <div className="font-mono text-sm bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-slate-500">
                    {new Date(selectedSlot.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Cliente ID / Nombre</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500" 
                  placeholder="ID del cliente..." 
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={selectedSlot.status !== 'AVAILABLE'}
                />
              </div>

              {selectedSlot.status === 'AVAILABLE' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Duración (Horas)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      className="flex-1 accent-blue-600" 
                      max="4" min="1" type="range" 
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                    />
                    <span className="font-mono font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded">{duration}.0h</span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col gap-3">
                {selectedSlot.status === 'AVAILABLE' && (
                  <button 
                    onClick={handleCreateReservation}
                    disabled={isLoading || !clientId}
                    className="w-full py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    Crear Reserva
                  </button>
                )}
                
                {(selectedSlot.status === 'RESERVED' || selectedSlot.status === 'PENDING') && (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleConfirmReservation}
                      disabled={isLoading}
                      className="py-3 bg-[#10B981]/10 text-[#10B981] text-xs font-bold rounded-xl hover:bg-[#10B981]/20 transition-all uppercase tracking-wide"
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={handleCancelReservation}
                      disabled={isLoading}
                      className="py-3 bg-[#BA1A1A]/10 text-[#BA1A1A] text-xs font-bold rounded-xl hover:bg-[#BA1A1A]/20 transition-all uppercase tracking-wide"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {(selectedSlot.status === 'CONFIRMED' || selectedSlot.status === 'COMPLETED') && (
                  <button 
                    onClick={handleCancelReservation}
                    disabled={isLoading}
                    className="w-full py-3 bg-[#BA1A1A]/10 text-[#BA1A1A] text-xs font-bold rounded-xl hover:bg-[#BA1A1A]/20 transition-all uppercase tracking-wide"
                  >
                    Cancelar Reserva
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationScheduleDashboard;