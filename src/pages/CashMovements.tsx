/**
 * Cash Movements Page - v3.0
 * Página de Movimientos de Caja con filtros avanzados y anulación
 * 
 * Migrated to TypeScript & Fluent Design System 2.0
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import SegmentedControl from '@/components/ui/SegmentedControl'
import DataState from '@/components/ui/DataState'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'
import { cashRegisterService } from '@/services/cashRegisterService'
import { CashRegister, Movement } from '@/store/useCashRegisterStore'
import { 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Plus, 
  History, 
  Banknote, 
  XCircle, 
  CheckCircle2,
  Wallet,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react'

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
  const { t } = useI18n()
  const navigate = useNavigate()
  const { addToast, toasts, removeToast } = useToast()

  // State
  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null)
  const [isLoadingCashRegister, setIsLoadingCashRegister] = useState(true)
  const [movements, setMovements] = useState<Movement[]>([])
  const [isLoadingMovements, setIsLoadingMovements] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({ type: '', date_from: '', date_to: '' })
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false)
  const [newMovementForm, setNewMovementForm] = useState<NewMovementForm>({
    movement_type: 'INCOME',
    concept: '',
    amount: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voidDialog, setVoidDialog] = useState<VoidDialog>({
    isOpen: false,
    movement: null,
    reason: '',
    isSubmitting: false,
  })

  // Data helpers
  const movementTypes: any[] = [
    { value: 'INCOME', label: t('cashMovement.type.income', 'Ingreso') },
    { value: 'EXPENSE', label: t('cashMovement.type.expense', 'Egreso') },
  ]

  const concepts: Record<'INCOME' | 'EXPENSE', {id: string, name: string}[]> = {
    INCOME: [
      { id: 'cash_deposit', name: t('cashMovement.concept.deposit', 'Depósito de efectivo') },
      { id: 'reposition', name: t('cashMovement.concept.reposition', 'Reposición de caja') },
      { id: 'adjustment_positive', name: t('cashMovement.concept.adjustmentPositive', '[Ajuste] Corrección de saldo') },
      { id: 'other_income', name: t('cashMovement.concept.otherIncome', 'Otro ingreso') },
    ],
    EXPENSE: [
      { id: 'cash_withdrawal', name: t('cashMovement.concept.withdrawal', 'Retiro de efectivo') },
      { id: 'purchase', name: t('cashMovement.concept.purchase', 'Compra de insumos') },
      { id: 'service_payment', name: t('cashMovement.concept.service', 'Pago de servicio') },
      { id: 'adjustment_negative', name: t('cashMovement.concept.adjustmentNegative', '[Ajuste] Corrección de saldo') },
      { id: 'other_expense', name: t('cashMovement.concept.otherExpense', 'Otro egreso') },
    ],
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getMovementDisplay = (type: string) => {
    const displays: Record<string, any> = {
      INCOME: {
        icon: <ArrowUp className='w-3.5 h-3.5' />,
        variant: 'success',
        label: t('cashMovement.type.income', 'Ingreso'),
        colorClass: 'text-success bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800',
      },
      EXPENSE: {
        icon: <ArrowDown className='w-3.5 h-3.5' />,
        variant: 'destructive',
        label: t('cashMovement.type.expense', 'Egreso'),
        colorClass: 'text-error bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800',
      },
    }
    return displays[type] || displays.INCOME
  }

  // API Calls
  const loadActiveCashRegister = useCallback(async () => {
    setIsLoadingCashRegister(true)
    try {
      const result = await cashRegisterService.getActiveCashRegister()
      setActiveCashRegister(result)
    } catch (error) {
      console.error('Error loading active cash register:', error)
      addToast(t('cashMovement.error.loadingCashRegister', 'Error al cargar la caja registradora'), 'error')
    } finally {
      setIsLoadingCashRegister(false)
    }
  }, [addToast, t])

  const loadMovements = useCallback(async (applyFilters = false) => {
    if (!activeCashRegister?.id) return
    setIsLoadingMovements(true)
    try {
      let result
      if (applyFilters && (filters.type || filters.date_from || filters.date_to)) {
        const filterParams: any = {}
        if (filters.type) filterParams.type = filters.type
        if (filters.date_from) filterParams.date_from = filters.date_from
        if (filters.date_to) filterParams.date_to = filters.date_to
        result = await cashRegisterService.getFilteredMovements(activeCashRegister.id, filterParams)
      } else {
        result = await cashRegisterService.getMovements(activeCashRegister.id)
      }
      setMovements(result || [])
    } catch (error) {
      console.error('Error loading movements:', error)
      addToast(t('cashMovement.error.loadingMovements', 'Error al cargar los movimientos'), 'error')
    } finally {
      setIsLoadingMovements(false)
    }
  }, [activeCashRegister?.id, filters, addToast, t])

  useEffect(() => { loadActiveCashRegister() }, [loadActiveCashRegister])
  useEffect(() => { if (activeCashRegister?.id) loadMovements() }, [activeCashRegister?.id, loadMovements])

  // Handlers
  const handleFilterChange = (field: keyof Filters, value: string) => setFilters(prev => ({ ...prev, [field]: value }))
  const handleApplyFilters = () => { loadMovements(true); setIsFiltersOpen(false); }
  const handleClearFilters = () => { setFilters({ type: '', date_from: '', date_to: '' }); loadMovements(false); setIsFiltersOpen(false); }
  const handleNewMovementChange = (field: keyof NewMovementForm, value: string) => setNewMovementForm(prev => ({ ...prev, [field]: value }))
  const handleTypeChange = (value: string) => setNewMovementForm(prev => ({ ...prev, movement_type: value as 'INCOME' | 'EXPENSE', concept: '' }))

  const handleSubmitNewMovement = async () => {
    if (!activeCashRegister?.id) return addToast(t('cashMovement.error.noActiveCashRegister', 'No hay caja registradora activa'), 'error')
    const amount = parseFloat(parseFormattedNumber(newMovementForm.amount))
    if (!amount || amount <= 0) return addToast(t('cashMovement.error.invalidAmount', 'El monto debe ser mayor a 0'), 'error')
    if (!newMovementForm.concept) return addToast(t('cashMovement.error.noConcept', 'Debe seleccionar un concepto'), 'error')

    setIsSubmitting(true)
    try {
      const conceptLabel = concepts[newMovementForm.movement_type]?.find(c => c.id === newMovementForm.concept)?.name || newMovementForm.concept
      await cashRegisterService.createMovement({
        cash_register_id: activeCashRegister.id,
        movement_type: newMovementForm.movement_type,
        amount: amount,
        category: newMovementForm.concept,
        concept: conceptLabel + (newMovementForm.notes ? ` - ${newMovementForm.notes}` : ''),
      })
      addToast(t('cashMovement.success', 'Movimiento registrado con éxito'), 'success')
      setNewMovementForm({ movement_type: 'INCOME', concept: '', amount: '', notes: '' })
      setIsNewMovementOpen(false)
      loadMovements()
    } catch (error: any) {
      addToast(error.message || t('cashMovement.error.generic', 'Error al registrar el movimiento'), 'error')
    } finally { setIsSubmitting(false) }
  }

  const handleOpenVoidDialog = (movement: Movement) => setVoidDialog({ isOpen: true, movement, reason: '', isSubmitting: false })

  const handleVoidMovement = async () => {
    if (!voidDialog.movement || voidDialog.reason.length < 5) return addToast(t('cashMovement.void.reasonRequired', 'La razón debe tener al menos 5 caracteres'), 'error')
    setVoidDialog(prev => ({ ...prev, isSubmitting: true }))
    try {
      await cashRegisterService.voidMovement(voidDialog.movement.movement_id as number, voidDialog.reason)
      addToast(t('cashMovement.void.success', 'Movimiento anulado correctamente'), 'success')
      setVoidDialog({ isOpen: false, movement: null, reason: '', isSubmitting: false })
      loadMovements()
    } catch (error: any) {
      addToast(error.message || t('cashMovement.void.error', 'Error al anular el movimiento'), 'error')
      setVoidDialog(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  if (isLoadingCashRegister) return <div className='p-12'><DataState variant='loading' message={t('common.loading', 'Cargando...')} /></div>

  if (!activeCashRegister) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in fade-in duration-500 font-display'>
        <Card className="border-none bg-surface dark:bg-slate-900 rounded-3xl shadow-fluent-16 overflow-hidden max-w-md w-full">
          <CardContent className='p-12 text-center flex flex-col items-center'>
            <div className="size-24 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-8 border border-primary/10 shadow-inner">
              <Wallet className='w-12 h-12' />
            </div>
            <h2 className="text-2xl font-black text-text-main tracking-tighter uppercase mb-3">No hay caja activa</h2>
            <p className="text-text-secondary text-sm font-medium mb-10 leading-relaxed">Para visualizar o registrar movimientos financieros, debe tener una sesión de caja abierta actualmente.</p>
            <Button onClick={() => navigate('/caja-registradora')} className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-fluent-8 transition-all active:scale-95">
              Ir a Caja Registradora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasActiveFilters = filters.type || filters.date_from || filters.date_to

  return (
    <div className='flex flex-col gap-8 animate-in fade-in duration-500 font-display bg-background-light dark:bg-background-dark min-h-full'>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Header with Fluent 2.0 styling */}
      <header className='flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div className='space-y-2'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary'>
              <History className='w-6 h-6' />
            </div>
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>
              Movimientos de Caja
            </h1>
          </div>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-text-secondary'>
            <span className='flex items-center gap-1.5'><span className='size-1.5 rounded-full bg-success'></span> {activeCashRegister.name}</span>
            <span className='text-slate-300'>|</span>
            <span className='flex items-center gap-1.5 text-primary'>Saldo: <span className='font-mono text-xs font-black'>{formatCurrency(activeCashRegister.current_balance || activeCashRegister.initial_balance || 0)}</span></span>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`h-11 px-5 font-black uppercase tracking-widest text-[10px] rounded-lg border-border-subtle bg-white dark:bg-slate-900 transition-all ${
              hasActiveFilters ? 'border-primary text-primary bg-primary/5' : ''
            }`}
          >
            <Filter className='w-4 h-4 mr-2' />
            {t('common.filters', 'Filtros')}
            {hasActiveFilters && <span className='size-2 rounded-full bg-primary animate-pulse ml-2' />}
          </Button>
          <Button
            onClick={() => setIsNewMovementOpen(true)}
            className='h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-lg shadow-fluent-8 bg-primary hover:bg-primary-hover text-white transition-all active:scale-95'
          >
            <Plus className='w-4 h-4 mr-2' />
            {t('cashMovement.newMovement', 'Nuevo Movimiento')}
          </Button>
        </div>
      </header>

      {/* Filters Panel with Fluent refinement */}
      {isFiltersOpen && (
        <div className='bg-surface dark:bg-slate-900/50 p-8 rounded-2xl border border-border-subtle shadow-fluent-2 space-y-6 animate-in slide-in-from-top-4 duration-300'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='space-y-2.5'>
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tipo de Movimiento</Label>
              <Select value={filters.type} onValueChange={value => handleFilterChange('type', value)}>
                <SelectTrigger className="h-11 bg-white dark:bg-slate-950 border-border-subtle rounded-xl font-bold">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent className='rounded-xl shadow-fluent-16 border-border-subtle'>
                  <SelectItem value='INCOME' className="font-bold text-xs uppercase tracking-wider">Ingresos (+)</SelectItem>
                  <SelectItem value='EXPENSE' className="font-bold text-xs uppercase tracking-wider">Egresos (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2.5'>
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Desde Fecha</Label>
              <div className='relative'>
                <Calendar className='absolute left-3.5 top-3 text-slate-400 w-4 h-4' />
                <Input type='date' value={filters.date_from} onChange={e => handleFilterChange('date_from', e.target.value)} className="h-11 pl-10 bg-white dark:bg-slate-950 border-border-subtle rounded-xl font-mono font-bold" />
              </div>
            </div>

            <div className='space-y-2.5'>
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Hasta Fecha</Label>
              <div className='relative'>
                <Calendar className='absolute left-3.5 top-3 text-slate-400 w-4 h-4' />
                <Input type='date' value={filters.date_to} onChange={e => handleFilterChange('date_to', e.target.value)} className="h-11 pl-10 bg-white dark:bg-slate-950 border-border-subtle rounded-xl font-mono font-bold" />
              </div>
            </div>
          </div>

          <div className='flex justify-end gap-4 pt-6 border-t border-border-subtle/50'>
            <Button variant='ghost' onClick={handleClearFilters} className="h-10 px-6 font-black uppercase tracking-widest text-[10px] text-text-secondary hover:text-text-main">
              Limpiar
            </Button>
            <Button onClick={handleApplyFilters} className="h-10 px-10 bg-primary/10 hover:bg-primary/20 text-primary font-black uppercase tracking-widest text-[10px] rounded-lg">
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Movements Data Grid */}
      <Card className='bg-surface dark:bg-slate-900 rounded-2xl border-none shadow-fluent-2 overflow-hidden'>
        {isLoadingMovements ? (
          <div className="py-32">
            <DataState variant='loading' message="Analizando historial..." />
          </div>
        ) : movements.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center">
            <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 border border-border-subtle shadow-inner">
              <Search className='w-10 h-10' />
            </div>
            <h3 className="text-xl font-black text-text-main uppercase tracking-tighter">Sin movimientos</h3>
            <p className="text-text-secondary text-sm font-medium mt-2">No se encontraron registros que coincidan con los criterios.</p>
            {hasActiveFilters && (
              <Button variant='link' onClick={handleClearFilters} className='mt-4 text-primary font-black uppercase text-[10px] tracking-widest'>Ver todos los movimientos</Button>
            )}
          </div>
        ) : (
          <div className='overflow-x-auto custom-scrollbar'>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-border-subtle">
                  <TableHead className='py-5 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 w-[200px]'>
                    Fecha y Hora
                  </TableHead>
                  <TableHead className='py-5 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400'>
                    Concepto Operativo
                  </TableHead>
                  <TableHead className='py-5 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center'>
                    Tipo
                  </TableHead>
                  <TableHead className='py-5 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right'>
                    Monto
                  </TableHead>
                  <TableHead className='py-5 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-[120px]'>
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='divide-y divide-border-subtle/30'>
                {movements.map(movement => {
                  const display = getMovementDisplay(movement.movement_type)
                  const isVoided = !!movement.voided_at

                  return (
                    <TableRow
                      key={movement.movement_id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group ${
                        isVoided ? 'opacity-40 grayscale pointer-events-none' : ''
                      }`}
                    >
                      <TableCell className='py-5 px-6'>
                        <div className='flex flex-col gap-1'>
                          <span className='font-mono text-xs font-black text-text-main'>{formatDate(movement.created_at)}</span>
                          <span className='text-[9px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1.5'>
                            <span className='size-1 rounded-full bg-slate-300'></span> {movement.user_full_name || 'Sistema'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='py-5 px-6'>
                        <div className='flex flex-col gap-1'>
                          <span className='font-black text-sm text-text-main group-hover:text-primary transition-colors'>
                            {movement.concept}
                          </span>
                          {isVoided && (
                            <span className='inline-flex items-center gap-1.5 text-[9px] text-error font-black uppercase tracking-widest bg-error/10 px-2 py-0.5 rounded'>
                              <XCircle className='w-2.5 h-2.5' /> ANULADO: {movement.void_reason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='py-5 px-6 text-center'>
                        <Badge variant={display.variant} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${display.colorClass}`}>
                          {display.icon}
                          {display.label}
                        </Badge>
                      </TableCell>
                      <TableCell className='py-5 px-6 text-right'>
                        <div className='flex flex-col gap-1'>
                          <span className={`font-mono text-lg font-black tabular-nums tracking-tight ${display.variant === 'success' ? 'text-success' : 'text-error'}`}>
                            {display.variant === 'success' ? '+' : '-'} {formatCurrency(movement.amount)}
                          </span>
                          <span className='text-[9px] font-bold uppercase text-slate-400 tracking-widest'>Bal: {formatCurrency(movement.running_balance || 0)}</span>
                        </div>
                      </TableCell>
                      <TableCell className='py-5 px-6 text-center'>
                        {!isVoided && (
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleOpenVoidDialog(movement)}
                            className='size-9 rounded-xl text-slate-300 hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-error/20'
                            title='Anular Movimiento'
                          >
                            <XCircle className='w-5 h-5' />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* New Movement Dialog - Refined with Fluent 2.0 */}
      <Dialog open={isNewMovementOpen} onOpenChange={setIsNewMovementOpen}>
        <DialogContent className='rounded-3xl border-none bg-surface dark:bg-background-dark shadow-fluent-16 max-w-xl p-0 overflow-hidden font-display'>
          <DialogHeader className="p-8 pb-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-subtle text-left">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/10 shadow-inner">
                <Banknote className='w-7 h-7' />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter uppercase text-text-main">
                  {t('cashMovement.newMovement', 'Nuevo Movimiento')}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1">
                  Registro manual de entrada o salida de efectivo
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className='p-8 space-y-8'>
            <div className='space-y-3'>
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">
                Tipo de Transacción
              </Label>
              <SegmentedControl
                options={movementTypes}
                value={newMovementForm.movement_type}
                onChange={handleTypeChange}
                className='h-12 bg-slate-100 dark:bg-slate-900 rounded-xl p-1.5'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <div className='space-y-3'>
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1" htmlFor='concept'>
                  Concepto Operativo
                </Label>
                <Select value={newMovementForm.concept} onValueChange={value => handleNewMovementChange('concept', value)}>
                  <SelectTrigger id='concept' className="h-12 border-border-subtle rounded-xl font-bold bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/10">
                    <SelectValue placeholder="Seleccione un motivo..." />
                  </SelectTrigger>
                  <SelectContent className='rounded-xl shadow-fluent-16 border-border-subtle'>
                    {concepts[newMovementForm.movement_type].map(concept => (
                      <SelectItem key={concept.id} value={concept.id} className="font-bold text-xs uppercase tracking-wider py-3">
                        {concept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-3'>
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1" htmlFor='amount'>
                  Monto de la Operación
                </Label>
                <div className='relative'>
                  <span className='absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black'>₲</span>
                  <Input
                    id='amount'
                    type='text'
                    inputMode='numeric'
                    value={formatNumber(newMovementForm.amount)}
                    onChange={e => handleNewMovementChange('amount', e.target.value)}
                    placeholder='0'
                    className='h-12 pl-10 font-mono font-black text-lg border-border-subtle rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/10'
                  />
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1" htmlFor='notes'>
                Detalles Adicionales
              </Label>
              <Textarea
                id='notes'
                placeholder="Añada cualquier información relevante para auditoría..."
                value={newMovementForm.notes}
                onChange={e => handleNewMovementChange('notes', e.target.value)}
                className='resize-none rounded-xl border-border-subtle bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/10 min-h-[100px] p-4'
              />
            </div>
          </div>

          <DialogFooter className='p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-border-subtle flex items-center gap-4'>
            <Button
              variant='outline'
              onClick={() => setIsNewMovementOpen(false)}
              className='flex-1 h-12 border-border-subtle font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white transition-all'
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitNewMovement}
              disabled={isSubmitting}
              className='flex-1 h-12 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-fluent-8 transition-all active:scale-95'
            >
              {isSubmitting ? <RefreshCw className="animate-spin mr-2 w-4 h-4" /> : <CheckCircle2 className="mr-2 w-4 h-4" />}
              Guardar Movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Movement Dialog */}
      <Dialog
        open={voidDialog.isOpen}
        onOpenChange={isOpen => !isOpen && setVoidDialog(prev => ({ ...prev, isOpen }))}
      >
        <DialogContent className='rounded-3xl border-none bg-surface dark:bg-background-dark shadow-fluent-16 max-w-md p-0 overflow-hidden font-display'>
          <DialogHeader className="p-8 pb-6 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/30 text-left">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-12 bg-red-100 dark:bg-red-800 rounded-xl flex items-center justify-center text-red-600 border border-red-200 shadow-inner">
                <XCircle className='w-7 h-7' />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter uppercase text-red-600">
                  Anular Movimiento
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-red-700/70 mt-1">
                  Esta acción es irreversible y afectará el saldo actual
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className='p-8 space-y-8'>
            {voidDialog.movement && (
              <div className='p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border-subtle space-y-3 relative overflow-hidden'>
                <div className='absolute left-0 top-0 w-1.5 h-full bg-slate-300'></div>
                <div className='flex justify-between items-start'>
                  <span className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Resumen del Registro</span>
                  <span className='font-mono text-[10px] font-black text-slate-400'>ID: {voidDialog.movement.movement_id}</span>
                </div>
                <p className='font-black text-sm text-text-main'>{voidDialog.movement.concept}</p>
                <p className='font-mono font-black text-lg text-text-main'>{formatCurrency(voidDialog.movement.amount)}</p>
              </div>
            )}

            <div className='space-y-3'>
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1" htmlFor='void-reason'>
                Razón de Anulación <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='void-reason'
                value={voidDialog.reason}
                onChange={e => setVoidDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ej: Error en el monto, concepto duplicado..."
                className='h-12 border-border-subtle rounded-xl font-bold bg-white dark:bg-slate-950 focus:ring-2 focus:ring-red-500/10'
              />
              <p className='text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1'>Mínimo 5 caracteres para auditoría</p>
            </div>
          </div>

          <DialogFooter className='p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-border-subtle flex items-center gap-4'>
            <Button
              variant='ghost'
              onClick={() => setVoidDialog({ isOpen: false, movement: null, reason: '', isSubmitting: false })}
              className='flex-1 h-12 font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white transition-all'
            >
              Cancelar
            </Button>
            <Button
              variant='destructive'
              onClick={handleVoidMovement}
              disabled={voidDialog.isSubmitting}
              className='flex-1 h-12 bg-error hover:bg-error/90 text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-fluent-8 transition-all active:scale-95'
            >
              {voidDialog.isSubmitting ? <RefreshCw className="animate-spin mr-2 w-4 h-4" /> : <CheckCircle2 className="mr-2 w-4 h-4" />}
              Confirmar Anulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CashMovements
