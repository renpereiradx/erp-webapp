import React, { useState } from 'react';
import { toast } from 'sonner';
import { useReservation } from '../../hooks/useReservation';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ReservationForm } from './ReservationForm';
import { ReservationDetail } from './ReservationDetail';
import { ScheduleSettings } from './ScheduleSettings';
import { ScheduleSlot } from '../../domain/reservation';

type PanelMode = 'closed' | 'new' | 'detail';

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
    confirmReservation,
    cancelReservation,
    searchClients,
    products,
    updateConfig,
  } = useReservation();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [panelMode, setPanelMode] = useState<PanelMode>('closed');
  const [detailSlot, setDetailSlot] = useState<ScheduleSlot | null>(null);

  const currentProduct = products.find(p => (p.id || p.product_id) === productId);

  // Extraer precio del producto (puede estar en unit_prices o como campo directo)
  const extractPrice = (product: any): number => {
    if (product?.unit_prices && Array.isArray(product.unit_prices) && product.unit_prices.length > 0) {
      const firstPrice = product.unit_prices[0];
      return firstPrice.price_per_unit || firstPrice.unit_price || firstPrice.price || firstPrice.base_price || firstPrice.sale_price || 0;
    }
    return product?.base_price || product?.price || product?.unit_price || product?.price_per_unit || product?.sale_price || 0;
  };

  const productPricing = {
    base_rate: extractPrice(currentProduct) || 12000,
    lighting_fee: currentProduct?.lighting_fee || currentProduct?.lightingFee || 0,
    min_duration: currentProduct?.min_duration || 1,
    max_duration: currentProduct?.max_duration || 4,
  };

  const reservationTypes = [
    { id: 'normal', name: 'Normal' },
    { id: 'training', name: 'Entrenamiento' },
    { id: 'match', name: 'Partido' },
    { id: 'event', name: 'Evento Especial' },
  ];

  const handleShowDetail = (slot: ScheduleSlot) => {
    setDetailSlot(slot);
    setPanelMode('detail');
  };

  const handleConfirm = async (reserveId: number) => {
    try {
      await confirmReservation(reserveId);
      toast.success('Reserva Confirmada', { description: 'El turno ha sido marcado como confirmado.' });
      if (panelMode === 'detail') setPanelMode('closed');
    } catch (err) {
      toast.error('Error', { description: 'No se pudo confirmar la reserva.' });
    }
  };

  const handleCancel = async (reserveId: number) => {
    if (!window.confirm('¿Está seguro de que desea anular esta reserva?')) return;
    try {
      await cancelReservation(reserveId);
      toast.success('Reserva Anulada', { description: 'El turno ha sido cancelado correctamente.' });
      if (panelMode === 'detail') setPanelMode('closed');
    } catch (err) {
      toast.error('Error', { description: 'No se pudo anular la reserva.' });
    }
  };

  const handleUpdateConfig = async (newConfig: any) => {
    try {
      await updateConfig(newConfig);
      toast.success('Configuración Actualizada');
    } catch (err) {
      toast.error('Error al actualizar configuración');
    }
  };

  // Calcular duración máxima permitida según slots consecutivos disponibles
  const getMaxAvailableDuration = (startTime: string | null): number => {
    if (!startTime || !slots.length) return productPricing.max_duration;

    const sortedSlots = [...slots].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const selectedIndex = sortedSlots.findIndex(s => s.start_time === startTime);
    if (selectedIndex === -1) return productPricing.max_duration;

    let consecutiveAvailable = 1; // El slot seleccionado cuenta como 1

    for (let i = selectedIndex + 1; i < sortedSlots.length; i++) {
      const slot = sortedSlots[i];
      const isAvailable = !slot.reserve && slot.status === 'AVAILABLE';
      if (isAvailable) {
        consecutiveAvailable++;
      } else {
        break; // Stop at first occupied slot
      }
    }

    return Math.min(consecutiveAvailable, productPricing.max_duration);
  };

  const maxAvailableDuration = getMaxAvailableDuration(selectedSlot);

  const handleNewReservation = () => {
    if (!selectedSlot) {
      toast.warning('Seleccione un horario', {
        description: 'Haga clic en un horario disponible para crear una nueva reserva.',
      });
      return;
    }

    const maxDur = getMaxAvailableDuration(selectedSlot);
    if (maxDur === 0) {
      toast.error('Horario no disponible', {
        description: 'El horario seleccionado ya no está disponible.',
      });
      return;
    }

    setPanelMode('new');
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display max-w-[1600px] mx-auto pb-20 lg:pb-10">
      {/* Mensaje de Error si existe */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 mx-2 md:mx-0">
          <span className="material-icons-round">error</span>
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Header Editorial Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2 md:px-0">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-tight lg:leading-none mb-2 text-slate-900">Planificación y Reservas</h2>
          <p className="text-slate-500 text-sm md:text-base font-medium">Gestione la disponibilidad de recursos y coordine citas en tiempo real.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <button className="flex-1 sm:flex-none bg-white border border-slate-200 px-5 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm text-xs uppercase tracking-wider">
            <span className="material-icons-round text-[18px]">file_download</span> Exportar
          </button>
          <button 
            onClick={handleNewReservation}
            className="flex-1 sm:flex-none bg-blue-600 px-5 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            <span className="material-icons-round text-[18px]">add</span> Nueva Reserva
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 lg:gap-8 px-2 md:px-0">
        {/* Left Sidebar Control - Compacto en moviles */}
        <div className="col-span-12 lg:col-span-3 space-y-4 lg:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <section className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200/60">
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Selección de Recurso</label>
              <select 
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 text-sm appearance-none cursor-pointer"
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

            <section className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200/60">
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Fecha de Operación</label>
              <div className="relative">
                <input 
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-mono font-bold focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 text-sm cursor-pointer"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-icons-round text-slate-400 pointer-events-none text-xl">calendar_today</span>
              </div>
            </section>
          </div>

          <section className="bg-blue-600 p-6 rounded-2xl text-white relative overflow-hidden group shadow-xl shadow-blue-600/10 hidden lg:block">
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-2">Acciones Rápidas</h3>
              <p className="text-blue-200 text-sm mb-6">Genera bloques de disponibilidad basados en la configuración actual.</p>
              <button 
                onClick={handleGenerateToday}
                className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
              >
                Generar Horarios del Día
              </button>
            </div>
            <span className="material-icons-round absolute -right-4 -bottom-4 text-white/10 text-[120px] group-hover:scale-110 transition-transform duration-500">auto_mode</span>
          </section>
        </div>

        {/* Main Timeline Grid */}
        <div className="col-span-12 lg:col-span-9">
          {error?.includes('No hay horarios') ? (
            <div className="bg-white rounded-2xl p-8 lg:p-12 text-center border border-dashed border-slate-200 shadow-sm flex flex-col items-center gap-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <span className="material-icons-round text-3xl">calendar_today</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Sin Horarios Disponibles</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1 text-sm">Este recurso no tiene bloques de tiempo generados para la fecha seleccionada.</p>
              </div>
              <button 
                onClick={handleGenerateToday}
                className="mt-2 w-full sm:w-auto bg-blue-600 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                <span className="material-icons-round text-[20px]">auto_mode</span>
                Generar Horarios del Día
              </button>
            </div>
          ) : (
            <ScheduleTimeline 
              slots={slots} 
              loading={loading} 
              selectedSlot={selectedSlot}
              selectedDuration={selectedDuration}
              onSelectSlot={(time) => {
                setSelectedSlot(time);
                setPanelMode('new');
              }}
              onShowDetail={handleShowDetail}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      {/* Bottom Settings Panel */}
      <div className="mt-4 px-2 md:px-0">
        <ScheduleSettings 
          config={config} 
          onSave={handleUpdateConfig}
        />
      </div>

      {/* Unified Drawer Panel - Dynamic Content */}
      {panelMode !== 'closed' && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
            onClick={() => setPanelMode('closed')}
          />
          <div className="fixed right-0 bottom-0 lg:top-0 h-[90vh] lg:h-full w-full lg:max-w-md bg-white z-[70] shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom lg:slide-in-from-right duration-500 border-t lg:border-t-0 lg:border-l border-slate-100 rounded-t-[2.5rem] lg:rounded-none">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2.5rem] lg:rounded-none">
                <div>
                  <h3 className="text-xl font-black tracking-tight">
                    {panelMode === 'new' ? 'Nueva Reserva' : 'Detalle de Reserva'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {panelMode === 'new' ? 'Complete los datos para confirmar el turno.' : 'Información del turno reservado.'}
                  </p>
                </div>
                <button 
                  onClick={() => setPanelMode('closed')}
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-all text-slate-400 hover:text-slate-900"
                >
                  <span className="material-icons-round">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                {panelMode === 'new' ? (
                  <ReservationForm 
                    selectedSlot={selectedSlot}
                    productPricing={productPricing}
                    maxAvailableDuration={maxAvailableDuration}
                    reservationTypes={reservationTypes}
                    onSearchClients={searchClients}
                    onDurationChange={setSelectedDuration}
                    onSubmit={async (clientId, startTime, duration) => {
                      try {
                        await createReservation(clientId, startTime, duration);
                        toast.success('Reserva Exitosa', { description: 'El turno ha sido registrado correctamente.' });
                        setPanelMode('closed');
                      } catch (err) {
                        toast.error('Error', { description: 'No se pudo crear la reserva.' });
                      }
                    }}
                  />
                ) : (
                  <ReservationDetail 
                    slot={detailSlot!}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    onClose={() => setPanelMode('closed')}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReservationDashboard;
