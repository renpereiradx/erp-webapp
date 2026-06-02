import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus as PlusIcon, XCircle, Clock, AlertCircle } from 'lucide-react';
import { validateOpenForm } from '@/domain/cash-register/validators';

interface OpenCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (data: { name: string; initial_balance: number; location: string | null; notes: string | null }) => Promise<void>;
  isLoading: boolean;
}

export const OpenCashRegisterModal: React.FC<OpenCashRegisterModalProps> = ({ isOpen, onClose, onOpen, isLoading }) => {
  const [form, setForm] = useState({ name: '', initial_balance: '', location: '', notes: '' });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const balance = parseFloat(form.initial_balance);
    const validationError = validateOpenForm(form.name, balance);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onOpen({
        name: form.name,
        initial_balance: balance,
        location: form.location || null,
        notes: form.notes || null,
      });
      setForm({ name: '', initial_balance: '', location: '', notes: '' });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al abrir la caja registradora');
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300' onClick={onClose}>
      <div className='bg-surface dark:bg-background-dark w-full max-w-lg rounded-2xl shadow-fluent-16 border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200' onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-between p-6 pb-4 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary'><PlusIcon size={20} /></div>
            <div><h2 className='text-lg font-black tracking-tighter uppercase text-text-main'>Abrir Nueva Caja</h2><p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Configuración de jornada operativa</p></div>
          </div>
          <button onClick={onClose} className='text-text-secondary hover:text-text-main transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800'><XCircle className='w-6 h-6' /></button>
        </div>
        <div className='p-8 space-y-6'>
          <form onSubmit={handleSubmit} className='space-y-6' id='open-cash-form'>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre de la Caja</Label>
              <Input value={form.name} onChange={e => setForm(prev => ({...prev, name: e.target.value}))} placeholder='Ej: Caja Principal - Turno Mañana' className="rounded-xl border-border-subtle font-black h-11 focus:ring-2 focus:ring-primary/10" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fondo Inicial (Sencillo)</Label>
              <div className='relative'>
                <span className='absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black'>₲</span>
                <Input type='number' step='0.01' min='0' value={form.initial_balance} onChange={e => setForm(prev => ({...prev, initial_balance: e.target.value}))} placeholder='0.00' className="rounded-xl border-border-subtle font-mono font-black text-xl h-14 pl-10 focus:ring-2 focus:ring-primary/10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Ubicación</Label>
              <Input value={form.location} onChange={e => setForm(prev => ({...prev, location: e.target.value}))} placeholder='Ej: Sucursal Centro - Mostrador 1' className="rounded-xl border-border-subtle h-11 focus:ring-2 focus:ring-primary/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas de Apertura</Label>
              <Textarea value={form.notes} onChange={e => setForm(prev => ({...prev, notes: e.target.value}))} placeholder='Observaciones iniciales...' rows={3} className="rounded-xl border-border-subtle resize-none focus:ring-2 focus:ring-primary/10" />
            </div>
            {error && (
              <div className='p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3 animate-in shake-in duration-300'>
                <AlertCircle className="text-error" size={18} />
                <p className='text-xs font-black text-error uppercase tracking-wider'>{error}</p>
              </div>
            )}
          </form>
        </div>
        <div className='flex gap-4 p-6 border-t border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
          <Button onClick={handleSubmit} form='open-cash-form' disabled={isLoading} className="flex-1 bg-primary hover:bg-primary-hover text-white font-black uppercase text-[11px] tracking-widest h-12 rounded-lg shadow-fluent-8 transition-all active:scale-95">
            {isLoading ? <Clock className='animate-spin mr-2' size={16} /> : null}
            {isLoading ? 'Abriendo...' : 'Abrir Caja Registradora'}
          </Button>
          <Button variant='outline' onClick={onClose} disabled={isLoading} className="px-8 border-border-subtle font-black uppercase text-[11px] tracking-widest h-12 rounded-lg hover:bg-white dark:hover:bg-slate-950 transition-all">Cancelar</Button>
        </div>
      </div>
    </div>
  );
};
