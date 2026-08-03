import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Building, CreditCard, DollarSign, X, CheckCircle2, Search, PackageOpen } from 'lucide-react';
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
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';

interface PurchaseCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  logic: ReturnType<typeof usePurchasesLogic>;
}

export const PurchaseCheckoutModal: React.FC<PurchaseCheckoutModalProps> = ({
  isOpen,
  onClose,
  logic,
}) => {
  const {
    purchaseTotals,
    selectedSupplier,
    handleSupplierSelect,
    setSelectedSupplier,
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    currencies,
    paymentCurrency,
    setPaymentCurrency,
    canWrite,
    loading,
    handleSavePurchase,
    supplierSearch,
    setSupplierSearch,
    purchaseNotes,
    setPurchaseNotes,
  } = logic;

  const supplierSearchInputRef = useRef<HTMLInputElement>(null);

  // Focus supplier search when opened if no supplier selected
  useEffect(() => {
    if (isOpen) {
      if (!selectedSupplier) {
        setTimeout(() => supplierSearchInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, selectedSupplier]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'F12') {
        e.preventDefault();
        if (canWrite && selectedSupplier && purchaseTotals.subtotal >= 0) {
          handleSavePurchase();
          onClose(); // Optional, depends on handleSavePurchase behavior
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'F3') {
        e.preventDefault();
        supplierSearchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canWrite, selectedSupplier, purchaseTotals, handleSavePurchase, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl bg-surface-container-lowest shadow-2xl rounded-xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Supplier & Payment Details */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <PackageOpen className="text-primary" size={24} /> Resumen de Compra
            </h2>
            <p className="text-sm text-slate-500 font-medium">Confirma el proveedor y las condiciones de pago</p>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Supplier Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building size={18} className="text-primary" />
                <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Proveedor</h3>
              </div>
              
              {!selectedSupplier ? (
                <div className='relative' ref={logic.supplierSearchRef}>
                  <div className='relative'>
                    <Search
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-outline'
                      size={16}
                    />
                    <input
                      ref={supplierSearchInputRef}
                      type='text'
                      placeholder='Buscar proveedor por nombre o RUC... (F3)'
                      className='w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-md text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm'
                      value={supplierSearch}
                      onChange={e => setSupplierSearch(e.target.value)}
                      onFocus={() => logic.setShowSupplierDropdown(true)}
                      onKeyDown={logic.handleSupplierSearchKeyDown}
                    />
                    {logic.searchingSuppliers && (
                      <div className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin'></div>
                    )}
                  </div>

                  {logic.showSupplierDropdown && logic.supplierResults.length > 0 && (
                    <div className='absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-slate-200 overflow-hidden z-30 py-1 max-h-[220px] overflow-y-auto'>
                      {logic.supplierResults.map((s, index) => {
                        const isActive = logic.activeSupplierIndex === index;
                        return (
                          <button
                            key={s.id}
                            className={`w-full px-4 py-2.5 text-left border-b border-slate-100 last:border-none flex justify-between items-center transition-colors ${
                              isActive
                                ? 'bg-primary/5 ring-1 ring-inset ring-primary'
                                : 'hover:bg-slate-50'
                            }`}
                            onClick={() => handleSupplierSelect(s)}
                            onMouseEnter={() => logic.setActiveSupplierIndex(index)}
                          >
                            <span className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-slate-700'}`}>
                              {logic.getSupplierName(s)}
                            </span>
                            <span className='text-xs text-slate-400'>
                              ID: {s.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-white rounded-lg border-2 border-primary/20 shadow-sm relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-primary text-lg leading-tight mb-1">{logic.getSupplierName(selectedSupplier)}</p>
                      {selectedSupplier.tax_id && <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Badge variant="outline" className="text-[10px]">RUC</Badge> {selectedSupplier.tax_id}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedSupplier(null)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <X size={18} />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Método de Pago</h3>
                </div>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200 focus:ring-primary focus:border-primary">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method: any) => (
                      <SelectItem key={method.id} value={String(method.id)}>
                        {logic.getPaymentMethodLabel ? logic.getPaymentMethodLabel(method) : (method.description || method.name || method.method_code)}
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
                <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200 focus:ring-primary focus:border-primary">
                    <SelectValue placeholder="Moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency: any) => (
                      <SelectItem key={currency.id} value={currency.code || currency.currency_code}>
                        {currency.code || currency.currency_code} - {logic.getCurrencyLabel ? logic.getCurrencyLabel(currency) : (currency.name || currency.description)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider">Notas de la Compra</h3>
              <textarea
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="Ej: Pedido urgente de insumos..."
                className="w-full h-24 p-3 rounded-md border border-slate-200 bg-white text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Total */}
        <div className="w-full md:w-[350px] flex flex-col bg-white">
          <div className="p-8 flex-1 flex flex-col">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Total Compra</p>
            <p className="text-4xl font-black text-primary tracking-tighter mb-8 leading-none">
              {formatCurrency(purchaseTotals.subtotal)}
            </p>
            
            <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resumen</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Artículos</span>
                <span className="font-bold text-slate-700">{logic.purchaseItems.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Liquidación IVA</span>
                <span className="font-bold text-slate-700">{formatCurrency(purchaseTotals.iva10 + purchaseTotals.iva5)}</span>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <Button 
                onClick={() => {
                  handleSavePurchase();
                  onClose();
                }}
                disabled={loading || !canWrite || !selectedSupplier || purchaseTotals.subtotal <= 0}
                className="w-full h-14 text-base rounded-xl font-black uppercase tracking-widest transition-all shadow-xl bg-primary text-on-primary hover:bg-primary/90 shadow-primary/30"
              >
                {loading ? 'Procesando...' : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={20} /> Guardar (F12)
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
