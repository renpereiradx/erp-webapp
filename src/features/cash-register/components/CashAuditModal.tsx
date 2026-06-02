import React, { useState, useEffect, useMemo } from 'react';
import { useCashRegisterStore } from '@/store/useCashRegisterStore';
import { cashAuditService } from '@/services/cashAuditService';
import { calculateTotalCounted, calculateAuditDifference } from '@/domain/cash-register/calculations';
import { Denominations } from '@/domain/cash-register/models';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, XCircle, Clock, Plus as PlusIcon, Minus as MinusIcon, AlertCircle } from 'lucide-react';

interface CashAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashRegisterId?: number;
  systemBalance: number;
  onAuditCreated: () => void;
}

export const CashAuditModal: React.FC<CashAuditModalProps> = ({ isOpen, onClose, cashRegisterId, systemBalance, onAuditCreated }) => {
  const [denominations, setDenominations] = useState<Denominations | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const { createAudit, isCreatingAudit } = useCashRegisterStore();

  useEffect(() => {
    if (isOpen) {
      loadDenominations();
      setCounts({});
      setNotes('');
    }
  }, [isOpen]);

  const loadDenominations = async () => {
    setLoading(true);
    try {
      const data = await cashAuditService.getDenominations();
      setDenominations(data.PYG || data);
    } catch (error) {
      console.error('Error loading denominations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountChange = (value: string, denom: number) => {
    setCounts(prev => ({
      ...prev,
      [denom]: parseInt(value) || 0
    }));
  };

  const totalCounted = useMemo(() => calculateTotalCounted(denominations, counts), [denominations, counts]);
  const difference = useMemo(() => calculateAuditDifference(systemBalance, totalCounted), [systemBalance, totalCounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denominations || !cashRegisterId) return;

    const denomDetails: any[] = [];
    denominations.bills?.forEach((val: number) => {
      if (counts[val]) denomDetails.push({ denomination: val, count: counts[val], type: 'BILL' });
    });
    denominations.coins?.forEach((val: number) => {
      if (counts[val]) denomDetails.push({ denomination: val, count: counts[val], type: 'COIN' });
    });

    try {
      await createAudit({
        cash_register_id: cashRegisterId,
        counted_amount: totalCounted,
        denominations: denomDetails,
        notes: notes
      });
      onAuditCreated();
      onClose();
    } catch (error) {
      console.error('Error creating audit', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='bg-surface dark:bg-background-dark w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl shadow-fluent-16 border border-border-subtle overflow-hidden' onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-between p-6 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary'>
              <ClipboardCheck className='w-6 h-6' />
            </div>
            <div>
              <h2 className='text-lg font-black tracking-tighter uppercase text-text-main'>Arqueo de Caja</h2>
              <p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Conteo físico de billetes y monedas</p>
            </div>
          </div>
          <button onClick={onClose} className='text-text-secondary hover:text-text-main transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800'>
            <XCircle className='w-6 h-6' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-8 custom-scrollbar'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-20 gap-4'>
              <Clock className='animate-spin text-primary size-10' />
              <p className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400'>Cargando denominaciones...</p>
            </div>
          ) : (
            <form id='audit-form' onSubmit={handleSubmit} className='space-y-10'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
                <div className='space-y-6'>
                  <h4 className='text-[10px] font-black uppercase text-primary tracking-[0.3em] flex items-center gap-2 border-b border-primary/20 pb-2'>
                    <PlusIcon size={12} /> Billetes
                  </h4>
                  <div className='space-y-3'>
                    {denominations?.bills?.map((val: number) => (
                      <div key={val} className='flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-transparent hover:border-border-subtle hover:bg-white dark:hover:bg-slate-800 transition-all group'>
                        <span className='text-sm font-mono font-black text-text-main w-24'>{val.toLocaleString()} ₲</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-[10px] text-slate-400 font-black uppercase group-hover:text-primary transition-colors'>x</span>
                          <Input 
                            type='number' 
                            min='0' 
                            className='w-24 h-9 text-right font-black font-mono border-border-subtle focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-950' 
                            value={counts[val] || ''} 
                            onChange={e => handleCountChange(e.target.value, val)} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='space-y-6'>
                  <h4 className='text-[10px] font-black uppercase text-warning tracking-[0.3em] flex items-center gap-2 border-b border-warning/20 pb-2'>
                    <MinusIcon size={12} /> Monedas
                  </h4>
                  <div className='space-y-3'>
                    {denominations?.coins?.map((val: number) => (
                      <div key={val} className='flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-transparent hover:border-border-subtle hover:bg-white dark:hover:bg-slate-800 transition-all group'>
                        <span className='text-sm font-mono font-black text-text-main w-24'>{val.toLocaleString()} ₲</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-[10px] text-slate-400 font-black uppercase group-hover:text-warning transition-colors'>x</span>
                          <Input 
                            type='number' 
                            min='0' 
                            className='w-24 h-9 text-right font-black font-mono border-border-subtle focus:ring-2 focus:ring-warning/20 bg-white dark:bg-slate-950' 
                            value={counts[val] || ''} 
                            onChange={e => handleCountChange(e.target.value, val)} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='p-8 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-border-subtle shadow-inner flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden'>
                <div className='absolute top-0 left-0 w-2 h-full bg-primary'></div>
                <div className='text-center md:text-left flex-1 min-w-0'>
                  <p className='text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-2'>Total Contado Físicamente</p>
                  <p className='text-4xl font-black text-primary tabular-nums font-mono tracking-tighter truncate'>{totalCounted.toLocaleString()} ₲</p>
                </div>
                <div className='text-center md:text-right flex-shrink-0'>
                  <p className='text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-2'>Diferencia vs Sistema</p>
                  <div className='flex items-center justify-center md:justify-end gap-2'>
                    <p className={`text-3xl font-black tabular-nums font-mono ${difference === 0 ? 'text-success' : 'text-error'}`}>
                      {difference > 0 ? '+' : ''}{difference.toLocaleString()} ₲
                    </p>
                    {difference !== 0 && (
                      <div className={`size-6 rounded-full flex items-center justify-center ${difference > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        <AlertCircle size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Observaciones del Arqueo</Label>
                <Textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder='Ej: Sobrante de ₲ 500 por redondeo, billetes deteriorados...' 
                  rows={3} 
                  className="rounded-xl border-border-subtle resize-none font-medium focus:ring-2 focus:ring-primary/10 bg-white dark:bg-slate-950" 
                />
              </div>
            </form>
          )}
        </div>

        <div className='p-6 border-t border-border-subtle bg-slate-50/50 dark:bg-slate-800/50 flex gap-4'>
          <Button 
            type='submit' 
            form='audit-form' 
            className='flex-1 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[11px] h-12 rounded-lg shadow-fluent-8 transition-all active:scale-95' 
            disabled={isCreatingAudit || loading}
          >
            {isCreatingAudit ? <Clock className='animate-spin mr-2' size={16} /> : null}
            {isCreatingAudit ? 'Guardando...' : 'Confirmar y Guardar Arqueo'}
          </Button>
          <Button 
            variant='outline' 
            onClick={onClose} 
            className='px-8 border-border-subtle font-black uppercase tracking-widest text-[11px] h-12 rounded-lg hover:bg-white dark:hover:bg-slate-950 transition-all'
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};
