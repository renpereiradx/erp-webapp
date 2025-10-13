import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'

const CashRegister = () => {
  const { t } = useI18n()
  const { styles, isNeoBrutalism } = useThemeStyles()

  const {
    activeCashRegister,
    cashRegisters,
    movements,
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
    getCashRegisterSummary,
  } = useCashRegisterStore()

  const [openCashRegisterDialog, setOpenCashRegisterDialog] = useState(false)
  const [closeCashRegisterDialog, setCloseCashRegisterDialog] = useState(false)
  const [movementDialog, setMovementDialog] = useState(false)
  const [summaryDialog, setSummaryDialog] = useState(false)

  const [openCashRegisterForm, setOpenCashRegisterForm] = useState({
    name: '',
    initial_balance: '',
    location: '',
    notes: '',
  })

  const [closeCashRegisterForm, setCloseCashRegisterForm] = useState({
    final_balance: '',
    notes: '',
  })

  const [movementForm, setMovementForm] = useState({
    movement_type: '',
    amount: '',
    concept: '',
    notes: '',
  })

  const [activeTab, setActiveTab] = useState('overview')
  const [formError, setFormError] = useState('')

  // 🔄 Cargar datos al montar el componente
  useEffect(() => {
    const loadInitialData = async () => {
      await handleLoadActiveCashRegister()
      await handleLoadCashRegisters()

      // Si hay caja activa, cargar sus movimientos
      if (activeCashRegister?.id) {
        await handleLoadMovements()
      }
    }

    loadInitialData()
  }, []) // Solo ejecutar al montar

  // 🔄 Cargar movimientos cuando cambie la caja activa
  useEffect(() => {
    if (activeCashRegister?.id) {
      handleLoadMovements()
    }
  }, [activeCashRegister?.id])

  const handleLoadActiveCashRegister = async () => {
    try {
      await getActiveCashRegister()
    } catch (error) {}
  }

  const handleLoadCashRegisters = async () => {
    try {
      await getCashRegisters()
    } catch (error) {}
  }

  const handleLoadMovements = async () => {
    try {
      if (activeCashRegister?.id) {
        await getMovements(activeCashRegister.id)
      }
    } catch (error) {}
  }

  const handleLoadSummary = async () => {
    try {
      if (activeCashRegister?.id) {
        await getCashRegisterSummary(activeCashRegister.id)
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
      setOpenCashRegisterForm({
        name: '',
        initial_balance: '',
        location: '',
        notes: '',
      })

      // Reload active cash register
      await handleLoadActiveCashRegister()
    } catch (error) {
      setFormError(error.message || 'Error al abrir la caja registradora')
    }
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
      setCloseCashRegisterForm({
        final_balance: '',
        notes: '',
      })

      // Reload data
      await handleLoadActiveCashRegister()
      await handleLoadCashRegisters()
    } catch (error) {
      setFormError(error.message || 'Error al cerrar la caja registradora')
    }
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
      setMovementForm({
        movement_type: '',
        amount: '',
        concept: '',
        notes: '',
      })

      // Reload data
      await handleLoadActiveCashRegister()
      await handleLoadMovements()
    } catch (error) {
      setFormError(error.message || 'Error al registrar el movimiento')
    }
  }

  const getStatusBadge = status => {
    switch (status) {
      case 'OPEN':
        return (
          <Badge className='bg-green-100 text-green-800 border-green-300'>
            Abierta
          </Badge>
        )
      case 'CLOSED':
        return (
          <Badge className='bg-gray-100 text-gray-800 border-gray-300'>
            Cerrada
          </Badge>
        )
      default:
        return <Badge variant='secondary'>{status}</Badge>
    }
  }

  const getMovementTypeColor = type => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600 dark:text-green-400'
      case 'EXPENSE':
        return 'text-red-600 dark:text-red-400'
      case 'ADJUSTMENT':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getMovementTypeIcon = type => {
    switch (type) {
      case 'INCOME':
        return (
          <PlusIcon className='w-4 h-4 text-green-600 dark:text-green-400' />
        )
      case 'EXPENSE':
        return <MinusIcon className='w-4 h-4 text-red-600 dark:text-red-400' />
      case 'ADJUSTMENT':
        return (
          <Calculator className='w-4 h-4 text-blue-600 dark:text-blue-400' />
        )
      default:
        return <DollarSign className='w-4 h-4 text-muted-foreground' />
    }
  }

  const getMovementBorderColor = type => {
    switch (type) {
      case 'INCOME':
        return isNeoBrutalism ? '#10b981' : 'hsl(var(--chart-2))'
      case 'EXPENSE':
        return isNeoBrutalism ? '#ef4444' : 'hsl(var(--chart-1))'
      case 'ADJUSTMENT':
        return isNeoBrutalism ? '#3b82f6' : 'hsl(var(--chart-3))'
      default:
        return 'hsl(var(--border))'
    }
  }

  // Función para obtener estilos de overlay basados en el tema
  const getOverlayClasses = () => {
    const baseClasses =
      'absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm'
    return isNeoBrutalism
      ? `${baseClasses} bg-black/70`
      : `${baseClasses} bg-black/60`
  }

  return (
    <div className='container mx-auto p-6 space-y-8 relative'>
      {/* Cash register content container */}
      <div className='relative w-full space-y-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <CashIcon className='w-8 h-8 text-blue-600' />
            <div>
              <h1 className='text-3xl font-bold'>Cajas Registradoras</h1>
              <p className='text-muted-foreground'>
                Gestión de efectivo y movimientos
              </p>
            </div>
          </div>

          <div className='flex gap-2'>
            <Button
              onClick={handleLoadActiveCashRegister}
              disabled={isActiveCashRegisterLoading}
            >
              {isActiveCashRegisterLoading
                ? 'Cargando...'
                : 'Cargar Caja Activa'}
            </Button>

            <Button
              onClick={() => {
                setOpenCashRegisterDialog(true)
                setFormError('') // Limpiar error al abrir modal
              }}
            >
              <PlusIcon className='w-4 h-4 mr-2' />
              Abrir Caja
            </Button>

            {openCashRegisterDialog && (
              <div
                className={getOverlayClasses()}
                onClick={() => setOpenCashRegisterDialog(false)}
              >
                <div
                  className={`${styles.card()} w-full max-w-lg max-h-[90vh] overflow-y-auto`}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className='flex items-center justify-between p-6 pb-4 border-b'>
                    <div>
                      <h2 className='text-lg font-semibold'>
                        Abrir Nueva Caja Registradora
                      </h2>
                      <p className='text-sm text-muted-foreground'>
                        Configure los datos iniciales para la nueva caja
                        registradora
                      </p>
                    </div>
                    <button
                      onClick={() => setOpenCashRegisterDialog(false)}
                      className='text-muted-foreground hover:text-foreground p-1 rounded'
                    >
                      <XCircle className='w-5 h-5' />
                    </button>
                  </div>

                  {/* Content */}
                  <div className='p-6'>
                    <form
                      onSubmit={handleOpenCashRegister}
                      className='space-y-4'
                    >
                      <div>
                        <Label htmlFor='name'>Nombre de la Caja</Label>
                        <Input
                          id='name'
                          value={openCashRegisterForm.name}
                          onChange={e =>
                            setOpenCashRegisterForm(prev => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder='Ej: Caja Principal'
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor='initial_balance'>Balance Inicial</Label>
                        <Input
                          id='initial_balance'
                          type='number'
                          step='0.01'
                          min='0'
                          value={openCashRegisterForm.initial_balance}
                          onChange={e =>
                            setOpenCashRegisterForm(prev => ({
                              ...prev,
                              initial_balance: e.target.value,
                            }))
                          }
                          placeholder='0.00'
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor='location'>Ubicación</Label>
                        <Input
                          id='location'
                          value={openCashRegisterForm.location}
                          onChange={e =>
                            setOpenCashRegisterForm(prev => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                          placeholder='Ej: Mostrador Principal'
                        />
                      </div>
                      <div>
                        <Label htmlFor='notes'>Notas</Label>
                        <Textarea
                          id='notes'
                          value={openCashRegisterForm.notes}
                          onChange={e =>
                            setOpenCashRegisterForm(prev => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          placeholder='Notas adicionales...'
                          rows={3}
                        />
                      </div>

                      {/* Error Message */}
                      {formError && (
                        <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                          <p className='text-sm text-red-600'>{formError}</p>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Footer */}
                  <div className='flex gap-3 justify-end p-6 pt-4 border-t'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setOpenCashRegisterDialog(false)}
                      disabled={isOpeningCashRegister}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type='submit'
                      onClick={handleOpenCashRegister}
                      disabled={isOpeningCashRegister}
                    >
                      {isOpeningCashRegister ? 'Abriendo...' : 'Abrir Caja'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Cash Register Status */}
        {activeCashRegister && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>Caja Activa: {activeCashRegister.name}</span>
                {getStatusBadge(activeCashRegister.status)}
              </CardTitle>
              <CardDescription>
                Abierta el{' '}
                {new Date(activeCashRegister.opened_at).toLocaleString()}
                {activeCashRegister.location &&
                  ` • ${activeCashRegister.location}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                <div className='text-center'>
                  <p className='text-sm text-muted-foreground'>
                    Balance Inicial
                  </p>
                  <p className='text-2xl font-bold'>
                    $
                    {(activeCashRegister.initial_balance || 0).toLocaleString()}
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-muted-foreground'>
                    Balance Actual
                  </p>
                  <p className='text-2xl font-bold text-blue-600'>
                    $
                    {(activeCashRegister.current_balance || 0).toLocaleString()}
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-muted-foreground'>Diferencia</p>
                  <p
                    className={`text-2xl font-bold ${
                      (activeCashRegister.current_balance || 0) -
                        (activeCashRegister.initial_balance || 0) >=
                      0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    $
                    {(
                      (activeCashRegister.current_balance || 0) -
                      (activeCashRegister.initial_balance || 0)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className='flex gap-3 flex-wrap justify-center mt-4'>
                <Button
                  variant='outline'
                  onClick={() => setMovementDialog(true)}
                >
                  <DollarSign className='w-4 h-4 mr-2' />
                  Registrar Movimiento
                </Button>

                {movementDialog && (
                  <div
                    className={getOverlayClasses()}
                    onClick={() => setMovementDialog(false)}
                  >
                    <div
                      className={`${styles.card()} w-full max-w-lg max-h-[90vh] overflow-y-auto`}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className='flex items-center justify-between p-6 pb-4 border-b'>
                        <div>
                          <h2 className='text-lg font-semibold'>
                            Registrar Movimiento
                          </h2>
                          <p className='text-sm text-muted-foreground'>
                            Registre un movimiento manual de efectivo
                          </p>
                        </div>
                        <button
                          onClick={() => setMovementDialog(false)}
                          className='text-muted-foreground hover:text-foreground p-1 rounded'
                        >
                          <XCircle className='w-5 h-5' />
                        </button>
                      </div>

                      {/* Content */}
                      <div className='p-6'>
                        {isRegisteringMovement ? (
                          <div className='flex items-center justify-center py-12'>
                            <div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full' />
                            <span className='ml-3 text-sm text-muted-foreground'>
                              Procesando...
                            </span>
                          </div>
                        ) : (
                          <form
                            onSubmit={handleRegisterMovement}
                            className='space-y-4'
                          >
                            <div>
                              <Label htmlFor='movement_type'>
                                Tipo de Movimiento
                              </Label>
                              <Select
                                value={movementForm.movement_type}
                                onValueChange={value =>
                                  setMovementForm(prev => ({
                                    ...prev,
                                    movement_type: value,
                                  }))
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder='Seleccione el tipo' />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='INCOME'>
                                    Ingreso
                                  </SelectItem>
                                  <SelectItem value='EXPENSE'>Gasto</SelectItem>
                                  <SelectItem value='ADJUSTMENT'>
                                    Ajuste
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor='amount'>Monto</Label>
                              <Input
                                id='amount'
                                type='number'
                                step='0.01'
                                value={movementForm.amount}
                                onChange={e =>
                                  setMovementForm(prev => ({
                                    ...prev,
                                    amount: e.target.value,
                                  }))
                                }
                                placeholder='0.00'
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor='concept'>Concepto</Label>
                              <Input
                                id='concept'
                                value={movementForm.concept}
                                onChange={e =>
                                  setMovementForm(prev => ({
                                    ...prev,
                                    concept: e.target.value,
                                  }))
                                }
                                placeholder='Descripción del movimiento'
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor='movement_notes'>Notas</Label>
                              <Textarea
                                id='movement_notes'
                                value={movementForm.notes}
                                onChange={e =>
                                  setMovementForm(prev => ({
                                    ...prev,
                                    notes: e.target.value,
                                  }))
                                }
                                placeholder='Notas adicionales...'
                                rows={2}
                              />
                            </div>
                          </form>
                        )}
                      </div>

                      {/* Footer */}
                      <div className='flex gap-3 justify-end p-6 pt-4 border-t'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => setMovementDialog(false)}
                          disabled={isRegisteringMovement}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type='submit'
                          onClick={handleRegisterMovement}
                          disabled={isRegisteringMovement}
                        >
                          {isRegisteringMovement
                            ? 'Registrando...'
                            : 'Registrar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant='outline'
                  onClick={handleLoadMovements}
                  disabled={isMovementsLoading}
                >
                  <Clock className='w-4 h-4 mr-2' />
                  {isMovementsLoading ? 'Cargando...' : 'Ver Movimientos'}
                </Button>

                <Button variant='outline' onClick={handleLoadSummary}>
                  <Calculator className='w-4 h-4 mr-2' />
                  Ver Resumen
                </Button>

                <Button
                  variant='outline'
                  onClick={() => setCloseCashRegisterDialog(true)}
                  className='border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300'
                >
                  <XCircle className='w-4 h-4 mr-2' />
                  Cerrar Caja
                </Button>

                {closeCashRegisterDialog && (
                  <div
                    className={getOverlayClasses()}
                    onClick={() => setCloseCashRegisterDialog(false)}
                  >
                    <div
                      className={`${styles.card()} border-yellow-200 w-full max-w-lg max-h-[80vh] flex flex-col`}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className='flex items-center justify-between p-6 pb-4 border-b'>
                        <div className='flex items-center gap-3'>
                          <div className='flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100'>
                            <AlertCircle className='w-5 h-5 text-yellow-600' />
                          </div>
                          <div>
                            <h2 className='text-lg font-semibold'>
                              Cerrar Caja Registradora
                            </h2>
                            <p className='text-sm text-muted-foreground'>
                              Confirme el balance final y cierre la caja
                              registradora
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setCloseCashRegisterDialog(false)}
                          className='text-muted-foreground hover:text-foreground p-1 rounded'
                        >
                          <XCircle className='w-5 h-5' />
                        </button>
                      </div>

                      {/* Content */}
                      <div className='flex-1 p-6 overflow-y-auto'>
                        {isClosingCashRegister ? (
                          <div className='flex items-center justify-center py-12'>
                            <div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full' />
                            <span className='ml-3 text-sm text-muted-foreground'>
                              Cerrando...
                            </span>
                          </div>
                        ) : (
                          <form
                            onSubmit={handleCloseCashRegister}
                            className='space-y-4'
                          >
                            <div>
                              <Label htmlFor='final_balance'>
                                Balance Final Físico
                              </Label>
                              <Input
                                id='final_balance'
                                type='number'
                                step='0.01'
                                value={closeCashRegisterForm.final_balance}
                                onChange={e =>
                                  setCloseCashRegisterForm(prev => ({
                                    ...prev,
                                    final_balance: e.target.value,
                                  }))
                                }
                                placeholder={
                                  activeCashRegister?.current_balance?.toString() ||
                                  '0.00'
                                }
                                required
                              />
                              <p className='text-sm text-muted-foreground mt-1'>
                                Balance del sistema: $
                                {activeCashRegister?.current_balance || 0}
                              </p>
                            </div>
                            <div>
                              <Label htmlFor='close_notes'>
                                Notas de Cierre
                              </Label>
                              <Textarea
                                id='close_notes'
                                value={closeCashRegisterForm.notes}
                                onChange={e =>
                                  setCloseCashRegisterForm(prev => ({
                                    ...prev,
                                    notes: e.target.value,
                                  }))
                                }
                                placeholder='Observaciones del cierre...'
                                rows={3}
                              />
                            </div>
                          </form>
                        )}
                      </div>

                      {/* Footer */}
                      <div className='flex gap-3 justify-end p-6 pt-4 border-t bg-white/95 backdrop-blur-sm'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => setCloseCashRegisterDialog(false)}
                          disabled={isClosingCashRegister}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type='submit'
                          variant='destructive'
                          onClick={handleCloseCashRegister}
                          disabled={isClosingCashRegister}
                        >
                          {isClosingCashRegister
                            ? 'Cerrando...'
                            : 'Cerrar Caja'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Active Cash Register */}
        {!activeCashRegister && !isActiveCashRegisterLoading && (
          <Card>
            <CardContent className='text-center py-8'>
              <CashIcon className='w-16 h-16 mx-auto text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                No hay caja registradora activa
              </h3>
              <p className='text-muted-foreground mb-4'>
                Debe abrir una caja registradora para comenzar a operar
              </p>
              <Button
                onClick={() => {
                  setOpenCashRegisterDialog(true)
                  setFormError('') // Limpiar error al abrir modal
                }}
              >
                <PlusIcon className='w-4 h-4 mr-2' />
                Abrir Nueva Caja
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Movements List - Using Enriched Data v2.1 */}
        {movements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Movimientos Recientes</CardTitle>
              <CardDescription>
                Historial de movimientos de efectivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {movements.map(movement => (
                  <div
                    key={movement.movement_id}
                    className='group relative p-4 border-l-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-card'
                    style={{
                      borderLeftColor: getMovementBorderColor(
                        movement.movement_type
                      ),
                    }}
                  >
                    {/* Main Row */}
                    <div className='flex items-start justify-between gap-4'>
                      {/* Left Section: Icon + Content */}
                      <div className='flex items-start gap-3 flex-1 min-w-0'>
                        <div className='mt-1 flex-shrink-0'>
                          {getMovementTypeIcon(movement.movement_type)}
                        </div>

                        <div className='flex-1 min-w-0 space-y-2'>
                          {/* Concept */}
                          <p className='font-semibold text-base leading-tight'>
                            {movement.concept}
                          </p>

                          {/* Metadata Row */}
                          <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              {new Date(movement.created_at).toLocaleString(
                                'es-ES',
                                {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                            {movement.user_full_name && (
                              <span className='flex items-center gap-1'>
                                <span className='font-medium'>Por:</span>
                                {movement.user_full_name}
                              </span>
                            )}
                          </div>

                          {/* Enriched Data: Sale Details */}
                          {movement.related_sale_id && (
                            <div className='flex items-start gap-2 p-2.5 bg-accent/30 rounded-md border border-border'>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <p className='font-semibold text-sm text-primary'>
                                    Venta: {movement.related_sale_id}
                                  </p>
                                  {movement.sale_status && (
                                    <Badge
                                      variant='secondary'
                                      className='text-xs h-5'
                                    >
                                      {movement.sale_status}
                                    </Badge>
                                  )}
                                </div>
                                <div className='space-y-0.5 text-xs text-muted-foreground'>
                                  {movement.sale_client_name && (
                                    <p className='flex items-center gap-1.5'>
                                      <span className='font-medium text-foreground'>
                                        Cliente:
                                      </span>
                                      <span className='truncate'>
                                        {movement.sale_client_name}
                                      </span>
                                    </p>
                                  )}
                                  {movement.sale_payment_method && (
                                    <p className='flex items-center gap-1.5'>
                                      <span className='font-medium text-foreground'>
                                        Método:
                                      </span>
                                      <span>
                                        {movement.sale_payment_method}
                                      </span>
                                    </p>
                                  )}
                                  {movement.sale_total !== null && (
                                    <p className='flex items-center gap-1.5'>
                                      <span className='font-medium text-foreground'>
                                        Total Venta:
                                      </span>
                                      <span className='font-semibold text-foreground'>
                                        ${movement.sale_total.toLocaleString()}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Enriched Data: Purchase Details */}
                          {movement.related_purchase_id && (
                            <div className='flex items-start gap-2 p-2.5 bg-accent/30 rounded-md border border-border'>
                              <div className='flex-1 min-w-0'>
                                <p className='font-semibold text-sm text-primary mb-1'>
                                  Compra #{movement.related_purchase_id}
                                </p>
                                <div className='space-y-0.5 text-xs text-muted-foreground'>
                                  {movement.purchase_supplier && (
                                    <p className='flex items-center gap-1.5'>
                                      <span className='font-medium text-foreground'>
                                        Proveedor:
                                      </span>
                                      <span className='truncate'>
                                        {movement.purchase_supplier}
                                      </span>
                                    </p>
                                  )}
                                  {movement.purchase_total !== null && (
                                    <p className='flex items-center gap-1.5'>
                                      <span className='font-medium text-foreground'>
                                        Total:
                                      </span>
                                      <span className='font-semibold text-foreground'>
                                        $
                                        {movement.purchase_total.toLocaleString()}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Section: Amount + Balance */}
                      <div className='text-right flex-shrink-0 space-y-1'>
                        <p
                          className={`font-bold text-xl ${getMovementTypeColor(
                            movement.movement_type
                          )}`}
                        >
                          {movement.movement_type === 'EXPENSE' ? '-' : '+'}$
                          {movement.amount.toLocaleString()}
                        </p>
                        {/* Enriched data: Running balance */}
                        <div className='inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-md'>
                          <span className='text-xs font-medium text-muted-foreground'>
                            Balance:
                          </span>
                          <span className='text-sm font-bold text-primary'>
                            ${movement.running_balance?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cash Registers History */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>Historial de Cajas</span>
              <Button
                variant='outline'
                size='sm'
                onClick={handleLoadCashRegisters}
                disabled={isCashRegistersLoading}
              >
                {isCashRegistersLoading ? 'Cargando...' : 'Actualizar'}
              </Button>
            </CardTitle>
            <CardDescription>
              Listado de todas las cajas registradoras
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cashRegisters && cashRegisters.length > 0 ? (
              <div className='space-y-2'>
                {cashRegisters.map(cashRegister => (
                  <div
                    key={cashRegister.id}
                    className='flex items-center justify-between p-3 border rounded'
                  >
                    <div>
                      <p className='font-medium'>{cashRegister.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {new Date(cashRegister.opened_at).toLocaleDateString()}
                        {cashRegister.closed_at &&
                          ` - ${new Date(
                            cashRegister.closed_at
                          ).toLocaleDateString()}`}
                        {cashRegister.location && ` • ${cashRegister.location}`}
                      </p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='text-right'>
                        <p className='font-medium'>
                          $
                          {(cashRegister.current_balance || 0).toLocaleString()}
                        </p>
                        {cashRegister.variance !== undefined &&
                          cashRegister.variance !== null &&
                          cashRegister.variance !== 0 && (
                            <p
                              className={`text-sm ${
                                cashRegister.variance >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              Var: $
                              {(cashRegister.variance || 0).toLocaleString()}
                            </p>
                          )}
                      </div>
                      {getStatusBadge(cashRegister.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-center text-muted-foreground py-4'>
                No hay cajas registradoras. Haga clic en "Actualizar" para
                cargar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary Modal */}
        {summaryDialog && (
          <div
            className={getOverlayClasses()}
            onClick={() => setSummaryDialog(false)}
          >
            <div
              className={`${styles.card()} border-blue-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className='flex items-center justify-between p-6 pb-4 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center justify-center w-10 h-10 rounded-full bg-blue-100'>
                    <Calculator className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold'>Resumen de Caja</h2>
                    <p className='text-sm text-muted-foreground'>
                      Detalles completos de la caja registradora
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSummaryDialog(false)}
                  className='text-muted-foreground hover:text-foreground p-1 rounded'
                >
                  <XCircle className='w-5 h-5' />
                </button>
              </div>

              {/* Content */}
              <div className='p-6'>
                {cashRegisterSummary && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Total Ingresos
                        </p>
                        <p className='text-lg font-semibold text-green-600'>
                          ${cashRegisterSummary.total_income}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Total Gastos
                        </p>
                        <p className='text-lg font-semibold text-red-600'>
                          ${cashRegisterSummary.total_expenses}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Total Ventas
                        </p>
                        <p className='text-lg font-semibold text-blue-600'>
                          ${cashRegisterSummary.total_sales}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Total Movimientos
                        </p>
                        <p className='text-lg font-semibold'>
                          {cashRegisterSummary.total_movements}
                        </p>
                      </div>
                    </div>

                    {cashRegisterSummary.expected_balance && (
                      <div className='border-t pt-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <p className='text-sm text-muted-foreground'>
                              Balance Esperado
                            </p>
                            <p className='text-xl font-bold'>
                              ${cashRegisterSummary.expected_balance}
                            </p>
                          </div>
                          <div>
                            <p className='text-sm text-muted-foreground'>
                              Balance Actual
                            </p>
                            <p className='text-xl font-bold'>
                              ${cashRegisterSummary.actual_balance}
                            </p>
                          </div>
                        </div>

                        {cashRegisterSummary.variance !== 0 && (
                          <div className='mt-4'>
                            <p className='text-sm text-muted-foreground'>
                              Diferencia
                            </p>
                            <p
                              className={`text-xl font-bold ${
                                cashRegisterSummary.variance >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              ${cashRegisterSummary.variance}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className='flex justify-end p-6 pt-4 border-t'>
                <Button onClick={() => setSummaryDialog(false)}>Cerrar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CashRegister
