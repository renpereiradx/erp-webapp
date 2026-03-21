import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useCashRegisterStore } from '@/store/useCashRegisterStore'
import {
  DollarSign as CashIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Clock,
  DollarSign,
  Calculator,
  AlertCircle,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  History,
} from 'lucide-react'
import { cashAuditService } from '@/services/cashAuditService'

const CashAuditModal = ({ isOpen, onClose, cashRegisterId, systemBalance, onAuditCreated }) => {
  const { styles } = useThemeStyles()
  const [denominations, setDenominations] = useState(null)
  const [counts, setCounts] = useState({})
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

  const handleCountChange = (value, denom) => {
    setCounts(prev => ({
      ...prev,
      [denom]: parseInt(value) || 0
    }))
  }

  const totalCounted = useMemo(() => {
    if (!denominations) return 0
    let total = 0
    denominations.bills?.forEach(val => total += (counts[val] || 0) * val)
    denominations.coins?.forEach(val => total += (counts[val] || 0) * val)
    return total
  }, [denominations, counts])

  const difference = totalCounted - systemBalance

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!denominations) return

    const denomDetails = []
    denominations.bills?.forEach(val => {
      if (counts[val]) denomDetails.push({ denomination: val, count: counts[val], type: 'BILL' })
    })
    denominations.coins?.forEach(val => {
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
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
      <div className={`${styles.card()} w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl shadow-fluent-16 overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-between p-6 border-b border-border-subtle bg-slate-50/50'>
          <div className='flex items-center gap-3'>
            <ClipboardCheck className='w-6 h-6 text-primary' />
            <div>
              <h2 className='text-lg font-black tracking-tighter uppercase'>Arqueo de Caja</h2>
              <p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Conteo físico de billetes y monedas</p>
            </div>
          </div>
          <button onClick={onClose} className='text-text-secondary hover:text-text-main transition-colors'><XCircle className='w-5 h-5' /></button>
        </div>

        <div className='flex-1 overflow-y-auto p-8'>
          {loading ? (
            <div className='flex justify-center py-12'><Clock className='animate-spin text-primary' /></div>
          ) : (
            <form id='audit-form' onSubmit={handleSubmit} className='space-y-8'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
                <div className='space-y-4'>
                  <h4 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2'>
                    <PlusIcon size={12} /> Billetes
                  </h4>
                  <div className='space-y-2'>
                    {denominations.bills?.map(val => (
                      <div key={val} className='flex items-center justify-between gap-4 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-transparent hover:border-border-subtle transition-colors'>
                        <span className='text-sm font-mono font-black text-text-main w-20'>{val.toLocaleString()} ₲</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-[10px] text-slate-400 font-black uppercase'>x</span>
                          <Input type='number' min='0' className='w-20 h-8 text-right font-bold' value={counts[val] || ''} onChange={e => handleCountChange(e.target.value, val)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='space-y-4'>
                  <h4 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2'>
                    <MinusIcon size={12} /> Monedas
                  </h4>
                  <div className='space-y-2'>
                    {denominations.coins?.map(val => (
                      <div key={val} className='flex items-center justify-between gap-4 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-transparent hover:border-border-subtle transition-colors'>
                        <span className='text-sm font-mono font-black text-text-main w-20'>{val.toLocaleString()} ₲</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-[10px] text-slate-400 font-black uppercase'>x</span>
                          <Input type='number' min='0' className='w-20 h-8 text-right font-bold' value={counts[val] || ''} onChange={e => handleCountChange(e.target.value, val)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className='p-6 bg-primary/5 rounded-xl border border-primary/10 flex flex-col md:flex-row justify-between items-center gap-6'>
                <div className='text-center md:text-left'>
                  <p className='text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-1'>Total Contado</p>
                  <p className='text-3xl font-black text-primary tabular-nums font-mono'>{totalCounted.toLocaleString()} ₲</p>
                </div>
                <div className='text-center md:text-right'>
                  <p className='text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-1'>Diferencia</p>
                  <p className={`text-2xl font-black tabular-nums font-mono ${difference === 0 ? 'text-success' : 'text-error'}`}>
                    {difference > 0 ? '+' : ''}{difference.toLocaleString()} ₲
                  </p>
                </div>
              </div>
              <div className='space-y-2'>
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Observaciones</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder='Notas sobre el arqueo...' rows={2} className="rounded-lg border-border-subtle resize-none" />
              </div>
            </form>
          )}
        </div>
        <div className='p-6 border-t border-border-subtle bg-slate-50/50 flex gap-3'>
          <Button type='submit' form='audit-form' className='flex-1 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] h-11 rounded shadow-fluent-2' disabled={isCreatingAudit}>
            {isCreatingAudit ? 'Guardando...' : 'Confirmar Arqueo'}
          </Button>
          <Button variant='outline' onClick={onClose} className='flex-1 border-border-subtle font-black uppercase tracking-widest text-[10px] h-11 rounded hover:bg-slate-100 transition-colors'>Cancelar</Button>
        </div>
      </div>
    </div>
  )
}

const CashRegister = () => {
  const { t } = useI18n()
  const { styles } = useThemeStyles()
  const {
    activeCashRegister,
    cashRegisters,
    movements,
    audits,
    cashRegisterSummary,
    isActiveCashRegisterLoading,
    isCashRegistersLoading,
    isMovementsLoading,
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

  const handleOpenCashRegister = async e => {
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
    } catch (error) { setFormError(error.message || 'Error al abrir la caja registradora') }
  }

  const handleCloseCashRegister = async e => {
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
    } catch (error) { setFormError(error.message || 'Error al cerrar la caja registradora') }
  }

  const handleRegisterMovement = async e => {
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
    } catch (error) { setFormError(error.message || 'Error al registrar el movimiento') }
  }

  const getStatusBadge = status => {
    switch (status) {
      case 'OPEN': return <Badge className='bg-green-100 text-success border-green-200 uppercase font-black text-[9px] px-2.5 py-1 rounded-full'><span className='size-1.5 rounded-full bg-success mr-1.5'></span>Abierta</Badge>
      case 'CLOSED': return <Badge className='bg-slate-100 text-text-secondary border-slate-200 uppercase font-black text-[9px] px-2.5 py-1 rounded-full'>Cerrada</Badge>
      default: return <Badge variant='secondary' className="uppercase font-black text-[9px]">{status}</Badge>
    }
  }

  const getMovementTypeColor = type => {
    switch (type) {
      case 'INCOME': return 'text-success'
      case 'EXPENSE': return 'text-error'
      case 'ADJUSTMENT': return 'text-info'
      default: return 'text-text-secondary'
    }
  }

  const getMovementTypeIcon = type => {
    switch (type) {
      case 'INCOME': return <PlusIcon className='w-4 h-4 text-success' />
      case 'EXPENSE': return <MinusIcon className='w-4 h-4 text-error' />
      case 'ADJUSTMENT': return <Calculator className='w-4 h-4 text-info' />
      default: return <DollarSign className='w-4 h-4 text-text-secondary' />
    }
  }

  const getMovementBorderColor = type => {
    switch (type) {
      case 'INCOME': return '#107c10'
      case 'EXPENSE': return '#a4262c'
      case 'ADJUSTMENT': return '#0078d4'
      default: return '#e5e7eb'
    }
  }

  const getOverlayClasses = () => 'fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60'

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      <div className='relative w-full space-y-8'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
          <div className='flex items-center gap-4'>
            <div className='size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-fluent-8'><CashIcon size={28} /></div>
            <div><h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>Cajas Registradoras</h1><p className='text-text-secondary text-sm font-medium mt-1'>Gestión de efectivo y movimientos operativos</p></div>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' onClick={getActiveCashRegister} disabled={isActiveCashRegisterLoading} className='h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest'>{isActiveCashRegisterLoading ? 'Cargando...' : 'Actualizar Estado'}</Button>
            <Button onClick={() => { setOpenCashRegisterDialog(true); setFormError(''); }} className='h-10 px-6 bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest rounded shadow-fluent-2'><PlusIcon className='w-4 h-4 mr-2' /> Abrir Caja</Button>
          </div>
        </div>

        {openCashRegisterDialog && (
          <div className={getOverlayClasses()} onClick={() => setOpenCashRegisterDialog(false)}>
            <div className={`${styles.card()} w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-fluent-16`} onClick={e => e.stopPropagation()}>
              <div className='flex items-center justify-between p-6 pb-4 border-b border-border-subtle bg-slate-50/50'><div><h2 className='text-lg font-black tracking-tighter uppercase'>Abrir Nueva Caja</h2><p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Configuración de datos iniciales</p></div><button onClick={() => setOpenCashRegisterDialog(false)} className='text-text-secondary hover:text-text-main transition-colors'><XCircle className='w-5 h-5' /></button></div>
              <div className='p-8 space-y-6'>
                <form onSubmit={handleOpenCashRegister} className='space-y-6'>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre de la Caja</Label><Input value={openCashRegisterForm.name} onChange={e => setOpenCashRegisterForm(prev => ({...prev, name: e.target.value}))} placeholder='Ej: Caja Principal' className="rounded border-border-subtle font-bold" required /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Balance Inicial</Label><Input type='number' step='0.01' min='0' value={openCashRegisterForm.initial_balance} onChange={e => setOpenCashRegisterForm(prev => ({...prev, initial_balance: e.target.value}))} placeholder='0.00' className="rounded border-border-subtle font-mono font-bold text-lg" required /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Ubicación</Label><Input value={openCashRegisterForm.location} onChange={e => setOpenCashRegisterForm(prev => ({...prev, location: e.target.value}))} placeholder='Ej: Mostrador Principal' className="rounded border-border-subtle" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas</Label><Textarea value={openCashRegisterForm.notes} onChange={e => setOpenCashRegisterForm(prev => ({...prev, notes: e.target.value}))} placeholder='Notas adicionales...' rows={3} className="rounded border-border-subtle resize-none" /></div>
                  {formError && <div className='p-4 bg-error/5 border border-error/20 rounded-lg flex items-center gap-3'><AlertCircle className="text-error" size={18} /><p className='text-xs font-bold text-error uppercase tracking-wider'>{formError}</p></div>}
                </form>
              </div>
              <div className='flex gap-3 justify-end p-6 border-t border-border-subtle bg-slate-50/50'>
                <Button variant='outline' onClick={() => setOpenCashRegisterDialog(false)} disabled={isOpeningCashRegister} className="font-black uppercase text-[10px] tracking-widest border-border-subtle">Cancelar</Button>
                <Button onClick={handleOpenCashRegister} disabled={isOpeningCashRegister} className="bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-fluent-2">{isOpeningCashRegister ? 'Abriendo...' : 'Abrir Caja'}</Button>
              </div>
            </div>
          </div>
        )}

        {activeCashRegister && (
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className='flex items-center gap-3'><div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary'><CashIcon size={20} /></div><div><CardTitle className="text-xl font-black tracking-tighter uppercase">{activeCashRegister.name}</CardTitle><CardDescription className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Abierta el {new Date(activeCashRegister.opened_at).toLocaleString()}{activeCashRegister.location && ` • ${activeCashRegister.location}`}</CardDescription></div></div>
                {getStatusBadge(activeCashRegister.status)}
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>
                <div className='p-6 bg-white rounded-xl border border-border-subtle shadow-fluent-2 flex justify-between items-start gap-4 group hover:shadow-fluent-8 transition-all'><div className='flex-1 min-w-0'><p className='text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-2'>Balance Inicial</p><h2 className='text-2xl font-black tabular-nums truncate font-mono'>{(activeCashRegister.initial_balance || 0).toLocaleString()} ₲</h2></div><div className='flex-shrink-0 size-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center transition-colors'><MinusIcon size={20} /></div></div>
                <div className='p-6 bg-primary text-white rounded-xl border border-primary/10 shadow-fluent-8 flex justify-between items-start gap-4'><div className='flex-1 min-w-0'><p className='text-[10px] font-black uppercase text-white/70 tracking-[0.2em] mb-2'>Balance Actual</p><h2 className='text-3xl font-black tabular-nums truncate font-mono'>{(activeCashRegister.current_balance || 0).toLocaleString()} ₲</h2></div><div className='flex-shrink-0 size-12 rounded-lg bg-white/20 flex items-center justify-center'><DollarSign size={24} /></div></div>
                <div className='p-6 bg-white rounded-xl border border-border-subtle shadow-fluent-2 flex justify-between items-start gap-4 group hover:shadow-fluent-8 transition-all'><div className='flex-1 min-w-0'><p className='text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-2'>Diferencia</p><h2 className={`text-2xl font-black tabular-nums truncate font-mono ${(activeCashRegister.current_balance || 0) - (activeCashRegister.initial_balance || 0) >= 0 ? 'text-success' : 'text-error'}`}>{((activeCashRegister.current_balance || 0) - (activeCashRegister.initial_balance || 0)).toLocaleString()} ₲</h2></div><div className='flex-shrink-0 size-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center transition-colors'><PlusIcon size={20} /></div></div>
              </div>
              <div className='flex flex-wrap gap-3 justify-center md:justify-start mt-4 border-t border-slate-100 pt-8'>
                <Button variant='outline' onClick={() => setMovementDialog(true)} className='h-11 rounded-lg px-6 font-black uppercase text-[10px] tracking-widest border-border-subtle hover:bg-slate-50 transition-colors'><DollarSign className='w-4 h-4 mr-2' /> Registrar Movimiento</Button>
                <Button onClick={() => setAuditModalOpen(true)} className='h-11 rounded-lg px-6 font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary-hover text-white shadow-fluent-2'><ClipboardCheck className='w-4 h-4 mr-2' /> Realizar Arqueo</Button>
                <Button variant='outline' onClick={handleLoadSummary} className='h-11 rounded-lg px-6 font-black uppercase text-[10px] tracking-widest border-border-subtle hover:bg-slate-50 transition-colors'><Calculator className='w-4 h-4 mr-2' /> Ver Reporte</Button>
                <Button variant='outline' onClick={() => setShowAudits(!showAudits)} className='h-11 rounded-lg px-6 font-black uppercase text-[10px] tracking-widest border-border-subtle hover:bg-slate-50 transition-colors'><History className='w-4 h-4 mr-2' /> {showAudits ? 'Ver Movimientos' : 'Ver Arqueos'}</Button>
                <div className='w-px h-11 bg-border-subtle mx-2 hidden md:block'></div>
                <Button variant='outline' onClick={() => setCloseCashRegisterDialog(true)} className='h-11 rounded-lg px-6 font-black uppercase text-[10px] tracking-widest border-error/30 text-error hover:bg-error/5 transition-colors'><XCircle className='w-4 h-4 mr-2' /> Cerrar Caja</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!activeCashRegister && !isActiveCashRegisterLoading && (
          <Card className="rounded-xl border-border-subtle shadow-fluent-2"><CardContent className='text-center py-16'><CashIcon className='w-16 h-16 mx-auto text-slate-200 mb-6' /><h3 className='text-xl font-black tracking-tighter uppercase mb-2'>No hay caja activa</h3><p className='text-text-secondary text-sm font-medium mb-8'>Debe abrir una caja registradora para comenzar a operar</p><Button onClick={() => { setOpenCashRegisterDialog(true); setFormError(''); }} className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] px-8 h-11 rounded shadow-fluent-2"><PlusIcon className='w-4 h-4 mr-2' /> Abrir Nueva Caja</Button></CardContent></Card>
        )}

        {!showAudits && movements.length > 0 && (
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle"><CardTitle className="text-xl font-black tracking-tighter uppercase">Movimientos Recientes</CardTitle><CardDescription className="text-[10px] font-bold uppercase tracking-widest">Historial de efectivo en caja</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className='divide-y divide-border-subtle'>
                {movements.map(m => (
                  <div key={m.id || m.movement_id} className='p-6 flex items-center justify-between hover:bg-slate-50 transition-colors border-l-4' style={{ borderLeftColor: getMovementBorderColor(m.movement_type) }}>
                    <div className='flex items-center gap-4'>
                      <div className='size-10 rounded-lg bg-slate-50 flex items-center justify-center'>{getMovementTypeIcon(m.movement_type)}</div>
                      <div><p className='font-bold text-sm text-text-main'>{m.concept || m.description}</p><p className='text-[10px] font-bold uppercase text-text-secondary tracking-widest mt-0.5'>{new Date(m.created_at).toLocaleString()} • {m.user_full_name || m.created_by_name}</p></div>
                    </div>
                    <div className='text-right'>
                      <p className={`font-black text-lg tabular-nums font-mono ${getMovementTypeColor(m.movement_type)}`}>{m.movement_type === 'EXPENSE' ? '-' : '+'} ₲ {m.amount.toLocaleString()}</p>
                      <p className='text-[10px] font-bold uppercase text-slate-400 tracking-widest'>Balance: ₲ {m.running_balance?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showAudits && (
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle"><CardTitle className="text-xl font-black tracking-tighter uppercase">Historial de Arqueos</CardTitle><CardDescription className="text-[10px] font-bold uppercase tracking-widest">Auditorías físicas de caja</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className='divide-y divide-border-subtle'>
                {(!audits || audits.length === 0) ? <div className='py-12 text-center text-text-secondary font-bold italic uppercase text-xs tracking-widest'>No hay arqueos registrados</div> : audits.map(audit => (
                  <div key={audit.id} className='p-6 flex items-center justify-between hover:bg-slate-50 transition-colors'>
                    <div className='flex items-center gap-4'><div className='size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500'><ClipboardCheck size={20} /></div><div><p className='font-bold text-sm'>Arqueo #{audit.id}</p><p className='text-[10px] font-bold uppercase text-text-secondary tracking-widest mt-0.5'>{new Date(audit.created_at).toLocaleString()}</p></div></div>
                    <div className='text-right'><p className='font-black text-lg tabular-nums font-mono'>{audit.counted_amount.toLocaleString()} ₲</p><Badge className={`${audit.difference === 0 ? 'bg-green-50 text-success border-green-200' : 'bg-red-50 text-error border-red-200'} uppercase font-black text-[9px] px-2 py-0.5 rounded-full border`}>{audit.difference === 0 ? 'Sin Discrepancia' : `Diferencia: ${audit.difference.toLocaleString()} ₲`}</Badge></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-border-subtle flex flex-row items-center justify-between"><div><CardTitle className="text-xl font-black tracking-tighter uppercase">Historial de Cajas</CardTitle><CardDescription className="text-[10px] font-bold uppercase tracking-widest">Cierres y arqueos anteriores</CardDescription></div><Button variant='ghost' size='sm' onClick={getCashRegisters} disabled={isCashRegistersLoading} className="text-primary font-black uppercase text-[10px] tracking-widest"><History size={14} className="mr-2" /> Actualizar</Button></CardHeader>
          <CardContent className="p-0">
            {cashRegisters && cashRegisters.length > 0 ? (
              <div className='divide-y divide-border-subtle'>
                {cashRegisters.map(cr => (
                  <div key={cr.id} className='p-4 flex items-center justify-between hover:bg-slate-50 transition-colors'>
                    <div><p className='font-bold text-sm'>{cr.name}</p><p className='text-[10px] font-bold uppercase text-text-secondary tracking-widest mt-0.5'>{new Date(cr.opened_at).toLocaleDateString()} {cr.closed_at && `- ${new Date(cr.closed_at).toLocaleDateString()}`} {cr.location && `• ${cr.location}`}</p></div>
                    <div className='flex items-center gap-4'><div className='text-right'><p className='font-black font-mono text-sm tabular-nums'>₲ {(cr.current_balance || 0).toLocaleString()}</p></div>{getStatusBadge(cr.status)}</div>
                  </div>
                ))}
              </div>
            ) : <div className='py-12 text-center text-text-secondary font-bold italic uppercase text-xs tracking-widest'>No hay historial de cajas</div>}
          </CardContent>
        </Card>
      </div>

      {movementDialog && (
        <div className={getOverlayClasses()} onClick={() => setMovementDialog(false)}>
          <div className={`${styles.card()} w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-fluent-16`} onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between p-6 border-b border-border-subtle bg-slate-50/50'><div><h2 className='text-lg font-black tracking-tighter uppercase'>Registrar Movimiento</h2><p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Entrada o salida manual de efectivo</p></div><button onClick={() => setMovementDialog(false)} className='text-text-secondary hover:text-text-main transition-colors'><XCircle className='w-5 h-5' /></button></div>
            <div className='p-8 space-y-6'>
              {isRegisteringMovement ? <div className='py-12 text-center'><Clock className='animate-spin text-primary mx-auto mb-4' /><p className='text-xs font-black uppercase tracking-widest text-slate-400'>Procesando...</p></div> : (
                <form onSubmit={handleRegisterMovement} className='space-y-6'>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tipo de Movimiento</Label><Select value={movementForm.movement_type} onValueChange={v => setMovementForm(prev => ({...prev, movement_type: v}))} required><SelectTrigger className="rounded border-border-subtle font-bold h-11"><SelectValue placeholder='Seleccione el tipo' /></SelectTrigger><SelectContent className="rounded-xl shadow-fluent-16 border-border-subtle"><SelectItem value='INCOME' className="font-bold text-xs uppercase tracking-wider">Ingreso (+)</SelectItem><SelectItem value='EXPENSE' className="font-bold text-xs uppercase tracking-wider">Gasto (-)</SelectItem><SelectItem value='ADJUSTMENT' className="font-bold text-xs uppercase tracking-wider">Ajuste (+/-)</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Monto (₲)</Label><Input type='number' step='0.01' value={movementForm.amount} onChange={e => setMovementForm(prev => ({...prev, amount: e.target.value}))} placeholder='0.00' className="rounded border-border-subtle font-mono font-bold text-lg" required /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Concepto</Label><Input value={movementForm.concept} onChange={e => setMovementForm(prev => ({...prev, concept: e.target.value}))} placeholder='Descripción breve' className="rounded border-border-subtle font-bold" required /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas</Label><Textarea value={movementForm.notes} onChange={e => setMovementForm(prev => ({...prev, notes: e.target.value}))} placeholder='Detalles adicionales...' rows={2} className="rounded border-border-subtle resize-none" /></div>
                </form>
              )}
            </div>
            <div className='flex gap-3 justify-end p-6 border-t border-border-subtle bg-slate-50/50'><Button variant='outline' onClick={() => setMovementDialog(false)} disabled={isRegisteringMovement} className="font-black uppercase text-[10px] tracking-widest border-border-subtle">Cancelar</Button><Button onClick={handleRegisterMovement} disabled={isRegisteringMovement} className="bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-fluent-2">Registrar</Button></div>
          </div>
        </div>
      )}

      {closeCashRegisterDialog && (
        <div className={getOverlayClasses()} onClick={() => setCloseCashRegisterDialog(false)}>
          <div className={`${styles.card()} w-full max-w-lg rounded-xl shadow-fluent-16 overflow-hidden`} onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between p-6 border-b border-border-subtle bg-amber-50/50'><div className='flex items-center gap-3'><div className='size-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600'><AlertCircle size={20} /></div><div><h2 className='text-lg font-black tracking-tighter uppercase'>Cerrar Caja</h2><p className='text-[10px] font-bold uppercase tracking-widest text-amber-700'>Finalizar jornada operativa</p></div></div><button onClick={() => setCloseCashRegisterDialog(false)} className='text-amber-400 hover:text-amber-600 transition-colors'><XCircle className='w-5 h-5' /></button></div>
            <div className='p-8 space-y-6'>
              {isClosingCashRegister ? <div className='py-12 text-center'><Clock className='animate-spin text-amber-600 mx-auto mb-4' /><p className='text-xs font-black uppercase tracking-widest text-amber-400'>Cerrando...</p></div> : (
                <form id='close-cash-form' onSubmit={handleCloseCashRegister} className='space-y-6'>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Balance Final Físico</Label><Input type='number' step='0.01' value={closeCashRegisterForm.final_balance} onChange={e => setCloseCashRegisterForm(prev => ({...prev, final_balance: e.target.value}))} placeholder='0.00' className="rounded border-border-subtle font-mono font-bold text-lg" required /><p className='text-[10px] text-slate-400 font-bold uppercase mt-2'>Balance del sistema: ₲ {activeCashRegister?.current_balance?.toLocaleString() || 0}</p></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas de Cierre</Label><Textarea value={closeCashRegisterForm.notes} onChange={e => setCloseCashRegisterForm(prev => ({...prev, notes: e.target.value}))} placeholder='Observaciones...' rows={3} className="rounded border-border-subtle resize-none" /></div>
                </form>
              )}
            </div>
            <div className='flex gap-3 justify-end p-6 border-t border-border-subtle bg-slate-50/50'><Button variant='outline' onClick={() => setCloseCashRegisterDialog(false)} disabled={isClosingCashRegister} className="font-black uppercase text-[10px] tracking-widest border-border-subtle">Cancelar</Button><Button type='submit' form='close-cash-form' disabled={isClosingCashRegister} className="bg-error hover:bg-error/90 text-white font-black uppercase text-[10px] tracking-widest shadow-fluent-2">Cerrar Caja Registradora</Button></div>
          </div>
        </div>
      )}

      {summaryDialog && (
        <div className={getOverlayClasses()} onClick={() => setSummaryDialog(false)}>
          <div className={`${styles.card()} w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-fluent-16`} onClick={e => e.stopPropagation()}>
            <div className='flex items-center justify-between p-6 border-b border-border-subtle bg-slate-50/50'><div className='flex items-center gap-3'><div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary'><Calculator size={20} /></div><div><h2 className='text-lg font-black tracking-tighter uppercase'>Reporte de Caja</h2><p className='text-[10px] font-bold uppercase tracking-widest text-text-secondary'>Desglose financiero detallado</p></div></div><button onClick={() => setSummaryDialog(false)} className='text-text-secondary hover:text-text-main transition-colors'><XCircle className='w-5 h-5' /></button></div>
            <div className='p-8 space-y-8'>
              {cashRegisterSummary && (
                <div className='space-y-8'>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='p-4 bg-slate-50 rounded-lg border border-border-subtle'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1'>Ingresos</p><p className='text-lg font-black text-success font-mono'>₲ {cashRegisterSummary.summary?.total_income?.toLocaleString() || 0}</p></div>
                    <div className='p-4 bg-slate-50 rounded-lg border border-border-subtle'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1'>Gastos</p><p className='text-lg font-black text-error font-mono'>₲ {cashRegisterSummary.summary?.total_expenses?.toLocaleString() || 0}</p></div>
                    <div className='p-4 bg-slate-50 rounded-lg border border-border-subtle'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1'>Transacciones</p><p className='text-lg font-black text-info font-mono'>{cashRegisterSummary.summary?.transaction_count || 0}</p></div>
                    <div className='p-4 bg-slate-50 rounded-lg border border-border-subtle'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1'>Cambio Neto</p><p className='text-lg font-black text-primary font-mono'>₲ {cashRegisterSummary.summary?.net_change?.toLocaleString() || 0}</p></div>
                  </div>
                  <div className='space-y-4'><h4 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]'>Por Categoría</h4><div className='grid grid-cols-1 md:grid-cols-2 gap-3'>{Object.entries(cashRegisterSummary.by_category || {}).map(([cat, amount]) => (<div key={cat} className='flex items-center justify-between p-3 border border-border-subtle rounded-lg'><span className='text-xs font-bold uppercase tracking-wider'>{cat}</span><span className='font-black font-mono text-sm'>₲ {amount.toLocaleString()}</span></div>))}</div></div>
                </div>
              )}
            </div>
            <div className='flex justify-end p-6 border-t border-border-subtle bg-slate-50/50'><Button onClick={() => setSummaryDialog(false)} className="bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest h-10 px-8 rounded shadow-fluent-2">Cerrar</Button></div>
          </div>
        </div>
      )}

      <CashAuditModal 
        isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} cashRegisterId={activeCashRegister?.id} systemBalance={activeCashRegister?.current_balance || 0} onAuditCreated={() => getAudits(activeCashRegister?.id)}
      />
    </div>
  )
}

export default CashRegister
