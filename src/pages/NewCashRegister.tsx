/**
 * Cash Register Management Page - v3.0
 * Gestión de Cajas Registradoras (Apertura y Cierre)
 * 
 * Migrated to TypeScript & Fluent Design System 2.0
 */

import React, { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { useCashRegisterStore, CashRegister } from '@/store/useCashRegisterStore'
import useDashboardStore from '@/store/useDashboardStore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import DataState from '@/components/ui/DataState'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'
import { Label } from '@/components/ui/label'
import { 
  Calculate, 
  CheckCircle, 
  Warning, 
  Info, 
  Storefront, 
  CalendarToday, 
  Payments, 
  Description, 
  Schedule, 
  Place, 
  TrendingUp, 
  TrendingDown,
  History,
  Clock
} from '@mui/icons-material'

interface OpenForm {
  name: string;
  location: string;
  openingDate: string;
  initialBalance: string;
  openingNotes: string;
}

interface CloseForm {
  cashier: string;
  register: string;
  closingDate: string;
  finalBalance: string;
  closingNotes: string;
}

const NewCashRegister: React.FC = () => {
  const { t } = useI18n()
  const { fetchDashboardData } = useDashboardStore()
  const { addToast, toasts, removeToast } = useToast()

  const {
    activeCashRegister,
    isActiveCashRegisterLoading,
    activeCashRegisterError,
    isOpeningCashRegister,
    isClosingCashRegister,
    openCashRegister,
    closeCashRegister,
    getActiveCashRegister,
  } = useCashRegisterStore()

  const [activeTab, setActiveTab] = useState<'open' | 'close'>('open')

  const [openForm, setOpenForm] = useState<OpenForm>({
    name: '',
    location: '',
    openingDate: new Date().toISOString().split('T')[0],
    initialBalance: '',
    openingNotes: '',
  })

  const [closeForm, setCloseForm] = useState<CloseForm>({
    cashier: '',
    register: '',
    closingDate: new Date().toISOString().split('T')[0],
    finalBalance: '',
    closingNotes: '',
  })

  const [formError, setFormError] = useState('')

  useEffect(() => {
    getActiveCashRegister()
  }, [getActiveCashRegister])

  const formatNumber = (value: string) => {
    if (!value) return ''
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    return Number(numericValue).toLocaleString('es-PY')
  }

  const parseFormattedNumber = (formattedValue: string) => {
    if (!formattedValue) return ''
    return formattedValue.replace(/\./g, '').replace(/,/g, '')
  }

  const handleAmountChange = (formSetter: React.Dispatch<React.SetStateAction<any>>, field: string, value: string) => {
    const numericValue = parseFormattedNumber(value)
    formSetter((prev: any) => ({ ...prev, [field]: numericValue }))
    setFormError('')
  }

  const handleOpenFormChange = (field: keyof OpenForm, value: string) => {
    setOpenForm(prev => ({ ...prev, [field]: value }))
    setFormError('')
  }

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!openForm.name.trim()) return setFormError('Debe ingresar un nombre para la caja')
    const balance = parseFloat(openForm.initialBalance)
    if (isNaN(balance) || balance < 0) return setFormError('El saldo inicial no es válido')

    try {
      await openCashRegister({
        name: openForm.name.trim(),
        initial_balance: balance,
        location: openForm.location?.trim() || null,
        description: openForm.openingNotes?.trim() || null,
      })

      addToast(t('cashRegister.success.opened', 'Caja registradora abierta exitosamente'), 'success')
      if (fetchDashboardData) fetchDashboardData()

      setOpenForm({
        name: '',
        location: '',
        openingDate: new Date().toISOString().split('T')[0],
        initialBalance: '',
        openingNotes: '',
      })

      await getActiveCashRegister()
    } catch (error: any) {
      setFormError(error.message || 'Error al abrir la caja registradora')
    }
  }

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCashRegister) return setFormError('No hay caja activa')
    
    const balance = parseFloat(closeForm.finalBalance)
    if (isNaN(balance) || balance < 0) return setFormError('El saldo ingresado no es válido')

    try {
      await closeCashRegister(activeCashRegister.id, {
        final_balance: balance,
        notes: closeForm.closingNotes || null,
      })

      addToast(t('cashRegister.success.closed', 'Caja registradora cerrada exitosamente'), 'success')
      if (fetchDashboardData) fetchDashboardData()

      setCloseForm({
        cashier: '',
        register: '',
        closingDate: new Date().toISOString().split('T')[0],
        finalBalance: '',
        closingNotes: '',
      })

      setActiveTab('open')
      await getActiveCashRegister()
    } catch (error: any) {
      setFormError(error.message || 'Error al cerrar la caja registradora')
    }
  }

  const calculateDifference = () => {
    if (!activeCashRegister || !closeForm.finalBalance) return 0
    const finalBalance = parseFloat(closeForm.finalBalance)
    const currentBalance = activeCashRegister.current_balance || activeCashRegister.initial_balance || 0
    return finalBalance - currentBalance
  }

  const formatTimeOpen = () => {
    if (!activeCashRegister?.opened_at) return null
    const openedDate = new Date(activeCashRegister.opened_at)
    const now = new Date()
    const diffMs = now.getTime() - openedDate.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`
  }

  if (isActiveCashRegisterLoading) return <div className='p-12'><DataState variant='loading' /></div>

  return (
    <div className='flex flex-col gap-10 animate-in fade-in duration-500 font-display bg-background-light dark:bg-background-dark min-h-full'>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Header Section */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div className='flex items-center gap-5'>
          <div className='size-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-fluent-8'>
            <Calculate sx={{ fontSize: 32 }} />
          </div>
          <div>
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>
              Jornada de Caja
            </h1>
            <p className='text-text-secondary text-sm font-medium mt-1.5'>
              Control de apertura y cierre de terminales de punto de venta
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-12 gap-10 items-start'>
        
        {/* Sidebar: Active Status Card */}
        <div className='xl:col-span-4 space-y-8'>
          {activeCashRegister ? (
            <Card className='border-none rounded-3xl shadow-fluent-16 bg-white dark:bg-slate-900 overflow-hidden sticky top-24'>
              <div className='bg-green-50 dark:bg-green-900/20 px-8 py-6 border-b border-green-100 dark:border-green-800/30'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2.5'>
                    <div className='size-3 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,124,16,0.5)]' />
                    <span className='text-[11px] font-black uppercase tracking-[0.2em] text-success'>
                      Terminal Activa
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-[10px] font-black text-text-secondary bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-full border border-border-subtle'>
                    <Schedule sx={{ fontSize: 14 }} />
                    {formatTimeOpen()}
                  </div>
                </div>
              </div>

              <div className='p-8 space-y-8'>
                <div className='space-y-1'>
                  <p className='text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Identificador</p>
                  <h3 className='text-2xl font-black tracking-tighter uppercase text-text-main leading-tight'>{activeCashRegister.name}</h3>
                </div>

                <div className='p-6 bg-primary text-white rounded-2xl shadow-fluent-8 relative overflow-hidden group'>
                  <div className='absolute -right-4 -bottom-4 size-20 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700'></div>
                  <p className='text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2 relative z-10'>Saldo en Sistema</p>
                  <p className='text-4xl font-black font-mono tracking-tighter tabular-nums relative z-10'>
                    ₲{(activeCashRegister.current_balance || 0).toLocaleString('es-PY')}
                  </p>
                </div>

                <div className='grid grid-cols-1 gap-4'>
                  <div className='flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border-subtle/50 group hover:bg-white dark:hover:bg-slate-800 transition-all'>
                    <div className='flex items-center gap-3'>
                      <Place className='text-slate-400 group-hover:text-primary transition-colors' sx={{ fontSize: 18 }} />
                      <span className='text-[10px] font-black uppercase text-text-secondary'>Ubicación</span>
                    </div>
                    <span className='text-xs font-black text-text-main'>{activeCashRegister.location || 'No definida'}</span>
                  </div>
                  <div className='flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border-subtle/50 group hover:bg-white dark:hover:bg-slate-800 transition-all'>
                    <div className='flex items-center gap-3'>
                      <History className='text-slate-400 group-hover:text-success transition-colors' sx={{ fontSize: 18 }} />
                      <span className='text-[10px] font-black uppercase text-text-secondary'>Fondo Inicial</span>
                    </div>
                    <span className='text-xs font-black font-mono text-text-main'>₲{(activeCashRegister.initial_balance || 0).toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveTab('close')}
                  className='w-full h-14 bg-error hover:bg-error/90 text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-fluent-8 transition-all active:scale-95 flex items-center justify-center gap-2'
                >
                  <CheckCircle sx={{ fontSize: 18 }} />
                  Cerrar Jornada Operativa
                </Button>
              </div>
            </Card>
          ) : (
            <Card className='border-none rounded-3xl shadow-fluent-2 bg-slate-50 dark:bg-slate-900/50 p-8 border-dashed border-2 border-border-subtle'>
              <div className='text-center space-y-4'>
                <Info className='text-slate-300' sx={{ fontSize: 40 }} />
                <p className='text-xs font-bold uppercase tracking-widest text-slate-400'>Esperando apertura de terminal</p>
              </div>
            </Card>
          )}
        </div>

        {/* Main Forms: Tabs Layout */}
        <div className={activeCashRegister ? 'xl:col-span-8' : 'xl:col-span-12'}>
          <Card className='border-none rounded-[2rem] shadow-fluent-2 bg-white dark:bg-slate-900 overflow-hidden'>
            <div className='flex bg-slate-50/80 dark:bg-slate-800/50 p-2 gap-2 border-b border-border-subtle'>
              <button
                onClick={() => setActiveTab('open')}
                className={`flex items-center justify-center gap-3 flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all ${
                  activeTab === 'open'
                    ? 'bg-white dark:bg-slate-900 text-primary shadow-fluent-2'
                    : 'text-text-secondary hover:text-text-main hover:bg-white/50'
                }`}
              >
                <Calculate sx={{ fontSize: 20 }} />
                Apertura de Caja
              </button>
              <button
                onClick={() => setActiveTab('close')}
                className={`flex items-center justify-center gap-3 flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-all ${
                  activeTab === 'close'
                    ? 'bg-white dark:bg-slate-900 text-primary shadow-fluent-2'
                    : 'text-text-secondary hover:text-text-main hover:bg-white/50'
                }`}
              >
                <CheckCircle sx={{ fontSize: 20 }} />
                Cierre de Caja
              </button>
            </div>

            <div className='p-10'>
              {activeTab === 'open' ? (
                <div className='space-y-10 animate-in slide-in-from-left-4 duration-300'>
                  {activeCashRegister && (
                    <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 flex gap-5'>
                      <Warning className="text-amber-600 shrink-0" sx={{ fontSize: 28 }} />
                      <div>
                        <p className='font-black uppercase tracking-tight text-amber-800 text-sm'>Restricción de Operación</p>
                        <p className='text-amber-700 text-xs mt-1 font-medium leading-relaxed'>
                          Ya existe una sesión activa para este terminal. Debe finalizar la jornada actual antes de iniciar una nueva apertura de fondos.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleOpenSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                    <div className='md:col-span-2 space-y-3'>
                      <Label className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Nombre Identificador *</Label>
                      <Input
                        value={openForm.name}
                        onChange={e => handleOpenFormChange('name', e.target.value)}
                        placeholder='Ej: CAJA-01 Turno Mañana'
                        className='h-14 rounded-2xl border-border-subtle font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/5 bg-slate-50 dark:bg-slate-950'
                        disabled={!!activeCashRegister}
                        required
                      />
                    </div>

                    <div className='space-y-3'>
                      <Label className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Ubicación de Terminal</Label>
                      <Input
                        value={openForm.location}
                        onChange={e => handleOpenFormChange('location', e.target.value)}
                        placeholder='Punto de Venta Principal'
                        className='h-14 rounded-2xl border-border-subtle font-bold focus:ring-4 focus:ring-primary/5 bg-slate-50 dark:bg-slate-950'
                        disabled={!!activeCashRegister}
                      />
                    </div>

                    <div className='space-y-3'>
                      <Label className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Fecha Efectiva</Label>
                      <Input
                        type='date'
                        value={openForm.openingDate}
                        onChange={e => handleOpenFormChange('openingDate', e.target.value)}
                        className='h-14 rounded-2xl border-border-subtle font-mono font-bold focus:ring-4 focus:ring-primary/5 bg-slate-50 dark:bg-slate-950'
                        disabled={!!activeCashRegister}
                      />
                    </div>

                    <div className='md:col-span-2 space-y-3'>
                      <Label className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Fondo de Maniobra (Sencillo) *</Label>
                      <div className='relative'>
                        <span className='absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400 font-black text-xl'>₲</span>
                        <Input
                          type='text'
                          inputMode='numeric'
                          value={formatNumber(openForm.initialBalance)}
                          onChange={e => handleAmountChange(setOpenForm, 'initialBalance', e.target.value)}
                          placeholder='0'
                          className='h-16 pl-12 text-2xl font-mono font-black border-border-subtle rounded-2xl tabular-nums bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/5'
                          disabled={!!activeCashRegister}
                          required
                        />
                      </div>
                    </div>

                    <div className='md:col-span-2 space-y-3'>
                      <Label className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Notas de Auditoría</Label>
                      <Textarea
                        value={openForm.openingNotes}
                        onChange={e => handleOpenFormChange('openingNotes', e.target.value)}
                        placeholder="Añada detalles sobre el estado inicial del efectivo o novedades..."
                        className='resize-none rounded-3xl border-border-subtle bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/5 p-6 font-medium'
                        disabled={!!activeCashRegister}
                        rows={4}
                      />
                    </div>

                    {formError && activeTab === 'open' && (
                      <div className='md:col-span-2 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-in shake-in duration-300'>
                        <Info className="text-red-500" sx={{ fontSize: 20 }} />
                        <p className='text-xs text-red-600 font-black uppercase tracking-widest'>{formError}</p>
                      </div>
                    )}

                    <div className='md:col-span-2 flex gap-4 pt-4'>
                      <Button
                        type='submit'
                        disabled={isOpeningCashRegister || !!activeCashRegister}
                        className='flex-1 h-14 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-fluent-8 transition-all active:scale-95'
                      >
                        {isOpeningCashRegister ? <Refresh className='animate-spin mr-2' sx={{ fontSize: 18 }} /> : null}
                        {isOpeningCashRegister ? 'Procesando...' : 'Iniciar Apertura de Caja'}
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          setOpenForm({ name: '', location: '', openingDate: new Date().toISOString().split('T')[0], initialBalance: '', openingNotes: '' })
                          setFormError('')
                        }}
                        className='px-10 h-14 border-border-subtle font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-slate-50 transition-all'
                      >
                        Limpiar
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className='space-y-10 animate-in slide-in-from-right-4 duration-300'>
                  {activeCashRegister ? (
                    <form onSubmit={handleCloseSubmit} className='space-y-10'>
                      <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6'>
                        <div className='flex gap-5'>
                          <Info className="text-blue-600 shrink-0" sx={{ fontSize: 28 }} />
                          <div>
                            <p className='font-black uppercase tracking-tight text-blue-800 text-sm'>Estado de Arqueo Requerido</p>
                            <p className='text-blue-700 text-xs mt-1 font-medium leading-relaxed'>
                              Ingrese el efectivo total contado físicamente en la terminal <span className='font-black'>{activeCashRegister.name}</span>. El sistema calculará la discrepancia automáticamente.
                            </p>
                          </div>
                        </div>
                        <div className='text-right flex-shrink-0'>
                          <p className='text-[9px] font-black uppercase text-blue-400 tracking-widest mb-1'>Balance de Sistema</p>
                          <p className='text-2xl font-mono font-black text-blue-800 tabular-nums tracking-tighter'>₲{(activeCashRegister.current_balance || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                        <div className='space-y-3'>
                          <Label className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Balance Físico Final *</Label>
                          <div className='relative'>
                            <span className='absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400 font-black text-xl'>₲</span>
                            <Input
                              type='text'
                              inputMode='numeric'
                              value={formatNumber(closeForm.finalBalance)}
                              onChange={e => handleAmountChange(setCloseForm, 'finalBalance', e.target.value)}
                              placeholder='0'
                              className='h-16 pl-12 text-3xl font-mono font-black border-border-subtle rounded-2xl tabular-nums bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/5'
                              required
                            />
                          </div>
                        </div>

                        <div className='space-y-3'>
                          <Label className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Fecha de Cierre</Label>
                          <Input
                            type='date'
                            value={closeForm.closingDate}
                            onChange={e => handleCloseFormChange('closingDate', e.target.value)}
                            className='h-16 rounded-2xl border-border-subtle font-mono font-bold focus:ring-4 focus:ring-primary/5 bg-slate-50 dark:bg-slate-950'
                          />
                        </div>

                        {closeForm.finalBalance && (
                          <div className='md:col-span-2'>
                            <div className={`rounded-2xl p-8 flex items-center justify-between border-2 animate-in zoom-in-95 duration-300 ${
                              calculateDifference() === 0 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/10' 
                                : 'bg-red-50 border-red-200 dark:bg-red-900/10'
                            }`}>
                              <div className='flex items-center gap-6'>
                                <div className={`size-16 rounded-2xl flex items-center justify-center shadow-sm ${
                                  calculateDifference() === 0 ? 'bg-success text-white' : 'bg-error text-white'
                                }`}>
                                  {calculateDifference() === 0 ? <CheckCircle sx={{ fontSize: 32 }} /> : (calculateDifference() > 0 ? <TrendingUp sx={{ fontSize: 32 }} /> : <TrendingDown sx={{ fontSize: 32 }} />)}
                                </div>
                                <div>
                                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                    calculateDifference() === 0 ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    Discrepancia de Auditoría
                                  </p>
                                  <p className={`text-4xl font-mono font-black tabular-nums tracking-tighter ${
                                    calculateDifference() === 0 ? 'text-green-800' : 'text-red-800'
                                  }`}>
                                    {calculateDifference() > 0 ? '+' : ''}₲{calculateDifference().toLocaleString('es-PY')}
                                  </p>
                                </div>
                              </div>
                              <div className='text-right hidden md:block'>
                                <Badge className={`uppercase font-black text-[10px] px-4 py-1.5 rounded-full ${
                                  calculateDifference() === 0 ? 'bg-success text-white' : 'bg-error text-white'
                                }`}>
                                  {calculateDifference() === 0 ? 'Balance Cuadrado' : 'Requiere Justificación'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className='md:col-span-2 space-y-3'>
                          <Label className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1'>Justificación / Observaciones de Cierre</Label>
                          <Textarea
                            value={closeForm.closingNotes}
                            onChange={e => handleCloseFormChange('closingNotes', e.target.value)}
                            placeholder="Describa el motivo de cualquier discrepancia detectada o novedades durante el turno..."
                            className='resize-none rounded-3xl border-border-subtle bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/5 p-6 font-medium'
                            rows={4}
                          />
                        </div>
                      </div>

                      {formError && activeTab === 'close' && (
                        <div className='bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-in shake-in duration-300'>
                          <Info className="text-red-500" sx={{ fontSize: 20 }} />
                          <p className='text-xs text-red-600 font-black uppercase tracking-widest'>{formError}</p>
                        </div>
                      )}

                      <div className='flex gap-4 pt-4'>
                        <Button
                          type='submit'
                          disabled={isClosingCashRegister}
                          className='flex-1 h-16 bg-error hover:bg-error/90 text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-fluent-16 transition-all active:scale-95'
                        >
                          {isClosingCashRegister ? <Refresh className='animate-spin mr-2' sx={{ fontSize: 18 }} /> : null}
                          {isClosingCashRegister ? 'Cerrando Terminal...' : 'Finalizar y Cerrar Caja Registradora'}
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => {
                            setCloseForm({ cashier: '', register: '', closingDate: new Date().toISOString().split('T')[0], finalBalance: '', closingNotes: '' })
                            setFormError('')
                            setActiveTab('open')
                          }}
                          className='px-10 h-16 border-border-subtle font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-slate-50 transition-all'
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className='py-20 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-500'>
                      <div className='size-32 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 border border-border-subtle shadow-inner'>
                        <Payments sx={{ fontSize: 60 }} />
                      </div>
                      <div className='text-center max-w-sm space-y-3'>
                        <h3 className='text-xl font-black tracking-tighter uppercase text-text-main'>Terminal sin Actividad</h3>
                        <p className='text-text-secondary text-sm font-medium leading-relaxed'>
                          No existe una caja abierta actualmente vinculada a su usuario. Inicie una apertura para poder realizar cierres.
                        </p>
                      </div>
                      <Button 
                        onClick={() => setActiveTab('open')} 
                        className="h-12 px-10 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-fluent-8 transition-all active:scale-95"
                      >
                        Abrir Nueva Caja
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default NewCashRegister
