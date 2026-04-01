/**
 * Cash Movements Page - v2.2
 * Página de Movimientos de Caja con filtros avanzados y anulación
 *
 * Features:
 * - Vista de movimientos de la caja activa
 * - Filtros por tipo y rango de fechas
 * - Registro de nuevos movimientos manuales
 * - Anulación de movimientos con trazabilidad
 * - Estilos Fluent Design System 2
 * - i18n completo
 */

import { useState, useEffect, useCallback } from 'react'
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
import SegmentedControl from '@/components/ui/SegmentedControl'
import DataState from '@/components/ui/DataState'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'
import { cashRegisterService } from '@/services/cashRegisterService'

const CashMovements = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { addToast, toasts, removeToast } = useToast()

  // State for active cash register
  const [activeCashRegister, setActiveCashRegister] = useState(null)
  const [isLoadingCashRegister, setIsLoadingCashRegister] = useState(true)

  // State for movements
  const [movements, setMovements] = useState([])
  const [isLoadingMovements, setIsLoadingMovements] = useState(false)

  // State for filters
  const [filters, setFilters] = useState({
    type: '',
    date_from: '',
    date_to: '',
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // State for new movement dialog
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false)
  const [newMovementForm, setNewMovementForm] = useState({
    movement_type: 'INCOME',
    concept: '',
    amount: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for void movement dialog
  const [voidDialog, setVoidDialog] = useState({
    isOpen: false,
    movement: null,
    reason: '',
    isSubmitting: false,
  })

  // Movement types (API v2.3 - Solo INCOME y EXPENSE)
  const movementTypes = [
    { value: 'INCOME', label: t('cashMovement.type.income', 'Ingreso') },
    { value: 'EXPENSE', label: t('cashMovement.type.expense', 'Egreso') },
  ]

  // Predefined concepts (API v2.3 - Ajustes con prefijo [Ajuste])
  const concepts = {
    INCOME: [
      {
        id: 'cash_deposit',
        name: t('cashMovement.concept.deposit', 'Depósito de efectivo'),
      },
      {
        id: 'reposition',
        name: t('cashMovement.concept.reposition', 'Reposición de caja'),
      },
      {
        id: 'adjustment_positive',
        name: t(
          'cashMovement.concept.adjustmentPositive',
          '[Ajuste] Corrección de saldo'
        ),
      },
      {
        id: 'other_income',
        name: t('cashMovement.concept.otherIncome', 'Otro ingreso'),
      },
    ],
    EXPENSE: [
      {
        id: 'cash_withdrawal',
        name: t('cashMovement.concept.withdrawal', 'Retiro de efectivo'),
      },
      {
        id: 'purchase',
        name: t('cashMovement.concept.purchase', 'Compra de insumos'),
      },
      {
        id: 'service_payment',
        name: t('cashMovement.concept.service', 'Pago de servicio'),
      },
      {
        id: 'adjustment_negative',
        name: t(
          'cashMovement.concept.adjustmentNegative',
          '[Ajuste] Corrección de saldo'
        ),
      },
      {
        id: 'other_expense',
        name: t('cashMovement.concept.otherExpense', 'Otro egreso'),
      },
    ],
  }

  // Format currency
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format number with thousand separators
  const formatNumber = value => {
    if (!value) return ''
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    return Number(numericValue).toLocaleString('es-PY')
  }

  const parseFormattedNumber = formattedValue => {
    if (!formattedValue) return ''
    return formattedValue.replace(/\./g, '').replace(/,/g, '')
  }

  // Format date
  const formatDate = dateString => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Get movement display info
  const getMovementDisplay = type => {
    const displays = {
      INCOME: {
        icon: <span className="material-icons-round text-[16px]">arrow_upward</span>,
        variant: 'success',
        label: t('cashMovement.type.income', 'Ingreso'),
        className: 'movement-badge--income',
      },
      EXPENSE: {
        icon: <span className="material-icons-round text-[16px]">arrow_downward</span>,
        variant: 'destructive',
        label: t('cashMovement.type.expense', 'Egreso'),
        className: 'movement-badge--expense',
      },
    }
    return displays[type] || displays.INCOME
  }

  // Load active cash register
  const loadActiveCashRegister = useCallback(async () => {
    setIsLoadingCashRegister(true)
    try {
      const result = await cashRegisterService.getActiveCashRegister()
      setActiveCashRegister(result)
    } catch (error) {
      console.error('Error loading active cash register:', error)
      addToast(
        t(
          'cashMovement.error.loadingCashRegister',
          'Error al cargar la caja registradora'
        ),
        'error'
      )
    } finally {
      setIsLoadingCashRegister(false)
    }
  }, [addToast, t])

  // Load movements
  const loadMovements = useCallback(
    async (applyFilters = false) => {
      if (!activeCashRegister?.id) return

      setIsLoadingMovements(true)
      try {
        let result
        if (
          applyFilters &&
          (filters.type || filters.date_from || filters.date_to)
        ) {
          // Use filtered endpoint
          const filterParams = {}
          if (filters.type) filterParams.type = filters.type
          if (filters.date_from) filterParams.date_from = filters.date_from
          if (filters.date_to) filterParams.date_to = filters.date_to
          result = await cashRegisterService.getFilteredMovements(
            activeCashRegister.id,
            filterParams
          )
        } else {
          // Use standard endpoint
          result = await cashRegisterService.getMovements(activeCashRegister.id)
        }
        setMovements(result || [])
      } catch (error) {
        console.error('Error loading movements:', error)
        addToast(
          t(
            'cashMovement.error.loadingMovements',
            'Error al cargar los movimientos'
          ),
          'error'
        )
      } finally {
        setIsLoadingMovements(false)
      }
    },
    [activeCashRegister?.id, filters, addToast, t]
  )

  // Initial load
  useEffect(() => {
    loadActiveCashRegister()
  }, [loadActiveCashRegister])

  // Load movements when cash register is loaded
  useEffect(() => {
    if (activeCashRegister?.id) {
      loadMovements()
    }
  }, [activeCashRegister?.id, loadMovements])

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  // Apply filters
  const handleApplyFilters = () => {
    loadMovements(true)
    setIsFiltersOpen(false)
  }

  // Clear filters
  const handleClearFilters = () => {
    setFilters({ type: '', date_from: '', date_to: '' })
    loadMovements(false)
    setIsFiltersOpen(false)
  }

  // Handle new movement form change
  const handleNewMovementChange = (field, value) => {
    setNewMovementForm(prev => ({ ...prev, [field]: value }))
  }

  // Handle movement type change (reset concept)
  const handleTypeChange = value => {
    setNewMovementForm(prev => ({
      ...prev,
      movement_type: value,
      concept: '',
    }))
  }

  // Submit new movement
  const handleSubmitNewMovement = async () => {
    if (!activeCashRegister?.id) {
      addToast(
        t(
          'cashMovement.error.noActiveCashRegister',
          'No hay caja registradora activa'
        ),
        'error'
      )
      return
    }

    const amount = parseFloat(parseFormattedNumber(newMovementForm.amount))
    if (!amount || amount <= 0) {
      addToast(
        t(
          'cashMovement.error.invalidAmount',
          'El monto debe ser mayor a 0'
        ),
        'error'
      )
      return
    }

    if (!newMovementForm.concept) {
      addToast(
        t(
          'cashMovement.error.noConcept',
          'Debe seleccionar un concepto'
        ),
        'error'
      )
      return
    }

    setIsSubmitting(true)
    try {
      const conceptLabel =
        concepts[newMovementForm.movement_type]?.find(
          c => c.id === newMovementForm.concept
        )?.name || newMovementForm.concept

      await cashRegisterService.createMovement({
        cash_register_id: activeCashRegister.id,
        movement_type: newMovementForm.movement_type,
        amount: amount,
        category: newMovementForm.concept, // El ID del concepto seleccionado actúa como categoría
        concept:
          conceptLabel +
          (newMovementForm.notes ? ` - ${newMovementForm.notes}` : ''),
      })

      addToast(
        t('cashMovement.success', 'Movimiento registrado con éxito'),
        'success'
      )

      // Reset form and close dialog
      setNewMovementForm({
        movement_type: 'INCOME',
        concept: '',
        amount: '',
        notes: '',
      })
      setIsNewMovementOpen(false)

      // Reload movements
      loadMovements()
    } catch (error) {
      console.error('Error creating movement:', error)
      addToast(
        error.message ||
          t('cashMovement.error.generic', 'Error al registrar el movimiento'),
        'error'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open void dialog
  const handleOpenVoidDialog = movement => {
    setVoidDialog({
      isOpen: true,
      movement,
      reason: '',
      isSubmitting: false,
    })
  }

  // Submit void movement
  const handleVoidMovement = async () => {
    if (
      !voidDialog.movement ||
      !voidDialog.reason ||
      voidDialog.reason.length < 5
    ) {
      addToast(
        t(
          'cashMovement.void.reasonRequired',
          'La razón debe tener al menos 5 caracteres'
        ),
        'error'
      )
      return
    }

    setVoidDialog(prev => ({ ...prev, isSubmitting: true }))
    try {
      await cashRegisterService.voidMovement(
        voidDialog.movement.movement_id,
        voidDialog.reason
      )

      addToast(
        t(
          'cashMovement.void.success',
          'Movimiento anulado correctamente'
        ),
        'success'
      )

      setVoidDialog({
        isOpen: false,
        movement: null,
        reason: '',
        isSubmitting: false,
      })
      loadMovements()
    } catch (error) {
      console.error('Error voiding movement:', error)
      addToast(
        error.message ||
          t('cashMovement.void.error', 'Error al anular el movimiento'),
        'error'
      )
      setVoidDialog(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  // Check if there are active filters
  const hasActiveFilters = filters.type || filters.date_from || filters.date_to

  // Render loading state
  if (isLoadingCashRegister) {
    return (
      <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-sans p-6'>
        <DataState
          variant='loading'
          message={t('common.loading', 'Cargando...')}
        />
      </div>
    )
  }

  // Render no cash register state
  if (!activeCashRegister) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500 font-sans'>
        <div className='flex flex-col items-center text-center max-w-md'>
          <div className="size-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="material-icons-round text-[48px]">account_balance_wallet</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight">
            {t('cashMovement.noCashRegister.title', 'No hay caja activa')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {t(
              'cashMovement.noCashRegister.description',
              'Debe abrir una caja registradora para ver los movimientos'
            )}
          </p>
          <Button 
            onClick={() => navigate('/caja-registradora')}
            className="mt-6 h-11 font-semibold uppercase tracking-widest text-[11px] rounded-md shadow-sm px-8"
          >
            {t('cashMovement.noCashRegister.action', 'Ir a Caja Registradora')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-sans'>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Header */}
      <header className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6 py-2'>
        <div className='space-y-1'>
          <h1 className='text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight'>
            {t('cashMovement.pageTitle', 'Movimientos de Caja')}
          </h1>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            {t('cashMovement.pageSubtitle', 'Caja activa')}:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{activeCashRegister.name}</span>
            {' · '}
            {t('cashMovement.currentBalance', 'Saldo')}:{' '}
            <span className="font-mono font-semibold text-primary tabular-nums">
              {formatCurrency(
                activeCashRegister.current_balance ||
                  activeCashRegister.initial_balance ||
                  0
              )}
            </span>
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`h-10 px-4 font-semibold uppercase tracking-widest text-[10px] rounded-md border-slate-200 flex items-center gap-2 ${
              hasActiveFilters ? 'bg-primary/5 border-primary/20 text-primary' : ''
            }`}
          >
            <span className="material-icons-round text-[18px]">filter_alt</span>
            {t('common.filters', 'Filtros')}
            {hasActiveFilters && <span className='size-2 rounded-full bg-primary animate-pulse ml-1' />}
          </Button>
          <Button
            onClick={() => setIsNewMovementOpen(true)}
            className='h-10 px-4 font-semibold uppercase tracking-widest text-[10px] rounded-md shadow-sm flex items-center gap-2 bg-primary hover:bg-primary-hover text-white'
          >
            <span className="material-icons-round text-[18px]">add</span>
            {t('cashMovement.newMovement', 'Nuevo Movimiento')}
          </Button>
        </div>
      </header>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <div className='bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2 duration-200'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-1.5'>
              <Label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('cashMovement.filter.type', 'Tipo')}</Label>
              <Select
                value={filters.type}
                onValueChange={value => handleFilterChange('type', value)}
              >
                <SelectTrigger className="h-10 bg-white dark:bg-surface-dark border-slate-200 rounded-md">
                  <SelectValue
                    placeholder={t('cashMovement.filter.allTypes', 'Todos')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='INCOME'>
                    {t('cashMovement.type.income', 'Ingreso')}
                  </SelectItem>
                  <SelectItem value='EXPENSE'>
                    {t('cashMovement.type.expense', 'Egreso')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('cashMovement.filter.dateFrom', 'Desde')}</Label>
              <Input
                type='date'
                value={filters.date_from}
                onChange={e => handleFilterChange('date_from', e.target.value)}
                className="h-10 bg-white dark:bg-surface-dark border-slate-200 rounded-md"
              />
            </div>

            <div className='space-y-1.5'>
              <Label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 ml-1">{t('cashMovement.filter.dateTo', 'Hasta')}</Label>
              <Input
                type='date'
                value={filters.date_to}
                onChange={e => handleFilterChange('date_to', e.target.value)}
                className="h-10 bg-white dark:bg-surface-dark border-slate-200 rounded-md"
              />
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800'>
            <Button 
              variant='ghost' 
              onClick={handleClearFilters}
              className="h-9 font-semibold uppercase tracking-widest text-[10px]"
            >
              {t('common.clear', 'Limpiar')}
            </Button>
            <Button 
              onClick={handleApplyFilters}
              className="h-9 px-6 font-semibold uppercase tracking-widest text-[10px] rounded-md shadow-sm"
            >
              {t('common.apply', 'Aplicar')}
            </Button>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className='bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden'>
        {isLoadingMovements ? (
          <div className="py-20">
            <DataState
              variant='loading'
              message={t('common.loading', 'Cargando movimientos...')}
            />
          </div>
        ) : movements.length === 0 ? (
          <div className="py-20 text-center">
            <div className="size-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4 mx-auto border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="material-icons-round text-[32px]">history</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Sin movimientos</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">No se encontraron movimientos para los criterios seleccionados.</p>
          </div>
        ) : (
          <div className='overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800'>
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <TableHead className='py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 w-[180px]'>
                    {t('cashMovement.table.date', 'Fecha y Hora')}
                  </TableHead>
                  <TableHead className='py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500'>
                    {t('cashMovement.table.concept', 'Concepto')}
                  </TableHead>
                  <TableHead className='py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 text-center'>
                    {t('cashMovement.table.type', 'Tipo')}
                  </TableHead>
                  <TableHead className='py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 text-right'>
                    {t('cashMovement.table.amount', 'Monto')}
                  </TableHead>
                  <TableHead className='py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 text-center w-[100px]'>
                    {t('common.actions', 'Acciones')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map(movement => {
                  const display = getMovementDisplay(movement.movement_type)
                  const isVoided = !!movement.voided_at

                  return (
                    <TableRow
                      key={movement.movement_id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group ${
                        isVoided ? 'opacity-50 grayscale' : ''
                      }`}
                    >
                      <TableCell className='py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400'>
                        {formatDate(movement.created_at)}
                      </TableCell>
                      <TableCell className='py-2 px-3'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-slate-900 dark:text-white text-sm'>
                            {movement.concept}
                          </span>
                          {isVoided && (
                            <span className='text-[10px] text-red-500 font-semibold uppercase tracking-tighter'>
                              {t('cashMovement.voided', 'ANULADO')}:{' '}
                              {movement.void_reason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='py-2 px-3 text-center'>
                        <Badge
                          variant={display.variant}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${
                            display.variant === 'success' 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}
                        >
                          {display.icon}
                          {display.label}
                        </Badge>
                      </TableCell>
                      <TableCell className='py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums'>
                        {display.variant === 'success' ? '+' : '-'}
                        {formatCurrency(movement.amount)}
                      </TableCell>
                      <TableCell className='py-2 px-3 text-center'>
                        {!isVoided && (
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleOpenVoidDialog(movement)}
                            className='size-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100'
                            title={t('common.void', 'Anular')}
                          >
                            <span className="material-icons-round text-[18px]">block</span>
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
      </div>

      {/* New Movement Dialog */}
      <Dialog open={isNewMovementOpen} onOpenChange={setIsNewMovementOpen}>
        <DialogContent className='rounded-xl border-slate-200 dark:border-slate-800 shadow-md max-w-lg p-6 font-sans'>
          <DialogHeader className="gap-2 text-left mb-4">
            <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-1 border border-primary/10">
              <span className="material-icons-round text-[24px]">payments</span>
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {t('cashMovement.newMovement', 'Nuevo Movimiento')}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {t(
                'cashMovement.newDialogDescription',
                'Registre un ingreso o egreso de efectivo manualmente.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-5 py-2'>
            <div className='space-y-2'>
              <Label className="text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1">
                {t('cashMovement.field.type', 'Tipo de Movimiento')}
              </Label>
              <SegmentedControl
                options={movementTypes}
                value={newMovementForm.movement_type}
                onChange={handleTypeChange}
                className='h-10'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className="text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1" htmlFor='concept'>
                  {t('cashMovement.field.concept', 'Concepto')}
                </Label>
                <Select
                  value={newMovementForm.concept}
                  onValueChange={value =>
                    handleNewMovementChange('concept', value)
                  }
                >
                  <SelectTrigger id='concept' className="h-10 border-slate-200 rounded-md">
                    <SelectValue
                      placeholder={t('common.select', 'Seleccionar...')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {concepts[newMovementForm.movement_type].map(concept => (
                      <SelectItem key={concept.id} value={concept.id}>
                        {concept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label className="text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1" htmlFor='amount'>
                  {t('cashMovement.field.amount', 'Monto')}
                </Label>
                <div className='relative'>
                  <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-semibold'>
                    ₲
                  </span>
                  <Input
                    id='amount'
                    type='text'
                    inputMode='numeric'
                    value={formatNumber(newMovementForm.amount)}
                    onChange={e =>
                      handleNewMovementChange('amount', e.target.value)
                    }
                    placeholder='0'
                    className='h-10 pl-8 font-mono font-semibold tabular-nums border-slate-200 rounded-md'
                  />
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <Label className="text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1" htmlFor='notes'>
                {t('cashMovement.field.notes', 'Observaciones (opcional)')}
              </Label>
              <Textarea
                id='notes'
                placeholder={t(
                  'cashMovement.notesPlaceholder',
                  'Añada información adicional...'
                )}
                value={newMovementForm.notes}
                onChange={e => handleNewMovementChange('notes', e.target.value)}
                className='resize-none rounded-md border-slate-200'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className='mt-6 sm:justify-between items-center flex-row gap-3'>
            <Button
              variant='ghost'
              onClick={() => setIsNewMovementOpen(false)}
              className='font-medium text-xs h-10 flex-1 border border-transparent hover:border-slate-200'
            >
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              onClick={handleSubmitNewMovement}
              disabled={isSubmitting}
              className='bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-10 rounded-md px-6 shadow-sm flex-1 flex items-center justify-center gap-2'
            >
              {isSubmitting ? (
                <span className="material-icons-round text-[18px] animate-spin">refresh</span>
              ) : (
                <span className="material-icons-round text-[18px]">check_circle</span>
              )}
              {t('common.save', 'Guardar Movimiento')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog
        open={voidDialog.isOpen}
        onOpenChange={isOpen =>
          !isOpen && setVoidDialog(prev => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className='rounded-xl border-slate-200 dark:border-slate-800 shadow-md max-w-md p-6 font-sans'>
          <DialogHeader className="gap-2 text-left mb-4">
            <div className="size-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-600 mb-1 border border-red-100 dark:border-red-800">
              <span className="material-icons-round text-[24px]">block</span>
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight text-red-600">
              {t('cashMovement.void.title', 'Anular Movimiento')}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {t(
                'cashMovement.void.description',
                'Esta acción revertirá el efecto del movimiento en el saldo.'
              )}
            </DialogDescription>
          </DialogHeader>

          {voidDialog.movement && (
            <div className='bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md space-y-1 border border-slate-100 dark:border-slate-800 mb-4'>
              <p className='text-sm'>
                <strong className="font-semibold">{t('cashMovement.field.concept', 'Concepto')}:</strong>{' '}
                {voidDialog.movement.concept}
              </p>
              <p className='text-sm'>
                <strong className="font-semibold">{t('cashMovement.field.amount', 'Monto')}:</strong>{' '}
                <span className="font-mono font-semibold tabular-nums">{formatCurrency(voidDialog.movement.amount)}</span>
              </p>
            </div>
          )}

          <div className='space-y-2'>
            <Label className="text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1" htmlFor='void-reason'>
              {t('cashMovement.void.reason', 'Razón de anulación')} *
            </Label>
            <Input
              id='void-reason'
              value={voidDialog.reason}
              onChange={e =>
                setVoidDialog(prev => ({ ...prev, reason: e.target.value }))
              }
              placeholder={t(
                'cashMovement.void.reasonPlaceholder',
                'Ej: Error en el monto ingresado'
              )}
              className='h-10 border-slate-200 rounded-md'
            />
          </div>

          <DialogFooter className='mt-6 sm:justify-between items-center flex-row gap-3'>
            <Button
              variant='ghost'
              onClick={() =>
                setVoidDialog({
                  isOpen: false,
                  movement: null,
                  reason: '',
                  isSubmitting: false,
                })
              }
              className='font-medium text-xs h-10 flex-1 border border-transparent hover:border-slate-200'
            >
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleVoidMovement}
              disabled={voidDialog.isSubmitting}
              className='bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-10 rounded-md px-6 shadow-sm flex-1 flex items-center justify-center gap-2'
            >
              {voidDialog.isSubmitting ? (
                <span className="material-icons-round text-[18px] animate-spin">refresh</span>
              ) : (
                <span className="material-icons-round text-[18px]">check_circle</span>
              )}
              {t('common.confirm', 'Anular Ahora')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CashMovements
