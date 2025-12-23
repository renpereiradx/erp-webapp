import { useState } from 'react'
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { useToast } from '@/hooks/useToast'
import '@/styles/scss/pages/_cash-movements.scss'

const CashMovements = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { addToast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    movement_type: 'INCOME',
    cash_register_id: '1', // Default to Caja Principal
    concept: '',
    amount: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data for demo
  const cashRegisters = [
    { id: '1', name: 'Caja Principal' },
    { id: '2', name: 'Caja Chica' },
    { id: '3', name: 'Caja Fuerte' },
  ]

  const concepts = {
    INCOME: [
      { id: 'cash_sale', name: 'Venta en Efectivo' },
      { id: 'open_cash', name: 'Apertura de Caja' },
      { id: 'reposition', name: 'Reposición' },
    ],
    EXPENSE: [
      { id: 'purchase', name: 'Compra de insumos' },
      { id: 'service', name: 'Pago de servicio' },
      { id: 'other_expense', name: 'Otro egreso' },
    ],
    ADJUSTMENT: [
      { id: 'difference', name: 'Ajuste por diferencia' },
      { id: 'correction', name: 'Corrección' },
    ],
  }

  const movementTypes = [
    { value: 'INCOME', label: t('cashMovement.type.income', 'Ingreso') },
    { value: 'EXPENSE', label: t('cashMovement.type.expense', 'Egreso') },
    { value: 'ADJUSTMENT', label: t('cashMovement.type.adjustment', 'Ajuste') },
  ]

  const handleTypeChange = value => {
    setFormData(prev => ({
      ...prev,
      movement_type: value,
      concept: '', // Reset concept when type changes
    }))
  }

  const handleSubmit = async (e, saveAndNew = false) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Implementar llamada al API
      await new Promise(resolve => setTimeout(resolve, 1000))

      addToast({
        type: 'success',
        message: t('cashMovement.success', 'Movimiento registrado con éxito.'),
      })

      if (saveAndNew) {
        // Reset form
        setFormData({
          movement_type: 'INCOME',
          cash_register_id: formData.cash_register_id,
          concept: '',
          amount: '',
          notes: '',
        })
      } else {
        // Navigate back or to list
        navigate('/inicio-caja')
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: t('cashMovement.error', 'Error al registrar el movimiento.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/inicio-caja')
  }

  return (
    <div className='cash-movements-page'>
      {/* Breadcrumb */}
      <Breadcrumb className='cash-movements-page__breadcrumb'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/'>
              {t('common.home', 'Inicio')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href='/inicio-caja'>
              {t(
                'cashMovement.breadcrumb.cashMovements',
                'Movimientos de Caja'
              )}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t('cashMovement.breadcrumb.newMovement', 'Nuevo Registro')}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className='cash-movements-page__header'>
        <div className='cash-movements-page__header-content'>
          <h1 className='cash-movements-page__title'>
            {t('cashMovement.title', 'Registrar Movimiento Manual de Efectivo')}
          </h1>
          <p className='cash-movements-page__description'>
            {t('cashMovement.subtitle')}
          </p>
        </div>

        <div className='cash-movements-page__actions'>
          <Button
            type='button'
            variant='secondary'
            onClick={handleCancel}
            disabled={isSubmitting}
            className='cash-movements-page__btn-cancel'
          >
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={e => handleSubmit(e, true)}
            disabled={isSubmitting}
            className='cash-movements-page__btn-save-new'
          >
            {t('cashMovement.saveAndNew', 'Guardar y Nuevo')}
          </Button>
          <Button
            type='submit'
            form='cash-movement-form'
            disabled={isSubmitting}
            className='cash-movements-page__btn-save'
          >
            {isSubmitting
              ? t('common.saving', 'Guardando...')
              : t('common.save', 'Guardar')}
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <div className='cash-movements-page__card'>
        <form
          id='cash-movement-form'
          className='cash-movements-page__form'
          onSubmit={e => handleSubmit(e, false)}
        >
          {/* Tipo de Movimiento */}
          <div className='form-group'>
            <Label htmlFor='movement-type' className='form-group__label'>
              {t('cashMovement.field.movementType', 'Tipo de Movimiento')}
            </Label>
            <SegmentedControl
              value={formData.movement_type}
              onChange={handleTypeChange}
              options={movementTypes}
              className='form-group__segmented-control'
            />
          </div>

          {/* Row: Caja Registradora y Concepto */}
          <div className='form-row'>
            <div className='form-group'>
              <Label htmlFor='cash-register' className='form-group__label'>
                {t('cashMovement.field.cashRegister', 'Caja Registradora')}
              </Label>
              <Select
                value={formData.cash_register_id}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, cash_register_id: value }))
                }
                required
              >
                <SelectTrigger id='cash-register'>
                  <SelectValue
                    placeholder={t(
                      'cashMovement.placeholder.selectCashRegister',
                      'Seleccionar Caja'
                    )}
                  />
                </SelectTrigger>
                <SelectContent className='cash-movements-page__select-content'>
                  {cashRegisters.map(register => (
                    <SelectItem key={register.id} value={register.id}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='form-group'>
              <Label htmlFor='concept' className='form-group__label'>
                {t('cashMovement.field.concept', 'Concepto')}
              </Label>
              <Select
                value={formData.concept}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, concept: value }))
                }
                required
              >
                <SelectTrigger id='concept'>
                  <SelectValue
                    placeholder={t(
                      'cashMovement.placeholder.selectConcept',
                      'Seleccionar Concepto'
                    )}
                  />
                </SelectTrigger>
                <SelectContent className='cash-movements-page__select-content'>
                  {concepts[formData.movement_type]?.map(concept => (
                    <SelectItem key={concept.id} value={concept.id}>
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monto */}
          <div className='form-group'>
            <Label htmlFor='amount' className='form-group__label'>
              {t('cashMovement.field.amount', 'Monto')}
            </Label>
            <div className='form-group__input-wrapper'>
              <span className='form-group__input-prefix'>Gs.</span>
              <Input
                id='amount'
                type='number'
                min='0'
                step='0.01'
                value={formData.amount}
                onChange={e =>
                  setFormData(prev => ({ ...prev, amount: e.target.value }))
                }
                placeholder='0.00'
                required
                className='form-group__input--with-prefix'
              />
            </div>
          </div>

          {/* Notas */}
          <div className='form-group'>
            <Label htmlFor='notes' className='form-group__label'>
              {t('cashMovement.field.notes', 'Notas')}
              <span className='form-group__label-optional'>
                {' '}
                ({t('common.optional', 'Opcional')})
              </span>
            </Label>
            <Textarea
              id='notes'
              value={formData.notes}
              onChange={e =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              placeholder={t(
                'cashMovement.placeholder.notes',
                'Añada una descripción detallada si es necesario...'
              )}
              rows={4}
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default CashMovements
