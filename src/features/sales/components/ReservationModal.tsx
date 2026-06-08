import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyUtils';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingReservations: any[];
  selectedResIds: Set<number>;
  onToggleSelection: (id: number) => void;
  onAddReservations: () => void;
  selectedClientName?: string;
  formatDateTime: (date: any) => string;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  pendingReservations,
  selectedResIds,
  onToggleSelection,
  onAddReservations,
  selectedClientName,
  formatDateTime
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
      <Card className="w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 glass-mica border border-white/20 overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-emerald-50/80 backdrop-blur-md px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-emerald-100/80 rounded-lg flex items-center justify-center text-emerald-700 shadow-sm backdrop-blur-sm">
              <ShoppingCart size={22} />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tighter uppercase text-emerald-800">
                Reservas Pendientes de Cobro
              </CardTitle>
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">
                {selectedClientName} • {pendingReservations.length} encontradas
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white/40">
          <div className="max-h-[400px] overflow-y-auto">
            <div className="p-4 space-y-3">
              {pendingReservations.map((res, index) => {
                const resId = Number(res.reserve_id || res.id);
                const isSelected = selectedResIds.has(resId);
                
                // Verificar si ya hay otra reserva seleccionada para este MISMO producto
                const isProductAlreadySelected = Array.from(selectedResIds).some(sid => {
                  if (sid === resId) return false;
                  const otherRes = pendingReservations.find(r => Number(r.reserve_id || r.id) === sid);
                  return otherRes?.product_id === res.product_id;
                });

                return (
                  <div 
                    key={`${resId}-${index}`} 
                    onClick={() => {
                      if (isProductAlreadySelected && !isSelected) {
                        return; // Toast logic handled in parent or we just prevent toggle here
                      }
                      onToggleSelection(resId);
                    }}
                    className={cn(
                      "group relative flex flex-col p-4 border rounded-xl transition-all cursor-pointer bg-white/70 backdrop-blur-sm",
                      isSelected 
                        ? "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-md" 
                        : isProductAlreadySelected
                          ? "border-slate-100 bg-slate-50/50 opacity-50 grayscale cursor-not-allowed"
                          : "border-slate-200/60 hover:border-emerald-300 hover:bg-white shadow-sm"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "size-5 rounded-md border-2 flex items-center justify-center transition-all",
                          isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <Plus size={14} strokeWidth={4} />}
                        </div>
                        <span className="font-black text-[13px] text-slate-800 uppercase leading-tight">
                          {res.product_name || 'Servicio de reserva'}
                        </span>
                      </div>
                      <Badge className={cn(
                        "border-none text-[9px] uppercase font-black px-2 py-0.5",
                        isSelected ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"
                      )}>
                        ID #{resId}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-1 pl-7">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <History size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-tight">Inicio:</span>
                          <span className="text-[11px] font-medium text-slate-700">{formatDateTime(res.start_time)}</span>
                        </div>
                        {res.duration_hours && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <div className="size-3 flex items-center justify-center text-[10px] font-black">H</div>
                            <span className="text-[10px] font-bold uppercase tracking-tight">Duración:</span>
                            <span className="text-[11px] font-medium text-slate-700">{res.duration_hours} hora(s)</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Reserva</span>
                        <span className={cn(
                          "text-lg font-black tabular-nums tracking-tighter",
                          isSelected ? "text-emerald-600" : "text-slate-600"
                        )}>
                          {formatCurrency(res.total_amount)}
                        </span>
                      </div>
                    </div>

                    {isProductAlreadySelected && !isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl">
                        <span className="bg-slate-800 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                          Producto ya seleccionado
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-6 bg-white/60 backdrop-blur-md border-t border-slate-200/50 flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200/50"
            >
              Omitir Reservas
            </Button>
            <Button 
              onClick={onAddReservations} 
              disabled={selectedResIds.size === 0}
              className="flex-[2] h-12 text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Plus className="mr-2 size-4" /> 
              Añadir {selectedResIds.size} {selectedResIds.size === 1 ? 'Reserva' : 'Reservas'} al Carrito
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
