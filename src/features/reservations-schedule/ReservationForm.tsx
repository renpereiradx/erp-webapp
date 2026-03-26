import React, { useState, useEffect } from 'react';

interface ReservationType {
  id: string;
  name: string;
  description?: string;
}

interface ProductPricing {
  base_rate: number;
  lighting_fee?: number;
  min_duration?: number;
  max_duration?: number;
}

interface ReservationFormProps {
  selectedSlot: string | null;
  productPricing: ProductPricing;
  maxAvailableDuration?: number;
  reservationTypes?: ReservationType[];
  onSubmit: (clientId: string, startTime: string, duration: number, reservationType?: string) => Promise<void>;
  onSearchClients: (name: string) => Promise<any[]>;
  onDurationChange?: (duration: number) => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({ 
  selectedSlot, 
  productPricing,
  maxAvailableDuration,
  reservationTypes = [],
  onSubmit, 
  onSearchClients,
  onDurationChange 
}) => {
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [startTime, setStartTime] = useState(selectedSlot || '');
  const [selectedReservationType, setSelectedReservationType] = useState<string>('');

  const baseRate = productPricing?.base_rate || 0;
  const lightingFee = productPricing?.lighting_fee || 0;
  const minDuration = productPricing?.min_duration || 1;
  const productMaxDuration = productPricing?.max_duration || 4;
  const effectiveMaxDuration = Math.min(maxAvailableDuration || productMaxDuration, productMaxDuration);
  const showDurationWarning = duration > (maxAvailableDuration || 4);

  useEffect(() => {
    if (selectedSlot) {
      setStartTime(selectedSlot);
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (reservationTypes.length > 0 && !selectedReservationType) {
      setSelectedReservationType(reservationTypes[0].id);
    }
  }, [reservationTypes, selectedReservationType]);

  const calculatedLightingFee = duration > 1.5 ? lightingFee : 0;
  const total = (baseRate * duration) + calculatedLightingFee;

  const handleSearch = async (val: string) => {
    setClientSearch(val);
    if (val.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await onSearchClients(val);
      setSearchResults(results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectClient = (client: any) => {
    setClientId(client.id);
    setClientSearch(`${client.name} ${client.last_name}`);
    setSearchResults([]);
  };

  const handleDurationChange = (val: number) => {
    setDuration(val);
    if (onDurationChange) onDurationChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !clientId) return;

    setIsSubmitting(true);
    try {
      await onSubmit(clientId, startTime, duration, selectedReservationType);
      setClientId('');
      setClientSearch('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTimeForInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const formatCurrency = (value: number) => {
    if (value === 0) return 'Gs. 0';
    return `Gs. ${value.toLocaleString()}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6">
        {/* Cliente con Autocomplete */}
        <div className="relative">
          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">Cliente / Socio</label>
          <div className="relative">
            <input 
              value={clientSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium" 
              placeholder="Buscar por nombre o ID..."
              type="text" 
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person_search</span>
            {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-400"><span className="material-symbols-outlined">sync</span></div>}
          </div>
          
          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in zoom-in-95 duration-200">
              {searchResults.map((client) => (
                <div 
                  key={client.id}
                  onClick={() => selectClient(client)}
                  className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {client.name?.[0]}{client.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{client.name} {client.last_name}</p>
                    <p className="text-[10px] font-mono text-slate-400">ID: {client.id} | {client.document_id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">Hora Inicio</label>
            <input 
              type="datetime-local"
              value={formatDateTimeForInput(startTime)}
              onChange={(e) => {
                const newTime = new Date(e.target.value).toISOString();
                setStartTime(newTime);
              }}
              className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 font-mono text-blue-600 text-center text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">Tipo de Turno</label>
            <select 
              value={selectedReservationType}
              onChange={(e) => setSelectedReservationType(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-4 px-4 font-semibold text-xs focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {reservationTypes.length > 0 ? (
                reservationTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))
              ) : (
                <option value="">Normal</option>
              )}
            </select>
          </div>
        </div>

        <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50">
          <div className="flex justify-between items-center mb-5">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Duración Estimada</label>
            <span className={`font-mono font-black bg-white px-3 py-1 rounded-lg shadow-sm border ${
              showDurationWarning ? 'border-red-300 text-red-600' : 'border-blue-100 text-blue-700'
            }`}>
              {duration} hr{duration > 1 ? 's' : ''}
              {showDurationWarning && ` (máx ${maxAvailableDuration})`}
            </span>
          </div>
          <input 
            type="range" 
            min={minDuration} 
            max={effectiveMaxDuration} 
            step="0.5" 
            value={duration}
            onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
          <div className="flex justify-between mt-2 text-[9px] font-mono text-blue-300 font-bold uppercase tracking-tighter">
            <span>{minDuration} hora</span>
            <span>{effectiveMaxDuration} horas máx.</span>
          </div>
          {showDurationWarning && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[10px] font-bold text-red-600">
                ⚠️ No hay suficientes horarios disponibles para {duration} horas consecutivas.
              </p>
              <p className="text-[9px] text-red-500 mt-1">
                Seleccione otro horario de inicio o reduzca la duración.
              </p>
            </div>
          )}
        </div>

        {/* Desglose de Precios */}
        <div className="bg-slate-50/80 p-6 rounded-2xl space-y-3 border border-slate-100">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-medium tracking-tight">Tarifa Base ({duration}h × {formatCurrency(baseRate)}/h)</span>
            <span className="font-mono font-bold text-slate-700">{formatCurrency(baseRate * duration)}</span>
          </div>
          {calculatedLightingFee > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium tracking-tight">Recargo Iluminación</span>
              <span className="font-mono font-bold text-slate-700">{formatCurrency(calculatedLightingFee)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-black text-slate-900">Total a Pagar</span>
            <span className="font-mono font-black text-blue-600 text-xl tracking-tighter">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <button 
          disabled={!startTime || !clientId || isSubmitting}
          className="w-full bg-blue-600 py-4 rounded-2xl text-white font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all transform hover:-translate-y-1 active:scale-[0.98]"
        >
          {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
        </button>
        <div className="flex items-center gap-2 justify-center text-slate-400">
          <span className="material-symbols-outlined text-sm">shield</span>
          <p className="text-[10px] font-bold uppercase tracking-tight">Garantía de disponibilidad activa</p>
        </div>
      </div>
    </form>
  );
};
