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
import {
  ArrowDownIcon,
  ArrowUpIcon,
  RefreshCwIcon,
  PlusIcon,
  FilterIcon,
  BanIcon,
  WalletIcon,
} from 'lucide-react'
import '@/styles/scss/pages/_cash-movements.scss'

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

  // Movement types
  const movementTypes = [
    { value: 'INCOME', label: t('cashMovement.type.income', 'Ingreso') },
    { value: 'EXPENSE', label: t('cashMovement.type.expense', 'Egreso') },
    { value: 'ADJUSTMENT', label: t('cashMovement.type.adjustment', 'Ajuste') },
  ]

  // Predefined concepts
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
        id: 'other_expense',
        name: t('cashMovement.concept.otherExpense', 'Otro egreso'),
      },
    ],
    ADJUSTMENT: [
      {
        id: 'difference',
        name: t('cashMovement.concept.difference', 'Ajuste por diferencia'),
      },
      {
        id: 'correction',
        name: t('cashMovement.concept.correction', 'Corrección de saldo'),
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
        icon: <ArrowUpIcon className='w-4 h-4' />,
        variant: 'success',
        label: t('cashMovement.type.income', 'Ingreso'),
        className: 'movement-badge--income',
      },
      EXPENSE: {
        icon: <ArrowDownIcon className='w-4 h-4' />,
        variant: 'destructive',
        label: t('cashMovement.type.expense', 'Egreso'),
        className: 'movement-badge--expense',
      },
      ADJUSTMENT: {
        icon: <RefreshCwIcon className='w-4 h-4' />,
        variant: 'secondary',
        label: t('cashMovement.type.adjustment', 'Ajuste'),
        className: 'movement-badge--adjustment',
      },
      TRANSFER: {
        icon: <RefreshCwIcon className='w-4 h-4' />,
        variant: 'outline',
        label: t('cashMovement.type.transfer', 'Transferencia'),
        className: 'movement-badge--transfer',
      },
    }
    return displays[type] || displays.ADJUSTMENT
  }

  // Load active cash register
  const loadActiveCashRegister = useCallback(async () => {
    setIsLoadingCashRegister(true)
    try {
      const result = await cashRegisterService.getActiveCashRegister()
      setActiveCashRegister(result)
    } catch (error) {
      console.error('Error loading active cash register:', error)
      addToast({
        type: 'error',
        message: t(
          'cashMovement.error.loadingCashRegister',
          'Error al cargar la caja registradora'
        ),
      })
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
        addToast({
          type: 'error',
          message: t(
            'cashMovement.error.loadingMovements',
            'Error al cargar los movimientos'
          ),
        })
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
      addToast({
        type: 'error',
        message: t(
          'cashMovement.error.noActiveCashRegister',
          'No hay caja registradora activa'
        ),
      })
      return
    }

    const amount = parseFloat(parseFormattedNumber(newMovementForm.amount))
    if (!amount || amount <= 0) {
      addToast({
        type: 'error',
        message: t(
          'cashMovement.error.invalidAmount',
          'El monto debe ser mayor a 0'
        ),
      })
      return
    }

    if (!newMovementForm.concept) {
      addToast({
        type: 'error',
        message: t(
          'cashMovement.error.noConcept',
          'Debe seleccionar un concepto'
        ),
      })
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
        concept:
          conceptLabel +
          (newMovementForm.notes ? ` - ${newMovementForm.notes}` : ''),
      })

      addToast({
        type: 'success',
        message: t('cashMovement.success', 'Movimiento registrado con éxito'),
      })

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
      addToast({
        type: 'error',
        message:
          error.message ||
          t('cashMovement.error.generic', 'Error al registrar el movimiento'),
      })
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
      addToast({
        type: 'error',
        message: t(
          'cashMovement.void.reasonRequired',
          'La razón debe tener al menos 5 caracteres'
        ),
      })
      return
    }

    setVoidDialog(prev => ({ ...prev, isSubmitting: true }))
    try {
      await cashRegisterService.voidMovement(
        voidDialog.movement.movement_id,
        voidDialog.reason
      )

      addToast({
        type: 'success',
        message: t(
          'cashMovement.void.success',
          'Movimiento anulado correctamente'
        ),
      })

      setVoidDialog({
        isOpen: false,
        movement: null,
        reason: '',
        isSubmitting: false,
      })
      loadMovements()
    } catch (error) {
      console.error('Error voiding movement:', error)
      addToast({
        type: 'error',
        message:
          error.message ||
          t('cashMovement.void.error', 'Error al anular el movimiento'),
      })
      setVoidDialog(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  // Check if there are active filters
  const hasActiveFilters = filters.type || filters.date_from || filters.date_to

  // Render loading state
  if (isLoadingCashRegister) {
    return (
      <div className='cash-movements-page'>
        <DataState
          type='loading'
          message={t('common.loading', 'Cargando...')}
        />
      </div>
    )
  }

  // Render no cash register state
  if (!activeCashRegister) {
    return (
      <div className='cash-movements-page'>
        <div className='cash-movements-page__empty-state'>
          <WalletIcon className='cash-movements-page__empty-icon' />
          <h2>
            {t('cashMovement.noCashRegister.title', 'No hay caja activa')}
          </h2>
          <p>
            {t(
              'cashMovement.noCashRegister.description',
              'Debe abrir una caja registradora para ver los movimientos'
            )}
          </p>
          <Button onClick={() => navigate('/caja-registradora')}>
            {t('cashMovement.noCashRegister.action', 'Ir a Caja Registradora')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='cash-movements-page'>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header - mismo ancho que la card */}
      <div className='cash-movements-page__header'>
        <div className='cash-movements-page__header-content'>
          <h1 className='cash-movements-page__title'>
            {t('cashMovement.pageTitle', 'Movimientos de Caja')}
          </h1>
          <p className='cash-movements-page__description'>
            {t('cashMovement.pageSubtitle', 'Caja activa')}:{' '}
            <strong>{activeCashRegister.name}</strong>
            {' · '}
            {t('cashMovement.currentBalance', 'Saldo')}:{' '}
            <strong>
              {formatCurrency(
                activeCashRegister.current_balance ||
                  activeCashRegister.initial_balance ||
                  0
              )}
            </strong>
          </p>
        </div>

        <div className='cash-movements-page__actions'>
          <Button
            variant='outline'
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`cash-movements-page__btn-filter ${
              hasActiveFilters ? 'cash-movements-page__btn-filter--active' : ''
            }`}
          >
            <FilterIcon className='w-4 h-4' />
            {t('common.filters', 'Filtros')}
            {hasActiveFilters && <span className='filter-badge'>!</span>}
          </Button>
          <Button
            onClick={() => setIsNewMovementOpen(true)}
            className='cash-movements-page__btn-new'
          >
            <PlusIcon className='w-4 h-4' />
            {t('cashMovement.newMovement', 'Nuevo Movimiento')}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <div className='cash-movements-page__filters'>
          <div className='cash-movements-page__filters-row'>
            <div className='form-group'>
              <Label>{t('cashMovement.filter.type', 'Tipo')}</Label>
              <Select
                value={filters.type}
                onValueChange={value => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('cashMovement.filter.allTypes', 'Todos')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>
                    {t('cashMovement.filter.allTypes', 'Todos')}
                  </SelectItem>
                  <SelectItem value='INCOME'>
                    {t('cashMovement.type.income', 'Ingreso')}
                  </SelectItem>
                  <SelectItem value='EXPENSE'>
                    {t('cashMovement.type.expense', 'Egreso')}
                  </SelectItem>
                  <SelectItem value='ADJUSTMENT'>
                    {t('cashMovement.type.adjustment', 'Ajuste')}
                  </SelectItem>
                  <SelectItem value='TRANSFER'>
                    {t('cashMovement.type.transfer', 'Transferencia')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='form-group'>
              <Label>{t('cashMovement.filter.dateFrom', 'Desde')}</Label>
              <Input
                type='date'
                value={filters.date_from}
                onChange={e => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div className='form-group'>
              <Label>{t('cashMovement.filter.dateTo', 'Hasta')}</Label>
              <Input
                type='date'
                value={filters.date_to}
                onChange={e => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>

          <div className='cash-movements-page__filters-actions'>
            <Button variant='ghost' onClick={handleClearFilters}>
              {t('common.clear', 'Limpiar')}
            </Button>
            <Button onClick={handleApplyFilters}>
              {t('common.apply', 'Aplicar')}
            </Button>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className='cash-movements-page__card'>
        {isLoadingMovements ? (
          <DataState
            type='loading'
            message={t(
              'cashMovement.loadingMovements',
              'Cargando movimientos...'
            )}
          />
        ) : movements.length === 0 ? (
          <div className='cash-movements-page__empty'>
            <p>
              {t('cashMovement.noMovements', 'No hay movimientos registrados')}
            </p>
          </div>
        ) : (
          <div className='cash-movements-page__table-wrapper'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('cashMovement.table.date', 'Fecha')}</TableHead>
                  <TableHead>{t('cashMovement.table.type', 'Tipo')}</TableHead>
                  <TableHead>
                    {t('cashMovement.table.concept', 'Concepto')}
                  </TableHead>
                  <TableHead className='text-right'>
                    {t('cashMovement.table.amount', 'Monto')}
                  </TableHead>
                  <TableHead className='text-right'>
                    {t('cashMovement.table.balance', 'Balance')}
                  </TableHead>
                  <TableHead>
                    {t('cashMovement.table.user', 'Usuario')}
                  </TableHead>
                  <TableHead>
                    {t('cashMovement.table.details', 'Detalles')}
                  </TableHead>
                  <TableHead className='text-center'>
                    {t('cashMovement.table.actions', 'Acciones')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map(movement => {
                  const display = getMovementDisplay(movement.movement_type)
                  const isReversal =
                    movement.concept?.toLowerCase().includes('reversión') ||
                    movement.concept?.toLowerCase().includes('anulación')

                  return (
                    <TableRow
                      key={movement.movement_id}
                      className={isReversal ? 'row--reversal' : ''}
                    >
                      <TableCell className='text-sm'>
                        {formatDate(movement.created_at)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={display.variant}
                          className={`movement-badge ${display.className}`}
                        >
                          {display.icon}
                          {display.label}
                        </Badge>
                      </TableCell>

                      <TableCell
                        className='max-w-xs truncate'
                        title={movement.concept}
                      >
                        {movement.concept}
                      </TableCell>

                      <TableCell
                        className={`text-right font-medium ${
                          movement.movement_type === 'INCOME'
                            ? 'text-success'
                            : 'text-error'
                        }`}
                      >
                        {movement.movement_type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(movement.amount)}
                      </TableCell>

                      <TableCell className='text-right font-semibold'>
                        {formatCurrency(movement.running_balance)}
                      </TableCell>

                      <TableCell>
                        {movement.user_full_name || movement.created_by || '-'}
                      </TableCell>

                      <TableCell>
                        {movement.related_sale_id && (
                          <div className='movement-details'>
                            <span className='movement-details__sale'>
                              {movement.related_sale_id}
                            </span>
                            {movement.sale_client_name && (
                              <span className='movement-details__client'>
                                {movement.sale_client_name}
                              </span>
                            )}
                          </div>
                        )}
                        {movement.related_purchase_id && (
                          <div className='movement-details'>
                            <span className='movement-details__purchase'>
                              Compra #{movement.related_purchase_id}
                            </span>
                            {movement.purchase_supplier && (
                              <span className='movement-details__supplier'>
                                {movement.purchase_supplier}
                              </span>
                            )}
                          </div>
                        )}
                        {!movement.related_sale_id &&
                          !movement.related_purchase_id &&
                          '-'}
                      </TableCell>

                      <TableCell className='text-center'>
                        {!isReversal &&
                          !movement.related_sale_id &&
                          !movement.related_purchase_id && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleOpenVoidDialog(movement)}
                              className='btn-void'
                              title={t('cashMovement.void.button', 'Anular')}
                            >
                              <BanIcon className='w-4 h-4' />
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
        <DialogContent className='cash-movements-dialog'>
          <DialogHeader>
            <DialogTitle>
              {t(
                'cashMovement.newMovement.title',
                'Registrar Nuevo Movimiento'
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'cashMovement.newMovement.description',
                'Complete el formulario para registrar un movimiento manual'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='dialog-form'>
            <div className='form-group'>
              <Label>
                {t('cashMovement.field.movementType', 'Tipo de Movimiento')}
              </Label>
              <SegmentedControl
                value={newMovementForm.movement_type}
                onChange={handleTypeChange}
                options={movementTypes}
              />
            </div>

            <div className='form-group'>
              <Label>{t('cashMovement.field.concept', 'Concepto')}</Label>
              <Select
                value={newMovementForm.concept}
                onValueChange={value =>
                  handleNewMovementChange('concept', value)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'cashMovement.placeholder.selectConcept',
                      'Seleccionar concepto'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {concepts[newMovementForm.movement_type]?.map(concept => (
                    <SelectItem key={concept.id} value={concept.id}>
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='form-group'>
              <Label>{t('cashMovement.field.amount', 'Monto')}</Label>
              <div className='form-group__input-wrapper'>
                <span className='form-group__input-prefix'>Gs.</span>
                <Input
                  type='text'
                  inputMode='numeric'
                  value={formatNumber(newMovementForm.amount)}
                  onChange={e =>
                    handleNewMovementChange(
                      'amount',
                      parseFormattedNumber(e.target.value)
                    )
                  }
                  placeholder='0'
                  className='form-group__input--with-prefix'
                />
              </div>
            </div>

            <div className='form-group'>
              <Label>
                {t('cashMovement.field.notes', 'Notas')}
                <span className='form-group__label-optional'>
                  {' '}
                  ({t('common.optional', 'Opcional')})
                </span>
              </Label>
              <Textarea
                value={newMovementForm.notes}
                onChange={e => handleNewMovementChange('notes', e.target.value)}
                placeholder={t(
                  'cashMovement.placeholder.notes',
                  'Añada una descripción si es necesario...'
                )}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsNewMovementOpen(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button onClick={handleSubmitNewMovement} disabled={isSubmitting}>
              {isSubmitting
                ? t('common.saving', 'Guardando...')
                : t('common.save', 'Guardar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Movement Dialog */}
      <Dialog
        open={voidDialog.isOpen}
        onOpenChange={open =>
          !open &&
          setVoidDialog({
            isOpen: false,
            movement: null,
            reason: '',
            isSubmitting: false,
          })
        }
      >
        <DialogContent className='cash-movements-dialog cash-movements-dialog--void'>
          <DialogHeader>
            <DialogTitle className='text-error'>
              {t('cashMovement.void.title', 'Anular Movimiento')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'cashMovement.void.description',
                'Esta acción creará un movimiento de reversión. No se puede deshacer.'
              )}
            </DialogDescription>
          </DialogHeader>

          {voidDialog.movement && (
            <div className='void-summary'>
              <div className='void-summary__row'>
                <span>{t('cashMovement.table.type', 'Tipo')}:</span>
                <Badge
                  variant={
                    getMovementDisplay(voidDialog.movement.movement_type)
                      .variant
                  }
                >
                  {getMovementDisplay(voidDialog.movement.movement_type).label}
                </Badge>
              </div>
              <div className='void-summary__row'>
                <span>{t('cashMovement.table.amount', 'Monto')}:</span>
                <strong>{formatCurrency(voidDialog.movement.amount)}</strong>
              </div>
              <div className='void-summary__row'>
                <span>{t('cashMovement.table.concept', 'Concepto')}:</span>
                <span>{voidDialog.movement.concept}</span>
              </div>
            </div>
          )}

          <div className='form-group'>
            <Label>
              {t('cashMovement.void.reason', 'Razón de anulación')} *
            </Label>
            <Textarea
              value={voidDialog.reason}
              onChange={e =>
                setVoidDialog(prev => ({ ...prev, reason: e.target.value }))
              }
              placeholder={t(
                'cashMovement.void.reasonPlaceholder',
                'Ingrese la razón de la anulación (mínimo 5 caracteres)'
              )}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() =>
                setVoidDialog({
                  isOpen: false,
                  movement: null,
                  reason: '',
                  isSubmitting: false,
                })
              }
              disabled={voidDialog.isSubmitting}
            >
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleVoidMovement}
              disabled={voidDialog.isSubmitting || voidDialog.reason.length < 5}
            >
              {voidDialog.isSubmitting
                ? t('common.processing', 'Procesando...')
                : t('cashMovement.void.confirm', 'Anular')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CashMovements
