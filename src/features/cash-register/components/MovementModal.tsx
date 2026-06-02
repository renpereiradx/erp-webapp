import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Banknote, XCircle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateMovementForm } from '@/domain/cash-register/validators';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: { movement_type: string; amount: number; concept: string; category?: string; notes: string | null }) => Promise<void>;
  isLoading: boolean;
}

export const MovementModal: React.FC<MovementModalProps> = ({ isOpen, onClose, onRegister, isLoading }) => {
  const [form, setForm] = useState<{
    movement_type: 'INCOME' | 'EXPENSE';
    amount: string;
    category: string;
    notes: string;
  }>({ movement_type: 'INCOME', amount: '', category: '', notes: '' });
  
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const movementTypes = [
    { value: 'INCOME', label: 'Ingreso' },
    { value: 'EXPENSE', label: 'Egreso' },
  ];

  const categories = {
    INCOME: [
      { id: 'cash_deposit', name: 'Depósito de efectivo' },
      { id: 'reposition', name: 'Reposición de caja' },
      { id: 'adjustment_positive', name: '[Ajuste] Corrección de saldo' },
      { id: 'other_income', name: 'Otro ingreso' },
    ],
    EXPENSE: [
      { id: 'cash_withdrawal', name: 'Retiro de efectivo' },
      { id: 'purchase', name: 'Compra de insumos' },
      { id: 'service_payment', name: 'Pago de servicio' },
      { id: 'adjustment_negative', name: '[Ajuste] Corrección de saldo' },
      { id: 'other_expense', name: 'Otro egreso' },
    ],
  };

  const handleTypeChange = (value: string) => {
    setForm(prev => ({ ...prev, movement_type: value as 'INCOME' | 'EXPENSE', category: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(form.amount);
    
    if (!form.category) {
      setError('Debe seleccionar un concepto operativo');
      return;
    }
    
    const validationError = validateMovementForm(amount, form.category);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const categoryLabel = categories[form.movement_type].find(c => c.id === form.category)?.name || form.category;
      const finalConcept = categoryLabel + (form.notes ? ` - ${form.notes}` : '');

      await onRegister({
        movement_type: form.movement_type,
        amount,
        concept: finalConcept,
        category: form.category,
        notes: form.notes || null,
      });
      setForm({ movement_type: 'INCOME', amount: '', category: '', notes: '' });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el movimiento');
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300' onClick={onClose}>
      <div className='bg-surface dark:bg-background-dark w-full max-w-xl rounded-3xl shadow-fluent-16 border-none overflow-hidden animate-in zoom-in-95 duration-200' onClick={e => e.stopPropagation()}>
        <div className='p-8 pb-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-subtle text-left'>
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/10 shadow-inner">
              <Banknote className='w-7 h-7' />
            </div>
            <div className='flex-1'>
              <h2 className='text-2xl font-black tracking-tighter uppercase text-text-main'>Nuevo Movimiento</h2>
              <p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1'>Registro manual de entrada o salida de efectivo</p>
            </div>
            <button onClick={onClose} className='text-text-secondary hover:text-text-main transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 self-start'><XCircle className='w-6 h-6' /></button>
          </div>
        </div>
        <div className='p-8 space-y-8'>
          <form onSubmit={handleSubmit} className='space-y-8' id='movement-form'>
            <div className='space-y-3'>
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">
                Tipo de Transacción
              </Label>
              <SegmentedControl
                options={movementTypes}
                value={form.movement_type}
                onChange={handleTypeChange}
                className='h-12 bg-slate-100 dark:bg-slate-900 rounded-xl p-1.5'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Concepto Operativo</Label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({...prev, category: v}))} required>
                  <SelectTrigger className="h-12 border-border-subtle rounded-xl font-bold bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/10">
                    <SelectValue placeholder='Seleccione un motivo...' />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-fluent-16 border-border-subtle">
                    {categories[form.movement_type].map(concept => (
                      <SelectItem key={concept.id} value={concept.id} className="font-bold text-xs uppercase tracking-wider py-3">
                        {concept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Monto de la Operación</Label>
                <div className='relative'>
                  <span className='absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black'>₲</span>
                  <Input type='number' step='0.01' value={form.amount} onChange={e => setForm(prev => ({...prev, amount: e.target.value}))} placeholder='0' className="h-12 pl-10 font-mono font-black text-lg border-border-subtle rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/10" required />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Detalles Adicionales</Label>
              <Textarea value={form.notes} onChange={e => setForm(prev => ({...prev, notes: e.target.value}))} placeholder='Añada cualquier información relevante para auditoría...' rows={3} className="resize-none rounded-xl border-border-subtle bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/10 min-h-[100px] p-4" />
            </div>
            
            {error && (
              <div className='p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3 animate-in shake-in duration-300'>
                <AlertCircle className="text-error" size={18} />
                <p className='text-xs font-black text-error uppercase tracking-wider'>{error}</p>
              </div>
            )}
          </form>
        </div>
        <div className='flex gap-4 p-8 border-t border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
          <Button variant='outline' onClick={onClose} disabled={isLoading} className="flex-1 h-12 border-border-subtle font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white transition-all">Cancelar</Button>
          <Button onClick={handleSubmit} form='movement-form' disabled={isLoading} className="flex-1 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[11px] h-12 rounded-xl shadow-fluent-8 transition-all active:scale-95">
            {isLoading ? <Clock className='animate-spin mr-2' size={16} /> : <CheckCircle2 className="mr-2 w-4 h-4" />}Guardar Movimiento
          </Button>
        </div>
      </div>
    </div>
  );
};
