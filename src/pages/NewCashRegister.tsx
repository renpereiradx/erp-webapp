import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useBranch } from '@/contexts/BranchContext';
import { useCashRegisterSession } from '@/features/cash-register/hooks/useCashRegisterSession';
import useDashboardStore from '@/store/useDashboardStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';
import { Label } from '@/components/ui/label';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Wallet, 
  MapPin, 
  History,
  Clock,
  RefreshCw
} from 'lucide-react';
import { validateOpenForm, validateCloseForm } from '@/domain/cash-register/validators';
import { formatCurrency, calculateNetDifference } from '@/domain/cash-register/calculations';

interface OpenForm {
  name: string;
  location: string;
  openingDate: string;
  initialBalance: string;
  openingNotes: string;
}

interface CloseForm {
  closingDate: string;
  finalBalance: string;
  closingNotes: string;
}

const NewCashRegister: React.FC = () => {
  const { t } = useI18n();
  const { fetchDashboardData } = useDashboardStore();
  const { addToast, toasts, removeToast } = useToast();
  const { currentBranchId } = useBranch();

  const {
    activeCashRegister,
    isActiveCashRegisterLoading,
    isOpeningCashRegister,
    isClosingCashRegister,
    openCashRegister,
    closeCashRegister,
    refreshActive,
  } = useCashRegisterSession();

  const [activeTab, setActiveTab] = useState<'open' | 'close'>('open');

  const [openForm, setOpenForm] = useState<OpenForm>({
    name: '',
    location: '',
    openingDate: new Date().toISOString().split('T')[0],
    initialBalance: '',
    openingNotes: '',
  });

  const [closeForm, setCloseForm] = useState<CloseForm>({
    closingDate: new Date().toISOString().split('T')[0],
    finalBalance: '',
    closingNotes: '',
  });

  const [formError, setFormError] = useState('');

  // Fluent 2.0 UI tokens
  const cardShadow = 'shadow-[0_2px_4px_rgba(0,0,0,0.04),0_0_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_0_2px_rgba(0,0,0,0.14)]';
  const cardBg = 'bg-white dark:bg-[#252423]';
  const canvasBg = 'bg-[#f3f2f1] dark:bg-[#11100f]';
  const borderColor = 'border-slate-200 dark:border-[#3b3a39]';

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

  const handleAmountChange = (formSetter: React.Dispatch<React.SetStateAction<any>>, field: string, value: string) => {
    const numericValue = parseFormattedNumber(value);
    formSetter((prev: any) => ({ ...prev, [field]: numericValue }));
    setFormError('');
  };

  const handleOpenFormChange = (field: keyof OpenForm, value: string) => {
    setOpenForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleCloseFormChange = (field: keyof CloseForm, value: string) => {
    setCloseForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const balance = parseFloat(openForm.initialBalance);
    const validationError = validateOpenForm(openForm.name, balance);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await openCashRegister({
        name: openForm.name.trim(),
        initial_balance: balance,
        location: openForm.location?.trim() || null,
        notes: openForm.openingNotes?.trim() || null,
      });

      addToast(t('cashRegister.success.opened', 'Caja registradora abierta exitosamente'), 'success');
      if (fetchDashboardData) fetchDashboardData();

      setOpenForm({
        name: '',
        location: '',
        openingDate: new Date().toISOString().split('T')[0],
        initialBalance: '',
        openingNotes: '',
      });

      refreshActive();
    } catch (error: any) {
      setFormError(error.message || 'Error al abrir la caja registradora');
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCashRegister) return setFormError('No hay caja activa');
    
    const balance = parseFloat(closeForm.finalBalance);
    const validationError = validateCloseForm(balance);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      if (!activeCashRegister.id) {
        return setFormError('No se pudo identificar la caja activa para cerrarla');
      }
      
      await closeCashRegister(activeCashRegister.id, {
        final_balance: balance,
        notes: closeForm.closingNotes || null,
      });

      addToast(t('cashRegister.success.closed', 'Caja registradora cerrada exitosamente'), 'success');
      if (fetchDashboardData) fetchDashboardData();

      setCloseForm({
        closingDate: new Date().toISOString().split('T')[0],
        finalBalance: '',
        closingNotes: '',
      });

      setActiveTab('open');
      refreshActive();
    } catch (error: any) {
      setFormError(error.message || 'Error al cerrar la caja registradora');
    }
  };

  const formatTimeOpen = () => {
    if (!activeCashRegister?.opened_at) return null;
    const openedDate = new Date(activeCashRegister.opened_at);
    const now = new Date();
    const diffMs = now.getTime() - openedDate.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
  };

  if (isActiveCashRegisterLoading) {
    return (
      <div className={`min-h-full ${canvasBg} flex items-center justify-center`}>
        <div className='flex items-center gap-2 text-slate-500'>
          <RefreshCw className='animate-spin w-5 h-5' /> Cargando jornada...
        </div>
      </div>
    );
  }

  const difference = (activeCashRegister && closeForm.finalBalance) 
    ? parseFloat(closeForm.finalBalance) - (activeCashRegister.current_balance || activeCashRegister.initial_balance || 0)
    : 0;

  return (
    <div className={`min-h-full ${canvasBg} text-[#323130] dark:text-[#f3f2f1] p-4 md:p-8 font-sans`}>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* HEADER FLUENT */}
      <header className='flex flex-col justify-start mb-6'>
        <h1 className='text-2xl font-semibold leading-tight'>Jornada de caja</h1>
        <p className='text-sm text-slate-500 dark:text-[#a19f9d] mt-1'>
          Control de apertura y cierre de terminales de punto de venta.
        </p>
      </header>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        
        {/* Sidebar: Active Status Card */}
        <div className='lg:col-span-4 flex flex-col gap-6'>
          {activeCashRegister ? (
            <div className={`rounded-lg ${cardBg} border ${borderColor} ${cardShadow} flex flex-col overflow-hidden`}>
              <div className={`px-5 py-4 border-b border-[#107c10]/20 bg-[#dff6dd]/50 dark:bg-[#107c10]/10 flex items-center justify-between`}>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 rounded-full bg-[#107c10]'></div>
                  <span className='text-xs font-semibold text-[#107c10] dark:text-[#54b054]'>
                    Terminal activa
                  </span>
                </div>
                <div className='flex items-center gap-1.5 text-xs text-[#107c10] dark:text-[#54b054] font-medium'>
                  <Clock size={14} /> {formatTimeOpen()}
                </div>
              </div>

              <div className='p-6 flex flex-col gap-6'>
                <div>
                  <p className='text-[11px] text-slate-500 dark:text-[#a19f9d] mb-1'>Identificador</p>
                  <h3 className='text-lg font-semibold leading-tight'>{activeCashRegister.name}</h3>
                </div>

                <div className='p-4 bg-slate-50 dark:bg-[#201f1e] rounded-md border border-slate-200 dark:border-[#3b3a39]'>
                  <p className='text-[11px] text-slate-500 dark:text-[#a19f9d] mb-1'>Saldo en sistema</p>
                  <p className='text-3xl font-semibold font-mono tracking-tight'>
                    ₲{formatCurrency(activeCashRegister.current_balance || 0)}
                  </p>
                </div>

                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-slate-500 dark:text-[#a19f9d]'>
                      <MapPin size={14} />
                      <span className='text-xs'>Ubicación</span>
                    </div>
                    <span className='text-xs font-medium'>{activeCashRegister.location || 'No definida'}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-slate-500 dark:text-[#a19f9d]'>
                      <History size={14} />
                      <span className='text-xs'>Fondo inicial</span>
                    </div>
                    <span className='text-xs font-medium font-mono'>₲{formatCurrency(activeCashRegister.initial_balance || 0)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveTab('close')}
                  className='w-full h-9 bg-[#d13438] hover:bg-[#a4262c] text-white text-sm font-medium rounded-md shadow-sm border-transparent flex justify-center items-center gap-2'
                >
                  <CheckCircle2 size={16} /> Cerrar jornada
                </Button>
              </div>
            </div>
          ) : (
            <div className={`rounded-lg ${cardBg} border ${borderColor} ${cardShadow} p-8 flex flex-col items-center justify-center text-center`}>
              <Info className='w-10 h-10 text-slate-300 dark:text-slate-600 mb-4' />
              <h3 className='text-base font-semibold mb-2'>Sin terminal activa</h3>
              <p className='text-xs text-slate-500 dark:text-[#a19f9d]'>
                No hay una jornada abierta. Inicie la apertura para registrar movimientos.
              </p>
            </div>
          )}
        </div>

        {/* Main Forms: Tabs Layout */}
        <div className='lg:col-span-8'>
          <div className={`rounded-lg ${cardBg} border ${borderColor} ${cardShadow} flex flex-col overflow-hidden`}>
            
            {/* Tabs Header */}
            <div className={`flex border-b ${borderColor} px-2 pt-2 bg-slate-50/50 dark:bg-[#201f1e]`}>
              <button
                onClick={() => setActiveTab('open')}
                className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'open'
                    ? 'border-[#0f6cbd] text-[#0f6cbd] dark:text-[#4facfe] bg-white dark:bg-[#252423] rounded-t-md'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Calculator size={16} /> Apertura de caja
              </button>
              <button
                onClick={() => setActiveTab('close')}
                className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'close'
                    ? 'border-[#0f6cbd] text-[#0f6cbd] dark:text-[#4facfe] bg-white dark:bg-[#252423] rounded-t-md'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <CheckCircle2 size={16} /> Cierre de caja
              </button>
            </div>

            {/* Tab Content */}
            <div className='p-6 md:p-8'>
              {activeTab === 'open' ? (
                <div className='animate-in fade-in duration-300'>
                  {activeCashRegister && (
                    <div className='mb-6 p-4 bg-[#fff4ce] dark:bg-[#fff4ce]/10 border border-[#fde7e9] dark:border-[#fde7e9]/10 rounded-md flex gap-3'>
                      <AlertCircle className='w-5 h-5 text-[#9d5d00] dark:text-[#fce100] shrink-0' />
                      <div>
                        <p className='text-sm font-semibold text-[#9d5d00] dark:text-[#fce100]'>Restricción de operación</p>
                        <p className='text-xs text-[#794600] dark:text-[#d29200] mt-1'>
                          Ya existe una sesión activa para este terminal. Debe finalizar la jornada actual antes de iniciar una nueva apertura de fondos.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleOpenSubmit} className='flex flex-col gap-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='md:col-span-2 space-y-1.5'>
                        <Label className='text-sm font-semibold text-slate-700 dark:text-[#e1dfdd]'>Nombre identificador *</Label>
                        <Input
                          value={openForm.name}
                          onChange={e => handleOpenFormChange('name', e.target.value)}
                          placeholder='Ej: CAJA-01 Turno Mañana'
                          className={`h-9 rounded-md border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] text-sm focus-visible:ring-1 focus-visible:ring-[#0f6cbd] ${activeCashRegister ? 'opacity-60' : ''}`}
                          disabled={!!activeCashRegister}
                          required
                        />
                      </div>

                      <div className='space-y-1.5'>
                        <Label className='text-sm font-semibold text-slate-700 dark:text-[#e1dfdd]'>Ubicación de terminal</Label>
                        <Input
                          value={openForm.location}
                          onChange={e => handleOpenFormChange('location', e.target.value)}
                          placeholder='Punto de Venta Principal'
                          className={`h-9 rounded-md border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] text-sm focus-visible:ring-1 focus-visible:ring-[#0f6cbd] ${activeCashRegister ? 'opacity-60' : ''}`}
                          disabled={!!activeCashRegister}
                        />
                      </div>

                      <div className='space-y-1.5'>
                        <Label className='text-sm font-semibold text-slate-700 dark:text-[#e1dfdd]'>Fecha efectiva</Label>
                        <Input
                          type='date'
                          value={openForm.openingDate}
                          onChange={e => handleOpenFormChange('openingDate', e.target.value)}
                          className={`h-9 rounded-md border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] text-sm focus-visible:ring-1 focus-visible:ring-[#0f6cbd] ${activeCashRegister ? 'opacity-60' : ''}`}
                          disabled={!!activeCashRegister}
                        />
                      </div>

                      <div className='md:col-span-2 space-y-1.5'>
                        <Label className='text-sm font-semibold text-slate-700 dark:text-[#e1dfdd]'>Fondo inicial de maniobra *</Label>
                        <div className='relative'>
                          <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-semibold'>₲</span>
                          <Input
                            type='text'
                            inputMode='numeric'
                            value={formatNumber(openForm.initialBalance)}
                            onChange={e => handleAmountChange(setOpenForm, 'initialBalance', e.target.value)}
                            placeholder='0'
                            className={`h-10 pl-8 text-base font-mono font-medium border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] rounded-md focus-visible:ring-1 focus-visible:ring-[#0f6cbd] ${activeCashRegister ? 'opacity-60' : ''}`}
                            disabled={!!activeCashRegister}
                            required
                          />
                        </div>
                      </div>

                      <div className='md:col-span-2 space-y-1.5'>
                        <Label className='text-sm font-semibold text-slate-700 dark:text-[#e1dfdd]'>Notas de auditoría</Label>
                        <Textarea
                          value={openForm.openingNotes}
                          onChange={e => handleOpenFormChange('openingNotes', e.target.value)}
                          placeholder="Añada detalles sobre el estado inicial del efectivo o novedades..."
                          className={`min-h-[100px] resize-none rounded-md border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] text-sm focus-visible:ring-1 focus-visible:ring-[#0f6cbd] ${activeCashRegister ? 'opacity-60' : ''}`}
                          disabled={!!activeCashRegister}
                        />
                      </div>
                    </div>

                    {formError && activeTab === 'open' && (
                      <div className='p-3 bg-[#fde7e9] dark:bg-[#fde7e9]/10 border border-[#d13438]/20 rounded-md flex gap-2'>
                        <Info className="text-[#d13438] w-4 h-4 shrink-0 mt-0.5" />
                        <p className='text-xs text-[#a4262c] dark:text-[#e35c60] font-medium'>{formError}</p>
                      </div>
                    )}

                    <div className='flex gap-3 pt-4 border-t border-slate-200 dark:border-[#3b3a39]'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          setOpenForm({ name: '', location: '', openingDate: new Date().toISOString().split('T')[0], initialBalance: '', openingNotes: '' });
                          setFormError('');
                        }}
                        className='h-9 px-6 text-sm font-medium rounded-md bg-white dark:bg-[#323130] border-slate-300 dark:border-[#484644] hover:bg-slate-50 dark:hover:bg-[#3b3a39]'
                      >
                        Limpiar
                      </Button>
                      <Button
                        type='submit'
                        disabled={isOpeningCashRegister || !!activeCashRegister}
                        className='h-9 px-6 text-sm font-medium rounded-md bg-[#0f6cbd] hover:bg-[#115ea5] text-white shadow-sm transition-colors border-transparent'
                      >
                        {isOpeningCashRegister ? <RefreshCw className='animate-spin w-4 h-4 mr-2' /> : null}
                        {isOpeningCashRegister ? 'Abriendo...' : 'Abrir caja'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className='animate-in fade-in duration-300'>
                  {activeCashRegister ? (
                    <form onSubmit={handleCloseSubmit} className='flex flex-col gap-6'>
                      <div className='bg-[#e1dfdd]/30 dark:bg-[#323130] p-5 rounded-md border border-slate-200 dark:border-[#3b3a39] flex flex-col sm:flex-row justify-between gap-4'>
                        <div>
                          <p className='text-sm font-semibold'>Arqueo requerido</p>
                          <p className='text-xs text-slate-500 dark:text-[#a19f9d] mt-1'>
                            Ingrese el efectivo total contado físicamente en {activeCashRegister.name}.
                          </p>
                        </div>
                        <div className='text-left sm:text-right'>
                          <p className='text-[11px] text-slate-500 dark:text-[#a19f9d] mb-0.5'>Balance en sistema</p>
                          <p className='text-lg font-mono font-semibold'>₲{formatCurrency(activeCashRegister.current_balance || 0)}</p>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='md:col-span-2 space-y-1.5'>
                          <Label className='text-sm font-semibold text-slate-700 dark:text-[#e1dfdd]'>Balance físico final *</Label>
                          <div className='relative'>
                            <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-semibold'>₲</span>
                            <Input
                              type='text'
                              inputMode='numeric'
                              value={formatNumber(closeForm.finalBalance)}
                              onChange={e => handleAmountChange(setCloseForm, 'finalBalance', e.target.value)}
                              placeholder='0'
                              className='h-12 pl-8 text-xl font-mono font-medium border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] rounded-md focus-visible:ring-1 focus-visible:ring-[#0f6cbd]'
                              required
                            />
                          </div>
                        </div>

                        <div className='space-y-1.5'>
                          <Label className='text-sm font-semibold text-slate-700 dark:text-[#e1dfdd]'>Fecha de cierre</Label>
                          <Input
                            type='date'
                            value={closeForm.closingDate}
                            onChange={e => handleCloseFormChange('closingDate', e.target.value)}
                            className='h-9 rounded-md border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] text-sm focus-visible:ring-1 focus-visible:ring-[#0f6cbd]'
                          />
                        </div>

                        {closeForm.finalBalance && (
                          <div className='md:col-span-2 mt-2'>
                            <div className={`rounded-md p-4 flex items-center justify-between border ${
                              difference === 0 
                                ? 'bg-[#dff6dd]/50 border-[#107c10]/20 dark:bg-[#107c10]/10' 
                                : 'bg-[#fde7e9]/50 border-[#d13438]/20 dark:bg-[#d13438]/10'
                            }`}>
                              <div className='flex items-center gap-4'>
                                <div className={`w-10 h-10 rounded flex items-center justify-center ${
                                  difference === 0 ? 'bg-[#107c10] text-white' : 'bg-[#d13438] text-white'
                                }`}>
                                  {difference === 0 ? <CheckCircle2 className='w-5 h-5' /> : <AlertCircle className='w-5 h-5' />}
                                </div>
                                <div>
                                  <p className={`text-[11px] font-semibold ${difference === 0 ? 'text-[#107c10] dark:text-[#54b054]' : 'text-[#a4262c] dark:text-[#e35c60]'}`}>
                                    Diferencia de auditoría
                                  </p>
                                  <p className={`text-xl font-mono font-semibold ${difference === 0 ? 'text-[#107c10] dark:text-[#54b054]' : 'text-[#a4262c] dark:text-[#e35c60]'}`}>
                                    {difference > 0 ? '+' : ''}₲{formatCurrency(difference)}
                                  </p>
                                </div>
                              </div>
                              <div className='hidden sm:block'>
                                <span className={`text-[11px] px-2 py-1 rounded-sm font-semibold ${
                                  difference === 0 ? 'bg-[#107c10]/10 text-[#107c10] dark:text-[#54b054]' : 'bg-[#d13438]/10 text-[#d13438] dark:text-[#e35c60]'
                                }`}>
                                  {difference === 0 ? 'Balance cuadrado' : 'Requiere justificación'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className='md:col-span-2 space-y-1.5'>
                          <Label className='text-sm font-semibold text-slate-700 dark:text-[#e1dfdd]'>Observaciones de cierre</Label>
                          <Textarea
                            value={closeForm.closingNotes}
                            onChange={e => handleCloseFormChange('closingNotes', e.target.value)}
                            placeholder="Describa el motivo de cualquier discrepancia detectada o novedades durante el turno..."
                            className='min-h-[80px] resize-none rounded-md border-slate-300 dark:border-[#484644] bg-white dark:bg-[#323130] text-sm focus-visible:ring-1 focus-visible:ring-[#0f6cbd]'
                          />
                        </div>
                      </div>

                      {formError && activeTab === 'close' && (
                        <div className='p-3 bg-[#fde7e9] dark:bg-[#fde7e9]/10 border border-[#d13438]/20 rounded-md flex gap-2'>
                          <Info className="text-[#d13438] w-4 h-4 shrink-0 mt-0.5" />
                          <p className='text-xs text-[#a4262c] dark:text-[#e35c60] font-medium'>{formError}</p>
                        </div>
                      )}

                      <div className='flex gap-3 pt-4 border-t border-slate-200 dark:border-[#3b3a39]'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => {
                            setCloseForm({ closingDate: new Date().toISOString().split('T')[0], finalBalance: '', closingNotes: '' });
                            setFormError('');
                            setActiveTab('open');
                          }}
                          className='h-9 px-6 text-sm font-medium rounded-md bg-white dark:bg-[#323130] border-slate-300 dark:border-[#484644] hover:bg-slate-50 dark:hover:bg-[#3b3a39]'
                        >
                          Cancelar
                        </Button>
                        <Button
                          type='submit'
                          disabled={isClosingCashRegister}
                          className='h-9 px-6 bg-[#d13438] hover:bg-[#a4262c] text-white text-sm font-medium rounded-md shadow-sm border-transparent'
                        >
                          {isClosingCashRegister ? <RefreshCw className='animate-spin w-4 h-4 mr-2' /> : null}
                          {isClosingCashRegister ? 'Cerrando...' : 'Finalizar y cerrar caja'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className='py-20 flex flex-col items-center justify-center text-center'>
                      <div className='w-16 h-16 bg-slate-50 dark:bg-[#323130] rounded-lg flex items-center justify-center mb-4'>
                        <Wallet className='w-8 h-8 text-slate-400 dark:text-[#a19f9d]' />
                      </div>
                      <h3 className='text-lg font-semibold mb-2'>No hay terminal activa</h3>
                      <p className='text-sm text-slate-500 dark:text-[#a19f9d] max-w-sm mb-6'>
                        Debe existir una jornada operativa abierta para poder realizar el cierre.
                      </p>
                      <Button 
                        onClick={() => setActiveTab('open')} 
                        className='h-9 px-6 text-sm font-medium rounded-md bg-[#0f6cbd] hover:bg-[#115ea5] text-white shadow-sm border-transparent'
                      >
                        Ir a Apertura
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCashRegister;
