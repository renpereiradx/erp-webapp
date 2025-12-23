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
      theme: 'theme-income', // Clase CSS para estilos específicos
      icon: (
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='text-green-600'
        >
          <path d='M12 5v14M5 12l7 7 7-7' />
        </svg>
      ),
    },
    EXPENSE: {
      title: t('cashMovement.type.expense.title', 'Registrar Egreso'),
      description: t(
        'cashMovement.type.expense.desc',
        'Salida de dinero de la caja'
      ),
      theme: 'theme-expense',
      icon: (
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='text-red-600'
        >
          <path d='M12 19V5M5 12l7-7 7 7' />
        </svg>
      ),
    },
    ADJUSTMENT: {
      title: t('cashMovement.type.adjustment.title', 'Registrar Ajuste'),
      description: t(
        'cashMovement.type.adjustment.desc',
        'Corrección de balance'
      ),
      theme: 'theme-adjustment',
      icon: (
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='text-orange-600'
        >
          <circle cx='12' cy='12' r='3'></circle>
          <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'></path>
        </svg>
      ),
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
      <div className='register-cash-movement-page'>
        <div className='register-cash-movement-page__loading'>
          {t('common.loading', 'Cargando...')}
        </div>
      </div>
    )
  }

  const currentConfig = MOVEMENT_CONFIG[formData.movementType]

  return (
    <div className={`register-cash-movement-page ${currentConfig.theme}`}>
      {/* Header */}
      <div className='register-cash-movement-page__header'>
        <div className='flex items-center gap-3'>
          <div className={`p-2 rounded-lg ${currentConfig.bgClass}`}>
            {currentConfig.icon}
          </div>
          <div>
            <h1 className='register-cash-movement-page__title'>
              {currentConfig.title}
            </h1>
            <p className='text-sm text-gray-500 mt-1'>
              {currentConfig.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='register-cash-movement-page__actions'>
          <button
            type='button'
            className='btn btn--ghost'
            onClick={handleCancel}
            disabled={loading}
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            type='button'
            className='btn btn--subtle'
            onClick={() => handleSubmit(true)}
            disabled={loading || !activeCashRegister}
          >
            {t('cashMovement.action.saveAndNew', 'Guardar y Nuevo')}
          </button>
          <button
            type='button'
            className='btn btn--primary'
            onClick={() => handleSubmit(false)}
            disabled={loading || !activeCashRegister}
          >
            {loading
              ? t('common.saving', 'Guardando...')
              : t('common.save', 'Guardar')}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className='register-cash-movement-page__content'>
        {/* Movement Type Selector */}
        <div className='register-cash-movement-page__field register-cash-movement-page__field--full mb-6'>
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
            aria-label={t(
              'cashMovement.field.movementType',
              'Tipo de Movimiento'
            )}
          />
        </div>

        {/* Balance Info Card */}
        {activeCashRegister && (
          <div className='register-cash-movement-page__field register-cash-movement-page__field--full'>
            <div className='bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center'>
              <div>
                <span className='text-sm text-gray-500 block'>Caja Actual</span>
                <span className='font-medium'>{activeCashRegister.name}</span>
              </div>
              <div className='text-right'>
                <span className='text-sm text-gray-500 block'>
                  Balance Disponible
                </span>
                <span
                  className={`text-xl font-bold font-mono ${
                    formData.movementType === 'EXPENSE'
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}
                >
                  $
                  {activeCashRegister.current_balance?.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                  }) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Concept */}
        <div className='register-cash-movement-page__field'>
          <label className='register-cash-movement-page__label'>
            {t('cashMovement.field.concept', 'Concepto')}
          </label>
          <select
            value={formData.concept}
            onChange={e => handleInputChange('concept', e.target.value)}
            className='register-cash-movement-page__select'
            data-slot='select-trigger'
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
        </div>

        {/* Amount */}
        <div className='register-cash-movement-page__field'>
          <label className='register-cash-movement-page__label'>
            {t('cashMovement.field.amount', 'Monto')}
          </label>
          <Input
            type='number'
            value={formData.amount}
            onChange={e => handleInputChange('amount', e.target.value)}
            placeholder='$ 0.00'
            step='0.01'
            min='0.01'
            className='register-cash-movement-page__input'
            required
          />
        </div>

        {/* Notes */}
        <div className='register-cash-movement-page__field register-cash-movement-page__field--full'>
          <label className='register-cash-movement-page__label'>
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
            className='register-cash-movement-page__textarea'
          />
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className='register-cash-movement-page__success'>
          <svg
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='register-cash-movement-page__success-icon'
          >
            <path
              fillRule='evenodd'
              clipRule='evenodd'
              d='M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM13.7071 8.70711C14.0976 8.31658 14.0976 7.68342 13.7071 7.29289C13.3166 6.90237 12.6834 6.90237 12.2929 7.29289L9 10.5858L7.70711 9.29289C7.31658 8.90237 6.68342 8.90237 6.29289 9.29289C5.90237 9.68342 5.90237 10.3166 6.29289 10.7071L8.29289 12.7071C8.68342 13.0976 9.31658 13.0976 9.70711 12.7071L13.7071 8.70711Z'
              fill='currentColor'
            />
          </svg>
          <span>
            {t('cashMovement.success', 'Movimiento registrado con éxito.')}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='register-cash-movement-page__error'>
          <svg
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='register-cash-movement-page__error-icon'
          >
            <path
              fillRule='evenodd'
              clipRule='evenodd'
              d='M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM8.70711 7.29289C8.31658 6.90237 7.68342 6.90237 7.29289 7.29289C6.90237 7.68342 6.90237 8.31658 7.29289 8.70711L8.58579 10L7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071C7.68342 13.0976 8.31658 13.0976 8.70711 12.7071L10 11.4142L11.2929 12.7071C11.6834 13.0976 12.3166 13.0976 12.7071 12.7071C13.0976 12.3166 13.0976 11.6834 12.7071 11.2929L11.4142 10L12.7071 8.70711C13.0976 8.31658 13.0976 7.68342 12.7071 7.29289C12.3166 6.90237 11.6834 6.90237 11.2929 7.29289L10 8.58579L8.70711 7.29289Z'
              fill='currentColor'
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default RegisterCashMovement
