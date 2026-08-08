import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, CreditCard, DollarSign, X, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '@/contexts/BranchContext';
import { formatCurrency } from '@/utils/currencyUtils';
import useClientStore from '@/store/useClientStore';
import { cn } from '@/lib/utils';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalAmount: number;
  client: any | null;
  onClientSelect: (client: any) => void;
  onClearClient: () => void;
  paymentMethods: any[];
  paymentMethodId: number;
  setPaymentMethodId: (id: number) => void;
  currencies: any[];
  currencyId: number;
  setCurrencyId: (id: number) => void;
  activeSales: any[];
  pendingReservations: any[];
  canWrite: boolean;
  isProcessingSale: boolean;
  currentSaleId: string | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  client,
  onClientSelect,
  onClearClient,
  paymentMethods,
  paymentMethodId,
  setPaymentMethodId,
  currencies,
  currencyId,
  setCurrencyId,
  activeSales,
  pendingReservations,
  canWrite,
  isProcessingSale,
  currentSaleId,
}) => {
  const { currentBranchId } = useBranch();
  
  const activeSaleObj = currentSaleId ? activeSales.find(s => String(s.id) === String(currentSaleId)) : null;
  const isFromOtherBranch = activeSaleObj && activeSaleObj.branch_id && activeSaleObj.branch_id !== currentBranchId;
  const { searchClients } = useClientStore();
  const [cashTendered, setCashTendered] = useState<string>('');
  const clientSearchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Focus received amount input or client search depending on context
  useEffect(() => {
    if (isOpen) {
      if (!client) {
        setTimeout(() => clientSearchInputRef.current?.focus(), 100);
      } else {
        if (cashTendered === '') {
          setCashTendered(totalAmount.toString());
        }
        setTimeout(() => {
          cashInputRef.current?.focus();
          cashInputRef.current?.select();
        }, 100);
      }
    }
  }, [isOpen, client, cashTendered, totalAmount]);

  // Manejo del teclado para F12 o Enter para confirmar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'F12') {
        e.preventDefault();
        if (canWrite && client && totalAmount >= 0) {
          onConfirm();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'F3') {
        e.preventDefault();
        clientSearchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canWrite, client, totalAmount, onConfirm, onClose]);

  if (!isOpen) return null;

  const change = Math.max(0, Number(cashTendered || 0) - totalAmount);
  const isCash = paymentMethods.find(m => m.id === paymentMethodId)?.name?.toLowerCase().includes('efectivo');

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl bg-surface-container-lowest shadow-2xl rounded-xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Client & Payment Details */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ShoppingCart className="text-primary" size={24} /> Cobro Rápido
            </h2>
            <p className="text-sm text-slate-500 font-medium">Finaliza la venta y genera el comprobante</p>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Client Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User size={18} className="text-primary" />
                <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Cliente</h3>
              </div>
              
              {!client ? (
                <SearchableDropdown
                  inputRef={clientSearchInputRef}
                  onSelect={onClientSelect}
                  onSearch={async (term: string) => {
                    if (term.trim().length < 3) return [];
                    await searchClients(term);
                    return useClientStore.getState().searchResults as any[];
                  }}
                  placeholder="Buscar cliente por nombre o CI... (F3)"
                  renderItem={(item) => (
                    <div className="flex items-center gap-3 py-1">
                      <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.displayName || item.name}</p>
                        {item.document_id && <p className="text-xs text-slate-500">CI: {item.document_id}</p>}
                      </div>
                    </div>
                  )}
                  emptyMessage="No se encontraron clientes"
                  className="w-full bg-white shadow-sm"
                />
              ) : (
                <div className="p-4 bg-white rounded-lg border-2 border-primary/20 shadow-sm relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-primary text-lg leading-tight mb-1">{client.displayName || client.name}</p>
                      {client.document_id && <div className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Badge variant="outline" className="text-[10px]">CI/RUC</Badge> {client.document_id}</div>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClearClient} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <X size={18} />
                    </Button>
                  </div>

                  {/* Warnings for Pending Sales/Reservations */}
                  {(activeSales.length > 0 || pendingReservations.length > 0) && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-black uppercase text-amber-800 tracking-wider">Atención</p>
                        <p className="text-xs font-medium text-amber-700">Este cliente tiene {activeSales.length > 0 ? `${activeSales.length} ventas pendientes` : ''} {activeSales.length > 0 && pendingReservations.length > 0 ? 'y' : ''} {pendingReservations.length > 0 ? `${pendingReservations.length} reservas pendientes` : ''}. Verifica si deseas sumarlas al total antes de cobrar.</p>
                      </div>
                    </div>
                  )}
                  {isFromOtherBranch && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-md border border-orange-200 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-black uppercase text-orange-800 tracking-wider">Cobro Multi-Sucursal</p>
                        <p className="text-xs font-medium text-orange-700">Estás cobrando una venta iniciada en otra sucursal. Confirma que esto es correcto.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Pago</h3>
                </div>
                <Select value={String(paymentMethodId)} onValueChange={(v) => setPaymentMethodId(Number(v))}>
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200 focus:ring-primary focus:border-primary">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={String(method.id)}>
                        {method.name || method.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-primary" />
                  <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Moneda</h3>
                </div>
                <Select value={String(currencyId)} onValueChange={(v) => setCurrencyId(Number(v))}>
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200 focus:ring-primary focus:border-primary">
                    <SelectValue placeholder="Moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.id} value={String(currency.id)}>
                        {currency.code || currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Total & Numpad */}
        <div className="w-full md:w-[400px] flex flex-col bg-white">
          <div className="p-8 flex-1 flex flex-col">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Total a Pagar</p>
            <p className="text-5xl font-black text-primary tracking-tighter mb-8 leading-none">
              {formatCurrency(totalAmount)}
            </p>

            {isCash && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2 mb-2"><Calculator size={14} /> Monto Recibido</label>
                  <Input 
                    ref={cashInputRef}
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (canWrite && client && totalAmount >= 0) {
                          onConfirm();
                        }
                      }
                    }}
                    className="h-14 text-2xl font-bold px-4"
                    placeholder="0"
                  />
                </div>
                
                <div className="flex gap-2">
                  {[50000, 100000, 150000].map(amt => (
                    <Button key={amt} variant="outline" size="sm" className="flex-1 text-xs font-bold font-data-mono bg-slate-50 hover:bg-slate-100 border-slate-200" onClick={() => setCashTendered(amt.toString())}>
                      {formatCurrency(amt)}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" className="flex-1 text-xs font-bold" onClick={() => setCashTendered(totalAmount.toString())}>Exacto</Button>
                </div>

                <div className="p-4 bg-slate-900 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Vuelto</span>
                  <span className="text-2xl font-black text-emerald-400">{formatCurrency(change)}</span>
                </div>
              </div>
            )}

            <div className="mt-auto space-y-3">
              <Button 
                onClick={onConfirm}
                disabled={isProcessingSale || !canWrite || !client || totalAmount <= 0}
                className={cn(
                  "w-full h-16 text-lg rounded-xl font-black uppercase tracking-widest transition-all shadow-xl",
                  currentSaleId ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-primary text-on-primary hover:bg-primary/90 shadow-primary/30"
                )}
              >
                {isProcessingSale ? 'Procesando...' : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={24} /> {currentSaleId ? 'Actualizar' : 'Cobrar (F12)'}
                  </span>
                )}
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full h-12 text-slate-500 font-bold uppercase tracking-wider hover:bg-slate-100">
                Volver
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
