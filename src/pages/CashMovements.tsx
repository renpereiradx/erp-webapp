import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';
import { cashRegisterService } from '@/services/cashRegisterService';
import { CashRegister, Movement } from '@/store/useCashRegisterStore';
import { History, Filter, Plus, Wallet, Search, RefreshCw, X } from 'lucide-react';

interface Filters {
  type: string;
  date_from: string;
  date_to: string;
}

interface NewMovementForm {
  movement_type: 'INCOME' | 'EXPENSE';
  concept: string;
  amount: string;
  notes: string;
}

interface VoidDialog {
  isOpen: boolean;
  movement: Movement | null;
  reason: string;
  isSubmitting: boolean;
}

const CashMovements: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addToast, toasts, removeToast } = useToast();

  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null);
  const [isLoadingCashRegister, setIsLoadingCashRegister] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({ type: '', date_from: '', date_to: '' });
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);
  const [newMovementForm, setNewMovementForm] = useState<NewMovementForm>({
    movement_type: 'INCOME',
    concept: '',
    amount: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voidDialog, setVoidDialog] = useState<VoidDialog>({
    isOpen: false,
    movement: null,
    reason: '',
    isSubmitting: false,
  });

  const concepts: Record<'INCOME' | 'EXPENSE', {id: string, name: string}[]> = {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (value: string) => {
    if (!value) return '';
    const numericValue = value.toString().replace(/\D/g, '');
    if (!numericValue) return '';
    return Number(numericValue).toLocaleString('es-PY');
  };

  const parseFormattedNumber = (formattedValue: string) => {
    if (!formattedValue) return '';
    return formattedValue.replace(/\./g, '').replace(/,/g, '');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const loadActiveCashRegister = useCallback(async () => {
    setIsLoadingCashRegister(true);
    try {
      const result = await cashRegisterService.getActiveCashRegister();
      setActiveCashRegister(result);
    } catch (error) {
      console.error('Error loading active cash register:', error);
      addToast(t('cashMovement.error.loadingCashRegister', 'Error al cargar la caja registradora'), 'error');
    } finally {
      setIsLoadingCashRegister(false);
    }
  }, [addToast, t]);

  const loadMovements = useCallback(async (applyFilters = false) => {
    if (!activeCashRegister?.id) return;
    setIsLoadingMovements(true);
    try {
      let result;
      if (applyFilters && (filters.type || filters.date_from || filters.date_to)) {
        const filterParams: any = {};
        if (filters.type) filterParams.type = filters.type;
        if (filters.date_from) filterParams.date_from = filters.date_from;
        if (filters.date_to) filterParams.date_to = filters.date_to;
        result = await cashRegisterService.getFilteredMovements(activeCashRegister.id, filterParams);
      } else {
        result = await cashRegisterService.getMovements(activeCashRegister.id);
      }
      setMovements(result || []);
    } catch (error) {
      console.error('Error loading movements:', error);
      addToast(t('cashMovement.error.loadingMovements', 'Error al cargar los movimientos'), 'error');
    } finally {
      setIsLoadingMovements(false);
    }
  }, [activeCashRegister?.id, filters, addToast, t]);

  useEffect(() => { loadActiveCashRegister(); }, [loadActiveCashRegister]);
  useEffect(() => { if (activeCashRegister?.id) loadMovements(); }, [activeCashRegister?.id, loadMovements]);

  const handleFilterChange = (field: keyof Filters, value: string) => setFilters(prev => ({ ...prev, [field]: value }));
  const handleApplyFilters = () => { loadMovements(true); setIsFiltersOpen(false); };
  const handleClearFilters = () => { setFilters({ type: '', date_from: '', date_to: '' }); loadMovements(false); setIsFiltersOpen(false); };
  const handleNewMovementChange = (field: keyof NewMovementForm, value: string) => setNewMovementForm(prev => ({ ...prev, [field]: value }));

  const handleSubmitNewMovement = async () => {
    if (!activeCashRegister?.id) return addToast(t('cashMovement.error.noActiveCashRegister', 'No hay caja registradora activa'), 'error');
    const amount = parseFloat(parseFormattedNumber(newMovementForm.amount));
    if (!amount || amount <= 0) return addToast(t('cashMovement.error.invalidAmount', 'El monto debe ser mayor a 0'), 'error');
    if (!newMovementForm.concept) return addToast(t('cashMovement.error.noConcept', 'Debe seleccionar un concepto'), 'error');

    setIsSubmitting(true);
    try {
      const conceptLabel = concepts[newMovementForm.movement_type]?.find(c => c.id === newMovementForm.concept)?.name || newMovementForm.concept;
      await cashRegisterService.createMovement({
        cash_register_id: activeCashRegister.id,
        movement_type: newMovementForm.movement_type,
        amount: amount,
        category: newMovementForm.concept,
        concept: conceptLabel + (newMovementForm.notes ? ` - ${newMovementForm.notes}` : ''),
      });
      addToast(t('cashMovement.success', 'Movimiento registrado con éxito'), 'success');
      setNewMovementForm({ movement_type: 'INCOME', concept: '', amount: '', notes: '' });
      setIsNewMovementOpen(false);
      loadMovements();
    } catch (error: any) {
      addToast(error.message || t('cashMovement.error.generic', 'Error al registrar el movimiento'), 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleVoidMovement = async () => {
    if (!voidDialog.movement || voidDialog.reason.length < 5) return addToast(t('cashMovement.void.reasonRequired', 'La razón debe tener al menos 5 caracteres'), 'error');
    setVoidDialog(prev => ({ ...prev, isSubmitting: true }));
    try {
      await cashRegisterService.voidMovement(voidDialog.movement.movement_id as number, voidDialog.reason);
      addToast(t('cashMovement.void.success', 'Movimiento anulado correctamente'), 'success');
      setVoidDialog({ isOpen: false, movement: null, reason: '', isSubmitting: false });
      loadMovements();
    } catch (error: any) {
      addToast(error.message || t('cashMovement.void.error', 'Error al anular el movimiento'), 'error');
      setVoidDialog(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Fluent UI Tokens
  const cardShadow = 'shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_0_2px_rgba(0,0,0,0.14)]';
  const cardBg = 'bg-white dark:bg-[#252423]';
  const canvasBg = 'bg-[#f3f2f1] dark:bg-[#11100f]';
  const borderColor = 'border-slate-200 dark:border-[#3b3a39]';
  const inputClass = 'h-8 px-3 text-sm rounded-md border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] focus-visible:ring-1 focus-visible:ring-[#0f6cbd]';

  if (isLoadingCashRegister) {
    return (
      <div className={`min-h-full ${canvasBg} flex items-center justify-center`}>
        <div className='flex items-center gap-2 text-slate-500'>
          <RefreshCw className='animate-spin w-5 h-5' /> Cargando movimientos...
        </div>
      </div>
    );
  }

  if (!activeCashRegister) {
    return (
      <div className={`min-h-full ${canvasBg} p-8 flex items-center justify-center`}>
        <div className={`rounded-lg ${cardBg} border ${borderColor} ${cardShadow} max-w-md w-full p-8 text-center`}>
          <Wallet className='w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4' />
          <h2 className="text-lg font-semibold mb-2">No hay terminal activa</h2>
          <p className="text-sm text-slate-500 dark:text-[#a19f9d] mb-6">
            Para visualizar o registrar movimientos de caja, primero debe abrir una jornada operativa.
          </p>
          <Button onClick={() => navigate('/caja-registradora')} className="h-9 px-6 bg-[#0f6cbd] hover:bg-[#115ea5] text-white text-sm font-medium rounded-md shadow-sm">
            Ir a Gestión de Caja
          </Button>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filters.type || filters.date_from || filters.date_to;

  return (
    <div className={`min-h-full ${canvasBg} text-[#323130] dark:text-[#f3f2f1] p-4 md:p-8 font-sans`}>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      <header className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-semibold leading-tight'>Movimientos de caja</h1>
          </div>
          <div className='flex items-center gap-3 mt-1.5'>
            <div className='flex items-center gap-1.5'>
              <div className='w-2 h-2 rounded-full bg-[#107c10]'></div>
              <span className='text-xs font-medium text-slate-500 dark:text-[#a19f9d]'>{activeCashRegister.name}</span>
            </div>
            <span className='text-slate-300 dark:text-slate-600'>|</span>
            <span className='text-xs font-medium text-slate-500 dark:text-[#a19f9d]'>
              Saldo: <span className='font-mono font-semibold text-[#323130] dark:text-[#f3f2f1]'>₲{formatCurrency(activeCashRegister.current_balance || activeCashRegister.initial_balance || 0)}</span>
            </span>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`h-8 px-3 text-xs font-medium rounded-md bg-white dark:bg-[#323130] border-slate-300 dark:border-[#484644] hover:bg-slate-50 dark:hover:bg-[#3b3a39] ${
              hasActiveFilters ? 'bg-[#ebf3fc] dark:bg-[#00245b] text-[#0f6cbd] dark:text-[#4facfe] border-[#0f6cbd]/30' : ''
            }`}
          >
            <Filter className='w-4 h-4 mr-1.5' /> Filtros
            {hasActiveFilters && <span className='w-1.5 h-1.5 rounded-full bg-[#0f6cbd] dark:bg-[#4facfe] ml-2' />}
          </Button>
          <Button
            onClick={() => setIsNewMovementOpen(true)}
            className='h-8 px-4 text-xs font-medium rounded-md bg-[#0f6cbd] hover:bg-[#115ea5] text-white shadow-sm border-transparent'
          >
            <Plus className='w-4 h-4 mr-1.5' /> Registrar movimiento
          </Button>
        </div>
      </header>

      {isFiltersOpen && (
        <div className={`mb-6 p-5 rounded-lg ${cardBg} border ${borderColor} ${cardShadow} animate-in slide-in-from-top-2 duration-200`}>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4'>
            <div className='space-y-1.5'>
              <Label className="text-xs font-semibold text-slate-700 dark:text-[#e1dfdd]">Tipo</Label>
              <Select value={filters.type} onValueChange={value => handleFilterChange('type', value)}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent className='rounded-md shadow-lg border-slate-200 dark:border-[#3b3a39]'>
                  <SelectItem value='INCOME' className='text-sm'>Ingresos</SelectItem>
                  <SelectItem value='EXPENSE' className='text-sm'>Egresos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1.5'>
              <Label className="text-xs font-semibold text-slate-700 dark:text-[#e1dfdd]">Desde</Label>
              <Input type='date' value={filters.date_from} onChange={e => handleFilterChange('date_from', e.target.value)} className={inputClass} />
            </div>
            <div className='space-y-1.5'>
              <Label className="text-xs font-semibold text-slate-700 dark:text-[#e1dfdd]">Hasta</Label>
              <Input type='date' value={filters.date_to} onChange={e => handleFilterChange('date_to', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className='flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-[#3b3a39]'>
            <Button variant='ghost' onClick={handleClearFilters} className="h-8 px-4 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              Limpiar
            </Button>
            <Button onClick={handleApplyFilters} className="h-8 px-4 text-xs font-medium rounded-md bg-[#0f6cbd] hover:bg-[#115ea5] text-white shadow-sm border-transparent">
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}

      <div className={`rounded-lg ${cardBg} border ${borderColor} ${cardShadow} flex-1 overflow-hidden`}>
        {isLoadingMovements ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className='animate-spin w-6 h-6 mb-2' />
            <span className='text-sm'>Cargando registros...</span>
          </div>
        ) : movements.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Search className='w-10 h-10 text-slate-300 dark:text-[#a19f9d] mb-3' />
            <h3 className="text-base font-semibold mb-1">Sin resultados</h3>
            <p className="text-sm text-slate-500 dark:text-[#a19f9d] max-w-sm">No se encontraron movimientos registrados con los filtros actuales.</p>
            {hasActiveFilters && (
              <Button variant='link' onClick={handleClearFilters} className='mt-2 text-xs text-[#0f6cbd]'>Ver todos los movimientos</Button>
            )}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse min-w-[700px]'>
              <thead>
                <tr className={`border-b ${borderColor} bg-slate-50/50 dark:bg-[#201f1e]`}>
                  <th className='py-2 px-4 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] w-[140px]'>Fecha y Hora</th>
                  <th className='py-2 px-4 text-xs font-semibold text-slate-500 dark:text-[#a19f9d]'>Concepto</th>
                  <th className='py-2 px-4 text-xs font-semibold text-slate-500 dark:text-[#a19f9d]'>Usuario</th>
                  <th className='py-2 px-4 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] text-right'>Monto</th>
                  <th className='py-2 px-4 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] text-right'>Balance</th>
                  <th className='py-2 px-4 text-xs font-semibold text-slate-500 dark:text-[#a19f9d] text-center w-12'></th>
                </tr>
              </thead>
              <tbody className='text-sm'>
                {movements.map(movement => {
                  const isIncome = movement.movement_type === 'INCOME';
                  const isVoided = !!movement.voided_at;
                  
                  return (
                    <tr key={movement.movement_id} className={`border-b ${borderColor} hover:bg-slate-50 dark:hover:bg-[#292827] transition-colors group ${isVoided ? 'opacity-50 line-through text-slate-400' : ''}`}>
                      <td className='py-2.5 px-4 text-xs whitespace-nowrap'>{formatDate(movement.created_at)}</td>
                      <td className='py-2.5 px-4'>
                        <div className='flex flex-col gap-0.5'>
                          <div className='flex items-center gap-2'>
                            {!isVoided && (
                              <span className={isIncome ? 'text-[#107c10]' : 'text-[#d13438]'}>
                                {isIncome ? <Plus className='w-3 h-3' /> : <X className='w-3 h-3' />}
                              </span>
                            )}
                            <span className='font-medium'>{movement.concept}</span>
                          </div>
                          {isVoided && (
                            <span className='text-[10px] text-[#d13438] bg-[#d13438]/10 px-1.5 py-0.5 rounded-sm inline-block max-w-max'>
                              Anulado: {movement.void_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='py-2.5 px-4 text-xs'>{movement.user_full_name || 'Sistema'}</td>
                      <td className={`py-2.5 px-4 text-right font-mono font-medium ${isVoided ? '' : (isIncome ? 'text-[#107c10] dark:text-[#54b054]' : 'text-[#d13438] dark:text-[#e35c60]')}`}>
                        {isIncome ? '+' : '-'} ₲{formatCurrency(movement.amount)}
                      </td>
                      <td className='py-2.5 px-4 text-right font-mono text-xs'>
                        ₲{formatCurrency(movement.running_balance || 0)}
                      </td>
                      <td className='py-2.5 px-4 text-center'>
                        {!isVoided && (
                          <button
                            onClick={() => setVoidDialog({ isOpen: true, movement, reason: '', isSubmitting: false })}
                            className='w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-[#d13438] hover:bg-[#d13438]/10 transition-colors opacity-0 group-hover:opacity-100'
                            title='Anular Movimiento'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Movement Dialog */}
      <Dialog open={isNewMovementOpen} onOpenChange={setIsNewMovementOpen}>
        <DialogContent className='max-w-md p-0 overflow-hidden border-slate-200 dark:border-[#3b3a39] bg-white dark:bg-[#252423] gap-0 rounded-lg shadow-xl font-sans'>
          <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-[#3b3a39] bg-slate-50/50 dark:bg-[#201f1e]">
            <DialogTitle className="text-base font-semibold">Registrar movimiento manual</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Agregue fondos o registre egresos directamente en la caja.</DialogDescription>
          </DialogHeader>

          <div className='p-6 space-y-4'>
            <div className='flex p-1 bg-slate-100 dark:bg-[#323130] rounded-md'>
              <button 
                onClick={() => setNewMovementForm(prev => ({ ...prev, movement_type: 'INCOME', concept: '' }))}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-colors ${newMovementForm.movement_type === 'INCOME' ? 'bg-white dark:bg-[#252423] text-[#323130] dark:text-[#f3f2f1] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Ingreso
              </button>
              <button 
                onClick={() => setNewMovementForm(prev => ({ ...prev, movement_type: 'EXPENSE', concept: '' }))}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-colors ${newMovementForm.movement_type === 'EXPENSE' ? 'bg-white dark:bg-[#252423] text-[#323130] dark:text-[#f3f2f1] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Egreso
              </button>
            </div>

            <div className='space-y-1.5'>
              <Label className="text-xs font-semibold text-slate-700 dark:text-[#e1dfdd]">Concepto de operación *</Label>
              <Select value={newMovementForm.concept} onValueChange={value => handleNewMovementChange('concept', value)}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Seleccione un motivo..." />
                </SelectTrigger>
                <SelectContent className='rounded-md shadow-lg border-slate-200 dark:border-[#3b3a39]'>
                  {concepts[newMovementForm.movement_type].map(concept => (
                    <SelectItem key={concept.id} value={concept.id} className="text-sm">
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label className="text-xs font-semibold text-slate-700 dark:text-[#e1dfdd]">Monto (₲) *</Label>
              <Input
                type='text'
                inputMode='numeric'
                value={formatNumber(newMovementForm.amount)}
                onChange={e => handleNewMovementChange('amount', e.target.value)}
                placeholder='0'
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className='space-y-1.5'>
              <Label className="text-xs font-semibold text-slate-700 dark:text-[#e1dfdd]">Notas adicionales</Label>
              <Textarea
                value={newMovementForm.notes}
                onChange={e => handleNewMovementChange('notes', e.target.value)}
                placeholder="Referencia de factura, cliente o detalle..."
                className='min-h-[80px] resize-none px-3 py-2 text-sm rounded-md border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] focus-visible:ring-1 focus-visible:ring-[#0f6cbd]'
              />
            </div>
          </div>

          <DialogFooter className='px-6 py-4 border-t border-slate-200 dark:border-[#3b3a39] bg-slate-50/50 dark:bg-[#201f1e] flex gap-2 sm:justify-end'>
            <Button variant='ghost' onClick={() => setIsNewMovementOpen(false)} className='h-8 text-xs px-4 text-slate-600 hover:bg-slate-200 dark:hover:bg-[#323130]'>
              Cancelar
            </Button>
            <Button onClick={handleSubmitNewMovement} disabled={isSubmitting} className='h-8 px-4 text-xs font-medium rounded-md bg-[#0f6cbd] hover:bg-[#115ea5] text-white shadow-sm border-transparent'>
              {isSubmitting ? <RefreshCw className="animate-spin w-3 h-3 mr-1.5" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Movement Dialog */}
      <Dialog open={voidDialog.isOpen} onOpenChange={isOpen => !isOpen && setVoidDialog(prev => ({ ...prev, isOpen }))}>
        <DialogContent className='max-w-md p-0 overflow-hidden border-slate-200 dark:border-[#3b3a39] bg-white dark:bg-[#252423] gap-0 rounded-lg shadow-xl font-sans'>
          <DialogHeader className="px-6 py-4 border-b border-[#fde7e9] dark:border-[#d13438]/20 bg-[#fdf3f4] dark:bg-[#d13438]/10">
            <DialogTitle className="text-base font-semibold text-[#d13438]">Anular movimiento</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-[#a19f9d]">Esta acción es irreversible y revertirá el saldo.</DialogDescription>
          </DialogHeader>

          <div className='p-6 space-y-4'>
            {voidDialog.movement && (
              <div className='p-3 bg-slate-50 dark:bg-[#323130] rounded-md border border-slate-200 dark:border-[#484644] text-sm'>
                <p className='font-semibold'>{voidDialog.movement.concept}</p>
                <p className='font-mono mt-1 text-[#d13438]'>₲{formatCurrency(voidDialog.movement.amount)}</p>
              </div>
            )}
            <div className='space-y-1.5'>
              <Label className="text-xs font-semibold text-slate-700 dark:text-[#e1dfdd]">Motivo de la anulación *</Label>
              <Input
                value={voidDialog.reason}
                onChange={e => setVoidDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ej: Error de tipeo, devolución..."
                className={inputClass}
              />
              <p className='text-[10px] text-slate-500'>Se requieren al menos 5 caracteres.</p>
            </div>
          </div>

          <DialogFooter className='px-6 py-4 border-t border-slate-200 dark:border-[#3b3a39] bg-slate-50/50 dark:bg-[#201f1e] flex gap-2 sm:justify-end'>
            <Button variant='ghost' onClick={() => setVoidDialog({ isOpen: false, movement: null, reason: '', isSubmitting: false })} className='h-8 text-xs px-4 text-slate-600 hover:bg-slate-200 dark:hover:bg-[#323130]'>
              Cancelar
            </Button>
            <Button variant='destructive' onClick={handleVoidMovement} disabled={voidDialog.isSubmitting || voidDialog.reason.length < 5} className='h-8 px-4 text-xs font-medium rounded-md bg-[#d13438] hover:bg-[#a4262c] text-white shadow-sm border-transparent'>
              {voidDialog.isSubmitting ? <RefreshCw className="animate-spin w-3 h-3 mr-1.5" /> : null}
              Confirmar anulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashMovements;
