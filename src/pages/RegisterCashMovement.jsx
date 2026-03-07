/**
 * RegisterCashMovement - Página para registrar movimientos manuales de efectivo
 * Sigue patrón MVP y Fluent Design System 2
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { cashRegisterService } from '@/services/cashRegisterService'
import { telemetry } from '@/utils/telemetry'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const RegisterCashMovement = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type')
  const validInitialType = ['INCOME', 'EXPENSE', 'ADJUSTMENT'].includes(
    initialType
  )
    ? initialType
    : 'INCOME'

  // Estado del formulario
  const [formData, setFormData] = useState({
    movementType: validInitialType,
    cashRegisterId: null,
    concept: '',
    amount: '',
    notes: '',
  })

  // Estados de UI
  const [activeCashRegister, setActiveCashRegister] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingCashRegister, setLoadingCashRegister] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Conceptos predefinidos según tipo de movimiento
  const concepts = {
    INCOME: [
      'Depósito inicial',
      'Cobro de deuda',
      'Venta directa',
      'Donación',
      'Ingreso varios',
      'Otro',
    ],
    EXPENSE: [
      'Retiro de efectivo',
      'Pago a proveedor',
      'Gastos menores',
      'Servicios',
      'Egreso varios',
      'Otro',
    ],
    ADJUSTMENT: [
      'Ajuste por diferencia',
      'Corrección de error',
      'Ajuste de inventario',
      'Otro',
    ],
  }

  // Configuración de UI por tipo de movimiento
  const MOVEMENT_CONFIG = {
    INCOME: {
      title: t('cashMovement.type.income.title', 'Registrar Ingreso'),
      description: t(
        'cashMovement.type.income.desc',
        'Entrada de dinero a la caja'
      ),
      theme: 'theme-income',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      icon: <span className="material-icons-round text-green-600 text-[24px]">arrow_downward</span>,
    },
    EXPENSE: {
      title: t('cashMovement.type.expense.title', 'Registrar Egreso'),
      description: t(
        'cashMovement.type.expense.desc',
        'Salida de dinero de la caja'
      ),
      theme: 'theme-expense',
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      icon: <span className="material-icons-round text-red-600 text-[24px]">arrow_upward</span>,
    },
    ADJUSTMENT: {
      title: t('cashMovement.type.adjustment.title', 'Registrar Ajuste'),
      description: t(
        'cashMovement.type.adjustment.desc',
        'Corrección de balance'
      ),
      theme: 'theme-adjustment',
      bgClass: 'bg-orange-50 dark:bg-orange-900/20',
      icon: <span className="material-icons-round text-orange-600 text-[24px]">settings</span>,
    },
  }

  const ALLOWED_MOVEMENT_TYPES = ['INCOME', 'EXPENSE', 'ADJUSTMENT']

  // Cargar caja registradora activa al montar
  useEffect(() => {
    const loadActiveCashRegister = async () => {
      try {
        setLoadingCashRegister(true)
        const cashRegister = await cashRegisterService.getActiveCashRegister()

        if (cashRegister) {
          setActiveCashRegister(cashRegister)
          setFormData(prev => ({ ...prev, cashRegisterId: cashRegister.id }))
        } else {
          setError(
            t(
              'cashMovement.error.noActiveCashRegister',
              'No hay caja registradora activa. Por favor, abra una caja primero.'
            )
          )
        }
      } catch (err) {
        console.error('Error loading active cash register:', err)
        setError(
          t(
            'cashMovement.error.loadingCashRegister',
            'Error al cargar la caja registradora'
          )
        )
      } finally {
        setLoadingCashRegister(false)
      }
    }

    loadActiveCashRegister()
  }, [t])

  const reloadCashRegister = async () => {
    try {
      const cashRegister = await cashRegisterService.getActiveCashRegister()
      if (cashRegister) {
        setActiveCashRegister(cashRegister)
      }
    } catch (err) {
      console.error('Error reloading cash register:', err)
    }
  }

  // Manejadores de cambio de formulario
  const handleMovementTypeChange = type => {
    setFormData(prev => ({ ...prev, movementType: type, concept: '' }))
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  // Validar formulario
  const validateForm = () => {
    if (!ALLOWED_MOVEMENT_TYPES.includes(formData.movementType)) {
      setError(
        t('cashMovement.error.invalidType', 'Tipo de movimiento no válido')
      )
      return false
    }

    if (!formData.cashRegisterId) {
      setError(
        t(
          'cashMovement.error.noCashRegister',
          'Debe seleccionar una caja registradora'
        )
      )
      return false
    }

    if (!formData.concept || formData.concept.trim() === '') {
      setError(
        t('cashMovement.error.noConcept', 'Debe seleccionar un concepto')
      )
      return false
    }

    const amount = parseFloat(formData.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        t('cashMovement.error.invalidAmount', 'El monto debe ser mayor a 0')
      )
      return false
    }

    return true
  }

  // Registrar movimiento
  const handleSubmit = async (shouldReset = false) => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const amount = parseFloat(formData.amount)

      await cashRegisterService.registerMovement(formData.cashRegisterId, {
        movement_type: formData.movementType,
        amount: amount,
        concept: formData.concept.trim(),
        notes: formData.notes?.trim() || null,
      })

      telemetry.record('cash_movement.registered', {
        movement_type: formData.movementType,
        amount: amount,
      })

      setSuccess(true)

      if (shouldReset) {
        // Guardar y Nuevo: resetear formulario y recargar saldo
        setFormData({
          movementType: 'INCOME',
          cashRegisterId: activeCashRegister?.id || null,
          concept: '',
          amount: '',
          notes: '',
        })
        reloadCashRegister()
      } else {
        // Guardar: redirigir después de 1.5 segundos
        setTimeout(() => {
          navigate('/movimientos-caja')
        }, 1500)
      }
    } catch (err) {
      console.error('Error registering cash movement:', err)
      setError(
        err.message ||
          t('cashMovement.error.generic', 'Error al registrar el movimiento')
      )
      telemetry.record('cash_movement.error', {
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Cancelar
  const handleCancel = () => {
    navigate('/movimientos-caja')
  }

  if (loadingCashRegister) {
    return (
      <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-sans p-6'>
        <div className='flex items-center justify-center min-h-[40vh]'>
           <span className="material-icons-round text-primary text-[40px] animate-spin">refresh</span>
        </div>
      </div>
    )
  }

  const currentConfig = MOVEMENT_CONFIG[formData.movementType]

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-sans p-2'>
      {/* Header */}
      <header className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6 py-2'>
        <div className='flex items-center gap-4'>
          <div className={`size-12 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 ${currentConfig.bgClass}`}>
            {currentConfig.icon}
          </div>
          <div>
            <h1 className='text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight'>
              {currentConfig.title}
            </h1>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              {currentConfig.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            onClick={handleCancel}
            disabled={loading}
            className="h-10 font-semibold uppercase tracking-widest text-[10px]"
          >
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            variant='outline'
            onClick={() => handleSubmit(true)}
            disabled={loading || !activeCashRegister}
            className="h-10 px-4 font-semibold uppercase tracking-widest text-[10px] rounded-md border-slate-200"
          >
            {t('cashMovement.action.saveAndNew', 'Guardar y Nuevo')}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading || !activeCashRegister}
            className="h-10 px-6 font-semibold uppercase tracking-widest text-[10px] rounded-md shadow-sm bg-primary hover:bg-primary-hover text-white"
          >
            {loading
              ? t('common.saving', 'Guardando...')
              : t('common.save', 'Guardar')}
          </Button>
        </div>
      </header>

      {/* Form Content */}
      <div className='bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-8'>
        {/* Movement Type Selector */}
        <div className='space-y-2'>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 ml-1">
             {t('cashMovement.field.movementType', 'Tipo de Movimiento')}
          </label>
          <SegmentedControl
            options={[
              {
                value: 'INCOME',
                label: t('cashMovement.type.income', 'Ingreso'),
              },
              {
                value: 'EXPENSE',
                label: t('cashMovement.type.expense', 'Egreso'),
              },
              {
                value: 'ADJUSTMENT',
                label: t('cashMovement.type.adjustment', 'Ajuste'),
              },
            ]}
            value={formData.movementType}
            onChange={handleMovementTypeChange}
          />
        </div>

        {/* Balance Info Card */}
        {activeCashRegister && (
          <div className='bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center'>
            <div>
              <span className='text-[10px] font-semibold uppercase tracking-widest text-slate-500 block'>{t('cashRegister.field.active', 'Caja Activa')}</span>
              <span className='font-semibold text-slate-900 dark:text-white'>{activeCashRegister.name}</span>
            </div>
            <div className='text-right'>
              <span className='text-[10px] font-semibold uppercase tracking-widest text-slate-500 block'>
                {t('cashRegister.field.currentBalance', 'Balance Disponible')}
              </span>
              <span
                className={`text-2xl font-mono font-semibold tabular-nums ${
                  formData.movementType === 'EXPENSE'
                    ? 'text-red-600'
                    : 'text-primary'
                }`}
              >
                $
                {activeCashRegister.current_balance?.toLocaleString('es-PY', {
                  minimumFractionDigits: 0,
                }) || '0'}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Concept */}
          <div className='space-y-2'>
            <label className='text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1'>
              {t('cashMovement.field.concept', 'Concepto')}
            </label>
            <div className="relative">
              <select
                value={formData.concept}
                onChange={e => handleInputChange('concept', e.target.value)}
                className='w-full h-11 pl-4 pr-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer transition-all'
                required
              >
                <option value=''>
                  {t(
                    'cashMovement.field.concept.placeholder',
                    'Seleccionar Concepto'
                  )}
                </option>
                {concepts[formData.movementType].map(concept => (
                  <option key={concept} value={concept}>
                    {concept}
                  </option>
                ))}
              </select>
              <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Amount */}
          <div className='space-y-2'>
            <label className='text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1'>
              {t('cashMovement.field.amount', 'Monto')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
              <Input
                type='number'
                value={formData.amount}
                onChange={e => handleInputChange('amount', e.target.value)}
                placeholder='0.00'
                step='0.01'
                min='0.01'
                className='h-11 pl-8 font-mono font-semibold tabular-nums rounded-lg border-slate-200 focus:ring-primary'
                required
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className='space-y-2'>
          <label className='text-xs font-semibold uppercase tracking-widest text-slate-500 ml-1'>
            {t('cashMovement.field.notes', 'Notas (Opcional)')}
          </label>
          <Textarea
            value={formData.notes}
            onChange={e => handleInputChange('notes', e.target.value)}
            placeholder={t(
              'cashMovement.field.notes.placeholder',
              'Añada una descripción detallada si es necesario...'
            )}
            rows={4}
            className='resize-none rounded-lg border-slate-200 focus:ring-primary'
          />
        </div>
      </div>

      {/* Messages */}
      {(success || error) && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
          success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="material-icons-round text-[20px]">
            {success ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-medium">
            {success ? t('cashMovement.success', 'Movimiento registrado con éxito.') : error}
          </span>
        </div>
      )}
    </div>
  )
}

export default RegisterCashMovement
