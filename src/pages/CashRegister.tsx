import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCashRegisterStore, CashRegister as CashRegisterType, Movement } from '@/store/useCashRegisterStore'
import {
  DollarSign as CashIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Clock,
  DollarSign,
  Calculator,
  AlertCircle,
  XCircle,
  ClipboardCheck,
  History,
} from 'lucide-react'
import { cashAuditService } from '@/services/cashAuditService'

interface CashAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashRegisterId?: number;
  systemBalance: number;
  onAuditCreated: () => void;
}

const CashAuditModal: React.FC<CashAuditModalProps> = ({ isOpen, onClose, cashRegisterId, systemBalance, onAuditCreated }) => {
  const [denominations, setDenominations] = useState<any>(null)
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const { createAudit, isCreatingAudit } = useCashRegisterStore()

  useEffect(() => {
    if (isOpen) {
      loadDenominations()
      setCounts({})
      setNotes('')
    }
  }, [isOpen])

  const loadDenominations = async () => {
    setLoading(true)
    try {
      const data = await cashAuditService.getDenominations()
      setDenominations(data.PYG || data)
    } catch (error) {
      console.error('Error loading denominations', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCountChange = (value: string, denom: number) => {
    setCounts(prev => ({
      ...prev,
      [denom]: parseInt(value) || 0
    }))
  }

  const totalCounted = useMemo(() => {
    if (!denominations) return 0
    let total = 0
    denominations.bills?.forEach((val: number) => total += (counts[val] || 0) * val)
    denominations.coins?.forEach((val: number) => total += (counts[val] || 0) * val)
    return total
  }, [denominations, counts])

  const difference = totalCounted - systemBalance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!denominations || !cashRegisterId) return

    const denomDetails: any[] = []
    denominations.bills?.forEach((val: number) => {
      if (counts[val]) denomDetails.push({ denomination: val, count: counts[val], type: 'BILL' })
    })
    denominations.coins?.forEach((val: number) => {
      if (counts[val]) denomDetails.push({ denomination: val, count: counts[val], type: 'COIN' })
    })

    try {
      await createAudit({
        cash_register_id: cashRegisterId,
        counted_amount: totalCounted,
        denominations: denomDetails,
        notes: notes
      })
      onAuditCreated()
      onClose()
    } catch (error) {
      console.error('Error creating audit', error)
    }
  }

  if (!isOpen) return null

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
                    {denominations.bills?.map((val: number) => (
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
                    {denominations.coins?.map((val: number) => (
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
  )
}

const CashRegister = () => {
  const {
    activeCashRegister,
    cashRegisters,
    movements,
    audits,
    cashRegisterSummary,
    isActiveCashRegisterLoading,
    isCashRegistersLoading,
    isOpeningCashRegister,
    isClosingCashRegister,
    isRegisteringMovement,
    getActiveCashRegister,
    getCashRegisters,
    openCashRegister,
    closeCashRegister,
    registerMovement,
    getMovements,
    getAudits,
    getCashRegisterReport,
  } = useCashRegisterStore()

  const [openCashRegisterDialog, setOpenCashRegisterDialog] = useState(false)
  const [closeCashRegisterDialog, setCloseCashRegisterDialog] = useState(false)
  const [movementDialog, setMovementDialog] = useState(false)
  const [summaryDialog, setSummaryDialog] = useState(false)
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [showAudits, setShowAudits] = useState(false)
  const [openCashRegisterForm, setOpenCashRegisterForm] = useState({ name: '', initial_balance: '', location: '', notes: '' })
  const [closeCashRegisterForm, setCloseCashRegisterForm] = useState({ final_balance: '', notes: '' })
  const [movementForm, setMovementForm] = useState({ movement_type: '', amount: '', concept: '', notes: '' })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const loadInitialData = async () => {
      await getActiveCashRegister()
      await getCashRegisters()
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeCashRegister?.id) {
      getMovements(activeCashRegister.id)
      if (getAudits) getAudits(activeCashRegister.id)
    }
  }, [activeCashRegister?.id])

  const handleLoadSummary = async () => {
    try {
      if (activeCashRegister?.id) {
        await getCashRegisterReport(activeCashRegister.id)
        setSummaryDialog(true)
      }
    } catch (error) {}
  }

  const handleOpenCashRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    try {
      await openCashRegister({
        name: openCashRegisterForm.name,
        initial_balance: parseFloat(openCashRegisterForm.initial_balance),
        location: openCashRegisterForm.location || null,
        notes: openCashRegisterForm.notes || null,
      })
      setOpenCashRegisterDialog(false)
      setOpenCashRegisterForm({ name: '', initial_balance: '', location: '', notes: '' })
      await getActiveCashRegister()
    } catch (error: any) { setFormError(error.message || 'Error al abrir la caja registradora') }
  }

  const handleCloseCashRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!activeCashRegister?.id) return
      await closeCashRegister(activeCashRegister.id, {
        final_balance: parseFloat(closeCashRegisterForm.final_balance),
        notes: closeCashRegisterForm.notes || null,
      })
      setCloseCashRegisterDialog(false)
      setCloseCashRegisterForm({ final_balance: '', notes: '' })
      await getActiveCashRegister()
      await getCashRegisters()
    } catch (error: any) { setFormError(error.message || 'Error al cerrar la caja registradora') }
  }

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!activeCashRegister?.id) return
      await registerMovement(activeCashRegister.id, {
        movement_type: movementForm.movement_type,
        amount: parseFloat(movementForm.amount),
        concept: movementForm.concept,
        notes: movementForm.notes || null,
      })
      setMovementDialog(false)
      setMovementForm({ movement_type: '', amount: '', concept: '', notes: '' })
      await getActiveCashRegister()
    } catch (error: any) { setFormError(error.message || 'Error al registrar el movimiento') }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge className='bg-green-100 text-success border-green-200 dark:bg-green-900/20 dark:border-green-800 uppercase font-black text-[9px] px-3 py-1 rounded-full'><span className='size-1.5 rounded-full bg-success mr-1.5'></span>Abierta</Badge>
      case 'CLOSED': return <Badge className='bg-slate-100 text-text-secondary border-slate-200 dark:bg-slate-800 dark:border-slate-700 uppercase font-black text-[9px] px-3 py-1 rounded-full'>Cerrada</Badge>
      default: return <Badge variant='secondary' className="uppercase font-black text-[9px]">{status}</Badge>
    }
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME': return 'text-success'
      case 'EXPENSE': return 'text-error'
      case 'ADJUSTMENT': return 'text-info'
      default: return 'text-text-secondary'
    }
  }

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME': return <PlusIcon className='w-4 h-4 text-success' />
      case 'EXPENSE': return <MinusIcon className='w-4 h-4 text-error' />
      case 'ADJUSTMENT': return <Calculator className='w-4 h-4 text-info' />
      default: return <DollarSign className='w-4 h-4 text-text-secondary' />
    }
  }

  const getMovementBorderColor = (type: string) => {
    switch (type) {
      case 'INCOME': return '#107c10'
      case 'EXPENSE': return '#a4262c'
      case 'ADJUSTMENT': return '#0078d4'
      default: return '#e5e7eb'
    }
  }

  const getOverlayClasses = () => 'fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300'

  return (
    <div className='flex flex-col gap-8 animate-in fade-in duration-500 font-display bg-background-light dark:bg-background-dark min-h-full'>
      {/* Header Section */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div className='flex items-center gap-5'>
          <div className='size-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-fluent-8 animate-in zoom-in duration-500'><CashIcon size={32} /></div>
          <div>
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>Cajas Registradoras</h1>
            <p className='text-text-secondary text-sm font-medium mt-1.5'>Control de flujo de efectivo y auditoría operativa</p>
          </div>
        </div>
        <div className='flex flex-wrap gap-3'>
          <Button 
            variant='outline' 
            onClick={getActiveCashRegister} 
            disabled={isActiveCashRegisterLoading} 
            className='h-11 px-5 border-border-subtle bg-white dark:bg-slate-900 font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-slate-50 transition-all'
          >
            {isActiveCashRegisterLoading ? <Clock className='animate-spin mr-2' size={14} /> : <History size={14} className='mr-2' />}
            {isActiveCashRegisterLoading ? 'Actualizando...' : 'Refrescar'}
          </Button>
          <Button 
            onClick={() => { setOpenCashRegisterDialog(true); setFormError(''); }} 
            className='h-11 px-8 bg-primary hover:bg-primary-hover text-white font-black uppercase text-[11px] tracking-widest rounded-lg shadow-fluent-8 transition-all active:scale-95'
          >
            <PlusIcon className='w-4 h-4 mr-2' /> Abrir Caja
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        
        {/* Active Cash Register Panel */}
        <div className='lg:col-span-8 space-y-8'>
          {activeCashRegister ? (
            <Card className="rounded-2xl border-border-subtle shadow-fluent-2 overflow-hidden bg-white dark:bg-slate-900 border-none">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-border-subtle p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className='flex items-center gap-4'>
                    <div className='size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner'>
                      <CashIcon size={24} />
                    </div>
                    <div className='min-w-0'>
                      <CardTitle className="text-2xl font-black tracking-tighter uppercase truncate text-text-main">{activeCashRegister.name}</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2 mt-1">
                        <Clock size={12} /> Abierta: {new Date(activeCashRegister.opened_at).toLocaleString()}
                        {activeCashRegister.location && (
                          <span className='flex items-center gap-1'><span className='size-1 rounded-full bg-slate-300'></span> {activeCashRegister.location}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(activeCashRegister.status)}
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
                  {/* KPI Cards with refined Fluent styles */}
                  <div className='p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border-subtle/50 shadow-sm flex justify-between items-start gap-4 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-fluent-2 group'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-3'>Balance Inicial</p>
                      <h2 className='text-2xl font-black tabular-nums truncate font-mono tracking-tight text-text-main'>{(activeCashRegister.initial_balance || 0).toLocaleString()} ₲</h2>
                    </div>
                    <div className='flex-shrink-0 size-10 rounded-xl bg-white dark:bg-slate-950 text-slate-400 flex items-center justify-center border border-border-subtle group-hover:text-slate-600 transition-colors'>
                      <History size={18} />
                    </div>
                  </div>
                  
                  <div className='p-6 bg-primary text-white rounded-2xl shadow-fluent-16 flex justify-between items-start gap-4 relative overflow-hidden group'>
                    <div className='absolute -right-4 -bottom-4 size-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000'></div>
                    <div className='flex-1 min-w-0 z-10'>
                      <p className='text-[10px] font-black uppercase text-white/70 tracking-[0.2em] mb-3'>Saldo en Caja</p>
                      <h2 className='text-3xl font-black tabular-nums truncate font-mono tracking-tighter'>{(activeCashRegister.current_balance || 0).toLocaleString()} ₲</h2>
                    </div>
                    <div className='flex-shrink-0 size-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 backdrop-blur-sm z-10'>
                      <DollarSign size={24} />
                    </div>
                  </div>

                  <div className='p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border-subtle/50 shadow-sm flex justify-between items-start gap-4 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-fluent-2 group'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-3'>Diferencia Neta</p>
                      <div className='flex items-center gap-2'>
                        <h2 className={`text-2xl font-black tabular-nums truncate font-mono tracking-tight ${((activeCashRegister.current_balance || 0) - (activeCashRegister.initial_balance || 0)) >= 0 ? 'text-success' : 'text-error'}`}>
                          {((activeCashRegister.current_balance || 0) - (activeCashRegister.initial_balance || 0)).toLocaleString()} ₲
                        </h2>
                      </div>
                    </div>
                    <div className='flex-shrink-0 size-10 rounded-xl bg-white dark:bg-slate-950 text-slate-400 flex items-center justify-center border border-border-subtle transition-colors'>
                      <Calculator size={18} />
                    </div>
                  </div>
                </div>

                <div className='flex flex-wrap gap-3 justify-center md:justify-start border-t border-border-subtle/50 pt-8'>
                  <Button variant='outline' onClick={() => setMovementDialog(true)} className='h-12 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest border-border-subtle bg-white dark:bg-slate-950 hover:bg-slate-50 transition-all flex items-center gap-2'><DollarSign size={16} /> Movimiento Manual</Button>
                  <Button onClick={() => setAuditModalOpen(true)} className='h-12 rounded-xl px-8 bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-fluent-8 transition-all flex items-center gap-2 active:scale-95'><ClipboardCheck size={16} /> Realizar Arqueo</Button>
                  <Button variant='outline' onClick={handleLoadSummary} className='h-12 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest border-border-subtle bg-white dark:bg-slate-950 hover:bg-slate-50 transition-all flex items-center gap-2'><Calculator size={16} /> Ver Reporte</Button>
                  <div className='w-px h-12 bg-border-subtle/50 mx-1 hidden md:block'></div>
                  <Button variant='outline' onClick={() => setCloseCashRegisterDialog(true)} className='h-12 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest border-error/30 text-error hover:bg-error/5 dark:hover:bg-error/10 transition-all flex items-center gap-2'><XCircle size={16} /> Cerrar Caja</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border-subtle shadow-fluent-2 bg-white dark:bg-slate-900 border-none">
              <CardContent className='text-center py-24'>
                <div className='size-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-800 shadow-inner animate-pulse'>
                  <CashIcon className='size-12 text-slate-200' />
                </div>
                <h3 className='text-2xl font-black tracking-tighter uppercase mb-3 text-text-main'>No hay caja activa</h3>
                <p className='text-text-secondary text-sm font-medium mb-10 max-w-sm mx-auto'>Para registrar ventas y movimientos de efectivo, primero debe abrir una caja registradora.</p>
                <Button onClick={() => { setOpenCashRegisterDialog(true); setFormError(''); }} className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[11px] px-12 h-14 rounded-xl shadow-fluent-16 transition-all active:scale-95">
                  <PlusIcon className='w-5 h-5 mr-2' /> Abrir Nueva Caja
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Table Area (Recent Movements or Audits) */}
          <Card className="rounded-2xl border-border-subtle shadow-fluent-2 overflow-hidden bg-white dark:bg-slate-900 border-none">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-border-subtle px-8 py-6">
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className="text-xl font-black tracking-tighter uppercase text-text-main">
                    {showAudits ? 'Historial de Arqueos' : 'Movimientos Recientes'}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1">
                    {showAudits ? 'Conteo físico y auditorías' : 'Flujo de efectivo operativo'}
                  </CardDescription>
                </div>
                <Button variant='ghost' size='sm' onClick={() => setShowAudits(!showAudits)} className="text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 px-4 h-9 rounded-lg transition-all">
                  <History size={14} className="mr-2" /> {showAudits ? 'Ver Movimientos' : 'Ver Arqueos'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className='divide-y divide-border-subtle/50'>
                {!showAudits ? (
                  movements.length > 0 ? (
                    movements.map((m: Movement) => (
                      <div key={m.id || m.movement_id} className='p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all border-l-4 group' style={{ borderLeftColor: getMovementBorderColor(m.movement_type) }}>
                        <div className='flex items-center gap-5'>
                          <div className='size-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-all border border-transparent group-hover:border-border-subtle shadow-sm'>
                            {getMovementTypeIcon(m.movement_type)}
                          </div>
                          <div>
                            <p className='font-black text-sm text-text-main leading-tight group-hover:text-primary transition-colors'>{m.concept || m.description}</p>
                            <p className='text-[10px] font-bold uppercase text-text-secondary tracking-widest mt-1.5 flex items-center gap-2'>
                              {new Date(m.created_at).toLocaleString()} 
                              <span className='size-1 rounded-full bg-slate-300'></span>
                              {m.user_full_name || m.created_by_name}
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className={`font-black text-xl tabular-nums font-mono tracking-tight ${getMovementTypeColor(m.movement_type)}`}>
                            {m.movement_type === 'EXPENSE' ? '-' : '+'} ₲ {m.amount.toLocaleString()}
                          </p>
                          <p className='text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1'>Balance: ₲ {m.running_balance?.toLocaleString() || '0'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='py-20 text-center'>
                      <History className='size-12 text-slate-200 mx-auto mb-4' />
                      <p className='text-xs font-black uppercase tracking-widest text-slate-400 italic'>No hay movimientos registrados</p>
                    </div>
                  )
                ) : (
                  audits.length > 0 ? (
                    audits.map(audit => (
                      <div key={audit.id} className='p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group'>
                        <div className='flex items-center gap-5'>
                          <div className='size-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all border border-transparent group-hover:border-border-subtle shadow-sm'>
                            <ClipboardCheck size={20} />
                          </div>
                          <div>
                            <p className='font-black text-sm text-text-main leading-tight'>Arqueo #{audit.id}</p>
                            <p className='text-[10px] font-bold uppercase text-text-secondary tracking-widest mt-1.5'>{new Date(audit.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='font-black text-xl tabular-nums font-mono tracking-tight text-text-main'>{audit.counted_amount.toLocaleString()} ₲</p>
                          <Badge className={`${audit.difference === 0 ? 'bg-green-50 text-success border-green-200' : 'bg-red-50 text-error border-red-200'} uppercase font-black text-[9px] px-3 py-1 rounded-full border mt-1.5`}>
                            {audit.difference === 0 ? 'Sin Discrepancia' : `Diferencia: ${audit.difference.toLocaleString()} ₲`}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='py-20 text-center'>
                      <ClipboardCheck className='size-12 text-slate-200 mx-auto mb-4' />
                      <p className='text-xs font-black uppercase tracking-widest text-slate-400 italic'>No hay auditorías registradas</p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: History and Actions */}
        <div className='lg:col-span-4 space-y-8'>
          <Card className="rounded-2xl border-border-subtle shadow-fluent-2 overflow-hidden bg-white dark:bg-slate-900 border-none">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-border-subtle p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black tracking-tighter uppercase text-text-main">Historial de Cajas</CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-text-secondary mt-1">Cierres anteriores</CardDescription>
              </div>
              <Button variant='ghost' size='sm' onClick={getCashRegisters} disabled={isCashRegistersLoading} className="size-8 p-0 text-primary rounded-lg hover:bg-primary/10 transition-all">
                <History size={16} className={isCashRegistersLoading ? 'animate-spin' : ''} />
              </Button>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto custom-scrollbar">
              {cashRegisters && cashRegisters.length > 0 ? (
                <div className='divide-y divide-border-subtle/50'>
                  {cashRegisters.map((cr: CashRegisterType) => (
                    <div key={cr.id} className='p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all flex flex-col gap-3 group'>
                      <div className='flex items-center justify-between'>
                        <p className='font-black text-xs uppercase tracking-tight text-text-main group-hover:text-primary transition-colors'>{cr.name}</p>
                        {getStatusBadge(cr.status)}
                      </div>
                      <div className='flex items-end justify-between gap-4'>
                        <div className='flex flex-col gap-1'>
                          <p className='text-[9px] font-bold uppercase text-text-secondary tracking-widest flex items-center gap-1.5'>
                            <PlusIcon size={10} className='text-success' /> Apertura: {new Date(cr.opened_at).toLocaleDateString()}
                          </p>
                          {cr.closed_at && (
                            <p className='text-[9px] font-bold uppercase text-text-secondary tracking-widest flex items-center gap-1.5'>
                              <MinusIcon size={10} className='text-error' /> Cierre: {new Date(cr.closed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className='text-right'>
                          <p className='font-black font-mono text-xs tabular-nums text-text-main'>₲ {(cr.current_balance || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-16 text-center text-text-secondary font-bold italic uppercase text-[10px] tracking-widest'>No hay historial de cajas</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODALS & DIALOGS */}
      
      {/* Open Cash Register Dialog */}
      {openCashRegisterDialog && (
        <div className={getOverlayClasses()} onClick={() => setOpenCashRegisterDialog(false)}>
          <div className='bg-surface dark:bg-background-dark w-full max-w-lg rounded-2xl shadow-fluent-16 border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between p-6 pb-4 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
              <div className='flex items-center gap-3'>
                <div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary'><PlusIcon size={20} /></div>
                <div><h2 className='text-lg font-black tracking-tighter uppercase text-text-main'>Abrir Nueva Caja</h2><p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Configuración de jornada operativa</p></div>
              </div>
              <button onClick={() => setOpenCashRegisterDialog(false)} className='text-text-secondary hover:text-text-main transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800'><XCircle className='w-6 h-6' /></button>
            </div>
            <div className='p-8 space-y-6'>
              <form onSubmit={handleOpenCashRegister} className='space-y-6' id='open-cash-form'>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre de la Caja</Label><Input value={openCashRegisterForm.name} onChange={e => setOpenCashRegisterForm(prev => ({...prev, name: e.target.value}))} placeholder='Ej: Caja Principal - Turno Mañana' className="rounded-xl border-border-subtle font-black h-11 focus:ring-2 focus:ring-primary/10" required /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fondo Inicial (Sencillo)</Label><div className='relative'><span className='absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black'>₲</span><Input type='number' step='0.01' min='0' value={openCashRegisterForm.initial_balance} onChange={e => setOpenCashRegisterForm(prev => ({...prev, initial_balance: e.target.value}))} placeholder='0.00' className="rounded-xl border-border-subtle font-mono font-black text-xl h-14 pl-10 focus:ring-2 focus:ring-primary/10" required /></div></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Ubicación</Label><Input value={openCashRegisterForm.location} onChange={e => setOpenCashRegisterForm(prev => ({...prev, location: e.target.value}))} placeholder='Ej: Sucursal Centro - Mostrador 1' className="rounded-xl border-border-subtle h-11 focus:ring-2 focus:ring-primary/10" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas de Apertura</Label><Textarea value={openCashRegisterForm.notes} onChange={e => setOpenCashRegisterForm(prev => ({...prev, notes: e.target.value}))} placeholder='Observaciones iniciales...' rows={3} className="rounded-xl border-border-subtle resize-none focus:ring-2 focus:ring-primary/10" /></div>
                {formError && <div className='p-4 bg-error/5 border border-error/20 rounded-xl flex items-center gap-3 animate-in shake-in duration-300'><AlertCircle className="text-error" size={18} /><p className='text-xs font-black text-error uppercase tracking-wider'>{formError}</p></div>}
              </form>
            </div>
            <div className='flex gap-4 p-6 border-t border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
              <Button onClick={handleOpenCashRegister} form='open-cash-form' disabled={isOpeningCashRegister} className="flex-1 bg-primary hover:bg-primary-hover text-white font-black uppercase text-[11px] tracking-widest h-12 rounded-lg shadow-fluent-8 transition-all active:scale-95">{isOpeningCashRegister ? <Clock className='animate-spin mr-2' size={16} /> : null}{isOpeningCashRegister ? 'Abriendo...' : 'Abrir Caja Registradora'}</Button>
              <Button variant='outline' onClick={() => setOpenCashRegisterDialog(false)} disabled={isOpeningCashRegister} className="px-8 border-border-subtle font-black uppercase text-[11px] tracking-widest h-12 rounded-lg hover:bg-white dark:hover:bg-slate-950 transition-all">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Movement Dialog */}
      {movementDialog && (
        <div className={getOverlayClasses()} onClick={() => setMovementDialog(false)}>
          <div className='bg-surface dark:bg-background-dark w-full max-w-lg rounded-2xl shadow-fluent-16 border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between p-6 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
              <div className='flex items-center gap-3'>
                <div className='size-10 rounded-lg bg-info/10 flex items-center justify-center text-info'><DollarSign size={20} /></div>
                <div><h2 className='text-lg font-black tracking-tighter uppercase text-text-main'>Registrar Movimiento</h2><p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Ajuste manual de efectivo</p></div>
              </div>
              <button onClick={() => setMovementDialog(false)} className='text-text-secondary hover:text-text-main transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800'><XCircle className='w-6 h-6' /></button>
            </div>
            <div className='p-8 space-y-6'>
              {isRegisteringMovement ? <div className='py-20 text-center flex flex-col items-center gap-4'><Clock className='animate-spin text-primary size-10' /><p className='text-[10px] font-black uppercase tracking-widest text-slate-400'>Procesando registro...</p></div> : (
                <form onSubmit={handleRegisterMovement} className='space-y-6' id='movement-form'>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tipo de Movimiento</Label><Select value={movementForm.movement_type} onValueChange={v => setMovementForm(prev => ({...prev, movement_type: v}))} required><SelectTrigger className="rounded-xl border-border-subtle font-black h-11 focus:ring-2 focus:ring-primary/10 bg-white dark:bg-slate-950"><SelectValue placeholder='Seleccione el tipo' /></SelectTrigger><SelectContent className="rounded-xl shadow-fluent-16 border-border-subtle"><SelectItem value='INCOME' className="font-black text-[10px] uppercase tracking-widest">Ingreso (+)</SelectItem><SelectItem value='EXPENSE' className="font-black text-[10px] uppercase tracking-widest text-error">Egreso (-)</SelectItem><SelectItem value='ADJUSTMENT' className="font-black text-[10px] uppercase tracking-widest text-info">Ajuste (+/-)</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Monto (₲)</Label><div className='relative'><span className='absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black'>₲</span><Input type='number' step='0.01' value={movementForm.amount} onChange={e => setMovementForm(prev => ({...prev, amount: e.target.value}))} placeholder='0.00' className="rounded-xl border-border-subtle font-mono font-black text-xl h-14 pl-10 focus:ring-2 focus:ring-primary/10" required /></div></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Concepto / Motivo</Label><Input value={movementForm.concept} onChange={e => setMovementForm(prev => ({...prev, concept: e.target.value}))} placeholder='Ej: Pago de delivery, Error de vuelto...' className="rounded-xl border-border-subtle font-black h-11 focus:ring-2 focus:ring-primary/10" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas Detalladas</Label><Textarea value={movementForm.notes} onChange={e => setMovementForm(prev => ({...prev, notes: e.target.value}))} placeholder='Información adicional...' rows={2} className="rounded-xl border-border-subtle resize-none focus:ring-2 focus:ring-primary/10" /></div>
                </form>
              )}
            </div>
            <div className='flex gap-4 p-6 border-t border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
              <Button onClick={handleRegisterMovement} form='movement-form' disabled={isRegisteringMovement} className="flex-1 bg-primary hover:bg-primary-hover text-white font-black uppercase text-[11px] tracking-widest h-12 rounded-lg shadow-fluent-8 transition-all active:scale-95">{isRegisteringMovement ? <Clock className='animate-spin mr-2' size={16} /> : null}Registrar Movimiento</Button>
              <Button variant='outline' onClick={() => setMovementDialog(false)} disabled={isRegisteringMovement} className="px-8 border-border-subtle font-black uppercase text-[11px] tracking-widest h-12 rounded-lg hover:bg-white dark:hover:bg-slate-950 transition-all">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Cash Register Dialog */}
      {closeCashRegisterDialog && (
        <div className={getOverlayClasses()} onClick={() => setCloseCashRegisterDialog(false)}>
          <div className='bg-surface dark:bg-background-dark w-full max-w-lg rounded-2xl shadow-fluent-16 border border-border-subtle overflow-hidden animate-in zoom-in-95 duration-200' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between p-6 border-b border-border-subtle bg-amber-50/50 dark:bg-amber-900/20'>
              <div className='flex items-center gap-3'>
                <div className='size-12 rounded-xl bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600'><AlertCircle size={24} /></div>
                <div><h2 className='text-lg font-black tracking-tighter uppercase text-text-main'>Cerrar Caja</h2><p className='text-[10px] font-bold uppercase tracking-widest text-amber-700'>Arqueo final de jornada</p></div>
              </div>
              <button onClick={() => setCloseCashRegisterDialog(false)} className='text-amber-400 hover:text-amber-600 transition-colors p-1 rounded-full hover:bg-amber-100/50 dark:hover:bg-amber-800/50'><XCircle className='w-6 h-6' /></button>
            </div>
            <div className='p-8 space-y-8'>
              {isClosingCashRegister ? <div className='py-20 text-center flex flex-col items-center gap-4'><Clock className='animate-spin text-amber-600 size-10' /><p className='text-[10px] font-black uppercase tracking-widest text-amber-500'>Procesando cierre...</p></div> : (
                <form id='close-cash-form' onSubmit={handleCloseCashRegister} className='space-y-8'>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Balance Físico Final</Label>
                    <div className='relative'>
                      <span className='absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black'>₲</span>
                      <Input type='number' step='0.01' value={closeCashRegisterForm.final_balance} onChange={e => setCloseCashRegisterForm(prev => ({...prev, final_balance: e.target.value}))} placeholder='0.00' className="rounded-xl border-border-subtle font-mono font-black text-2xl h-16 pl-10 focus:ring-2 focus:ring-amber-500/20" required />
                    </div>
                    <div className='p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-border-subtle flex justify-between items-center'>
                      <span className='text-[10px] text-slate-400 font-black uppercase tracking-widest'>Balance esperado:</span>
                      <span className='font-mono font-black text-text-main'>₲ {activeCashRegister?.current_balance?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-3"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas de Cierre</Label><Textarea value={closeCashRegisterForm.notes} onChange={e => setCloseCashRegisterForm(prev => ({...prev, notes: e.target.value}))} placeholder='Describa cualquier discrepancia o novedad...' rows={3} className="rounded-xl border-border-subtle resize-none focus:ring-2 focus:ring-amber-500/20" /></div>
                </form>
              )}
            </div>
            <div className='flex gap-4 p-6 border-t border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
              <Button type='submit' form='close-cash-form' disabled={isClosingCashRegister} className="flex-1 bg-error hover:bg-error/90 text-white font-black uppercase text-[11px] tracking-widest h-12 rounded-lg shadow-fluent-8 transition-all active:scale-95">Cerrar Caja Registradora</Button>
              <Button variant='outline' onClick={() => setCloseCashRegisterDialog(false)} disabled={isClosingCashRegister} className="px-8 border-border-subtle font-black uppercase text-[11px] tracking-widest h-12 rounded-lg hover:bg-white dark:hover:bg-slate-950 transition-all">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Report Dialog */}
      {summaryDialog && (
        <div className={getOverlayClasses()} onClick={() => setSummaryDialog(false)}>
          <div className='bg-surface dark:bg-background-dark w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-fluent-16 border border-border-subtle animate-in zoom-in-95 duration-200' onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between p-6 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'>
              <div className='flex items-center gap-3'>
                <div className='size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary'><Calculator size={24} /></div>
                <div><h2 className='text-lg font-black tracking-tighter uppercase text-text-main'>Reporte Detallado de Caja</h2><p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Análisis financiero acumulado</p></div>
              </div>
              <button onClick={() => setSummaryDialog(false)} className='text-text-secondary hover:text-text-main transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800'><XCircle className='w-6 h-6' /></button>
            </div>
            <div className='flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar'>
              {cashRegisterSummary && (
                <div className='space-y-10'>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border-subtle group hover:bg-white dark:hover:bg-slate-800 hover:shadow-fluent-2 transition-all'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-success transition-colors'>Ingresos Totales</p><p className='text-lg font-black text-success font-mono tracking-tight'>₲ {cashRegisterSummary.summary?.total_income?.toLocaleString() || 0}</p></div>
                    <div className='p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border-subtle group hover:bg-white dark:hover:bg-slate-800 hover:shadow-fluent-2 transition-all'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-error transition-colors'>Gastos Totales</p><p className='text-lg font-black text-error font-mono tracking-tight'>₲ {cashRegisterSummary.summary?.total_expenses?.toLocaleString() || 0}</p></div>
                    <div className='p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border-subtle group hover:bg-white dark:hover:bg-slate-800 hover:shadow-fluent-2 transition-all'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-info transition-colors'>Transacciones</p><p className='text-lg font-black text-info font-mono tracking-tight'>{cashRegisterSummary.summary?.transaction_count || 0}</p></div>
                    <div className='p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border-subtle group hover:bg-white dark:hover:bg-slate-800 hover:shadow-fluent-2 transition-all'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-primary transition-colors'>Cambio Neto</p><p className='text-lg font-black text-primary font-mono tracking-tight'>₲ {cashRegisterSummary.summary?.net_change?.toLocaleString() || 0}</p></div>
                  </div>
                  
                  <div className='space-y-6'>
                    <h4 className='text-[10px] font-black uppercase text-text-secondary tracking-[0.3em] flex items-center gap-3 border-b border-border-subtle pb-3'>Distribución por Categoría</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {Object.entries(cashRegisterSummary.by_category || {}).map(([cat, amount]) => (
                        <div key={cat} className='flex items-center justify-between p-4 border border-border-subtle rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group'>
                          <span className='text-xs font-black uppercase tracking-wider text-text-secondary group-hover:text-text-main transition-colors'>{cat}</span>
                          <span className='font-black font-mono text-sm tabular-nums text-text-main'>₲ {amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className='flex justify-end p-6 border-t border-border-subtle bg-slate-50/50 dark:bg-slate-800/50'><Button onClick={() => setSummaryDialog(false)} className="bg-primary hover:bg-primary-hover text-white font-black uppercase text-[11px] tracking-widest h-12 px-12 rounded-lg shadow-fluent-8 transition-all active:scale-95">Cerrar Reporte</Button></div>
          </div>
        </div>
      )}

      <CashAuditModal 
        isOpen={auditModalOpen} 
        onClose={() => setAuditModalOpen(false)} 
        cashRegisterId={activeCashRegister?.id} 
        systemBalance={activeCashRegister?.current_balance || 0} 
        onAuditCreated={() => getAudits(activeCashRegister?.id as number)}
      />
    </div>
  )
}

export default CashRegister
