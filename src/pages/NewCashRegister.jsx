/**
 * New Cash Register Page - MVP Implementation
 * Gestión de Cajas Registradoras (Apertura y Cierre)
 *
 * Features:
 * - Sistema de tabs para abrir/cerrar caja
 * - Formularios con validación básica
 * - Estilos con Sass/BEM siguiendo Fluent Design System
 * - i18n completo
 * - Estados loading/error/empty
 */

import React, { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { useCashRegisterStore } from '@/store/useCashRegisterStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import DataState from '@/components/ui/DataState'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'

const NewCashRegister = () => {
  const { t } = useI18n()

  // Toast notifications
  const toast = useToast()

  // Store state
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

  // Local state for tabs
  const [activeTab, setActiveTab] = useState('open')

  // Form state for opening cash register
  const [openForm, setOpenForm] = useState({
    name: '',
    location: '',
    openingDate: new Date().toISOString().split('T')[0],
    initialBalance: '',
    openingNotes: '',
  })

  // Form state for closing cash register
  const [closeForm, setCloseForm] = useState({
    cashier: '',
    register: '',
    closingDate: new Date().toISOString().split('T')[0],
    finalBalance: '',
    closingNotes: '',
  })

  // Error state
  const [formError, setFormError] = useState('')

  // Load active cash register on mount
  useEffect(() => {
    getActiveCashRegister()
  }, [getActiveCashRegister])

  // Formateo de números con separador de miles
  const formatNumber = value => {
    if (!value) return ''
    // Remover todo excepto números
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    // Formatear con separador de miles (punto)
    return Number(numericValue).toLocaleString('es-PY')
  }

  const parseFormattedNumber = formattedValue => {
    if (!formattedValue) return ''
    // Remover separadores de miles y obtener número
    return formattedValue.replace(/\./g, '').replace(/,/g, '')
  }

  // Handler especial para campos de monto con formateo
  const handleAmountChange = (formSetter, field, value) => {
    const numericValue = parseFormattedNumber(value)
    formSetter(prev => ({ ...prev, [field]: numericValue }))
    setFormError('')
  }

  // Handlers for opening cash register
  const handleOpenFormChange = (field, value) => {
    setOpenForm(prev => ({ ...prev, [field]: value }))
    setFormError('')
  }

  const handleOpenSubmit = async e => {
    e.preventDefault()
    setFormError('')

    // Basic validation
    if (!openForm.name || openForm.name.trim() === '') {
      setFormError(
        t('cashRegister.error.noName', 'Debe ingresar un nombre para la caja')
      )
      return
    }

    if (!openForm.initialBalance || parseFloat(openForm.initialBalance) <= 0) {
      setFormError(
        t(
          'cashRegister.error.invalidBalance',
          'El saldo inicial debe ser mayor a 0'
        )
      )
      return
    }

    try {
      await openCashRegister({
        name: openForm.name.trim(),
        initial_balance: parseFloat(openForm.initialBalance),
        location: openForm.location?.trim() || null,
        description: openForm.openingNotes?.trim() || null,
      })

      // Show success notification
      toast.success(
        t(
          'cashRegister.success.opened',
          'Caja registradora abierta exitosamente'
        ),
        4000
      )

      // Reset form on success
      setOpenForm({
        name: '',
        location: '',
        openingDate: new Date().toISOString().split('T')[0],
        initialBalance: '',
        openingNotes: '',
      })

      // Reload active cash register
      await getActiveCashRegister()
    } catch (error) {
      toast.error(
        error.message ||
          t(
            'cashRegister.error.opening',
            'Error al abrir la caja registradora'
          ),
        5000
      )
      setFormError(
        error.message ||
          t('cashRegister.error.opening', 'Error al abrir la caja registradora')
      )
    }
  }

  // Handlers for closing cash register
  const handleCloseFormChange = (field, value) => {
    setCloseForm(prev => ({ ...prev, [field]: value }))
    setFormError('')
  }

  const handleCloseSubmit = async e => {
    e.preventDefault()
    setFormError('')

    // Basic validation
    if (!activeCashRegister) {
      setFormError(t('cashRegister.status.noActive', 'No hay caja activa'))
      return
    }

    if (!closeForm.finalBalance || parseFloat(closeForm.finalBalance) < 0) {
      setFormError(
        t(
          'cashRegister.error.invalidBalance',
          'El saldo ingresado no es válido'
        )
      )
      return
    }

    try {
      const closedRegisterName = activeCashRegister.name
      await closeCashRegister(activeCashRegister.id, {
        final_balance: parseFloat(closeForm.finalBalance),
        notes: closeForm.closingNotes || null,
      })

      // Show success notification
      toast.success(
        t(
          'cashRegister.success.closed',
          'Caja registradora cerrada exitosamente'
        ) + ` — ${closedRegisterName}`,
        4000
      )

      // Reset form on success
      setCloseForm({
        cashier: '',
        register: '',
        closingDate: new Date().toISOString().split('T')[0],
        finalBalance: '',
        closingNotes: '',
      })

      // Switch to open tab since there's no active register now
      setActiveTab('open')

      // Reload active cash register
      await getActiveCashRegister()
    } catch (error) {
      toast.error(
        error.message ||
          t(
            'cashRegister.error.closing',
            'Error al cerrar la caja registradora'
          ),
        5000
      )
      setFormError(
        error.message ||
          t(
            'cashRegister.error.closing',
            'Error al cerrar la caja registradora'
          )
      )
    }
  }

  // Calculate difference for closing
  const calculateDifference = () => {
    if (!activeCashRegister || !closeForm.finalBalance) return 0
    const finalBalance = parseFloat(closeForm.finalBalance)
    // Usar current_balance, o initial_balance como fallback si current_balance es 0/null
    const currentBalance =
      activeCashRegister.current_balance ||
      activeCashRegister.initial_balance ||
      0
    return finalBalance - currentBalance
  }

  // Obtener el saldo del sistema (con fallback a initial_balance)
  const getSystemBalance = () => {
    if (!activeCashRegister) return 0
    return (
      activeCashRegister.current_balance ||
      activeCashRegister.initial_balance ||
      0
    )
  }

  // Loading state
  if (isActiveCashRegisterLoading) {
    return <DataState variant='loading' skeletonVariant='list' count={3} />
  }

  // Error state
  if (activeCashRegisterError) {
    return (
      <DataState
        variant='error'
        title={t('cashRegister.error.title', 'Error al cargar cajas')}
        message={activeCashRegisterError}
        onRetry={getActiveCashRegister}
      />
    )
  }

  return (
    <div className='new-cash-register-page'>
      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />

      {/* Header */}
      <div className='new-cash-register-page__header'>
        <h1 className='new-cash-register-page__title'>
          {t('cashRegister.title', 'Gestión de Cajas Registradoras')}
        </h1>
        <p className='new-cash-register-page__subtitle'>
          {t(
            'cashRegister.subtitle',
            'Abre o cierra una caja para registrar los movimientos de efectivo.'
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className='new-cash-register-page__tabs'>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className='new-cash-register-page__tabs-list'>
            <button
              type='button'
              onClick={() => setActiveTab('open')}
              className={`new-cash-register-page__tab-trigger ${
                activeTab === 'open'
                  ? 'new-cash-register-page__tab-trigger--active'
                  : ''
              }`}
            >
              {t('cashRegister.tab.open', 'Abrir Caja')}
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('close')}
              className={`new-cash-register-page__tab-trigger ${
                activeTab === 'close'
                  ? 'new-cash-register-page__tab-trigger--active'
                  : ''
              }`}
            >
              {t('cashRegister.tab.close', 'Cerrar Caja')}
            </button>
          </div>

          {/* Open Cash Register Tab */}
          <TabsContent
            value='open'
            className='new-cash-register-page__tab-content'
          >
            {/* Warning if there's already an active cash register */}
            {activeCashRegister && (
              <div
                className='new-cash-register-page__active-warning'
                style={{
                  padding: '16px',
                  marginBottom: '24px',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <strong style={{ color: '#b45309', fontSize: '15px' }}>
                    {t(
                      'cashRegister.warning.alreadyOpen',
                      'Ya tienes una caja abierta'
                    )}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    paddingLeft: '28px',
                  }}
                >
                  <p style={{ margin: '0 0 4px 0' }}>
                    <strong>{t('cashRegister.field.name', 'Caja')}:</strong>{' '}
                    {activeCashRegister.name}
                  </p>
                  <p style={{ margin: '0 0 4px 0' }}>
                    <strong>
                      {t('cashRegister.field.balance', 'Saldo actual')}:
                    </strong>{' '}
                    ₲{getSystemBalance().toLocaleString()}
                  </p>
                  {activeCashRegister.opened_at && (
                    <p style={{ margin: '0' }}>
                      <strong>
                        {t('cashRegister.field.openedAt', 'Abierta desde')}:
                      </strong>{' '}
                      {new Date(activeCashRegister.opened_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#92400e',
                    margin: '8px 0 0 0',
                    paddingLeft: '28px',
                    fontStyle: 'italic',
                  }}
                >
                  {t(
                    'cashRegister.warning.closeFirst',
                    'Debes cerrar la caja actual antes de abrir una nueva.'
                  )}
                </p>
              </div>
            )}

            <form
              onSubmit={handleOpenSubmit}
              className='new-cash-register-page__form'
            >
              {/* Cash Register Name */}
              <div className='new-cash-register-page__form-field'>
                <label
                  htmlFor='open-name'
                  className='new-cash-register-page__form-label'
                >
                  {t('cashRegister.open.name', 'Nombre de la Caja')}
                </label>
                <Input
                  id='open-name'
                  type='text'
                  value={openForm.name}
                  onChange={e => handleOpenFormChange('name', e.target.value)}
                  placeholder={t(
                    'cashRegister.open.name.placeholder',
                    'Ej: Caja Principal - Turno Mañana'
                  )}
                  className='new-cash-register-page__form-input'
                  required
                />
              </div>

              {/* Location (optional) */}
              <div className='new-cash-register-page__form-field'>
                <label
                  htmlFor='open-location'
                  className='new-cash-register-page__form-label'
                >
                  {t('cashRegister.open.location', 'Ubicación')}
                </label>
                <Input
                  id='open-location'
                  type='text'
                  value={openForm.location}
                  onChange={e =>
                    handleOpenFormChange('location', e.target.value)
                  }
                  placeholder={t(
                    'cashRegister.open.location.placeholder',
                    'Ej: Punto de Venta 1'
                  )}
                  className='new-cash-register-page__form-input'
                />
              </div>

              {/* Opening Date */}
              <div className='new-cash-register-page__form-field'>
                <label
                  htmlFor='open-date'
                  className='new-cash-register-page__form-label'
                >
                  {t('cashRegister.open.openingDate', 'Fecha de Apertura')}
                </label>
                <Input
                  id='open-date'
                  type='date'
                  value={openForm.openingDate}
                  onChange={e =>
                    handleOpenFormChange('openingDate', e.target.value)
                  }
                  className='new-cash-register-page__form-input'
                />
              </div>

              {/* Initial Balance */}
              <div className='new-cash-register-page__form-field'>
                <label
                  htmlFor='open-balance'
                  className='new-cash-register-page__form-label'
                >
                  {t('cashRegister.open.initialBalance', 'Saldo Inicial')}
                </label>
                <div className='new-cash-register-page__form-input-wrapper'>
                  <span className='new-cash-register-page__form-input-prefix'>
                    {t('cashRegister.field.currency', '₲')}
                  </span>
                  <Input
                    id='open-balance'
                    type='text'
                    inputMode='numeric'
                    value={formatNumber(openForm.initialBalance)}
                    onChange={e =>
                      handleAmountChange(
                        setOpenForm,
                        'initialBalance',
                        e.target.value
                      )
                    }
                    placeholder='0'
                    className='new-cash-register-page__form-input new-cash-register-page__form-input--with-prefix'
                    required
                  />
                </div>
              </div>

              {/* Opening Notes */}
              <div className='new-cash-register-page__form-field new-cash-register-page__form-field--full'>
                <label
                  htmlFor='open-notes'
                  className='new-cash-register-page__form-label'
                >
                  {t('cashRegister.open.openingNotes', 'Notas de Apertura')}
                </label>
                <Textarea
                  id='open-notes'
                  value={openForm.openingNotes}
                  onChange={e =>
                    handleOpenFormChange('openingNotes', e.target.value)
                  }
                  placeholder={t(
                    'cashRegister.open.openingNotes.placeholder',
                    'Añadir una descripción o nota (opcional)'
                  )}
                  className='new-cash-register-page__form-textarea'
                  rows={3}
                />
              </div>

              {/* Error Message */}
              {formError && activeTab === 'open' && (
                <div className='new-cash-register-page__form-field new-cash-register-page__form-field--full'>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                    }}
                  >
                    <p style={{ fontSize: '14px', color: '#dc2626' }}>
                      {formError}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className='new-cash-register-page__form-field new-cash-register-page__form-field--full'>
                <div className='new-cash-register-page__form-actions'>
                  <button
                    type='submit'
                    disabled={isOpeningCashRegister || !!activeCashRegister}
                    className='new-cash-register-page__form-button new-cash-register-page__form-button--primary'
                    title={
                      activeCashRegister
                        ? t(
                            'cashRegister.warning.closeFirst',
                            'Debes cerrar la caja actual antes de abrir una nueva.'
                          )
                        : ''
                    }
                  >
                    {isOpeningCashRegister
                      ? t('cashRegister.opening', 'Abriendo caja...')
                      : t('cashRegister.open.action', 'Abrir Caja')}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setOpenForm({
                        cashier: '',
                        register: '',
                        openingDate: new Date().toISOString().split('T')[0],
                        initialBalance: '',
                        openingNotes: '',
                      })
                      setFormError('')
                    }}
                    className='new-cash-register-page__form-button new-cash-register-page__form-button--secondary'
                  >
                    {t('action.cancel', 'Cancelar')}
                  </button>
                </div>
              </div>
            </form>
          </TabsContent>

          {/* Close Cash Register Tab */}
          <TabsContent
            value='close'
            className='new-cash-register-page__tab-content'
          >
            {activeCashRegister ? (
              <>
                <form
                  onSubmit={handleCloseSubmit}
                  className='new-cash-register-page__form'
                >
                  {/* Cashier (read-only) */}
                  <div className='new-cash-register-page__form-field'>
                    <label
                      htmlFor='close-cashier'
                      className='new-cash-register-page__form-label'
                    >
                      {t('cashRegister.close.cashier', 'Cajero')}
                    </label>
                    <Input
                      id='close-cashier'
                      type='text'
                      value={activeCashRegister.location || ''}
                      disabled
                      className='new-cash-register-page__form-input'
                    />
                  </div>

                  {/* Register (read-only) */}
                  <div className='new-cash-register-page__form-field'>
                    <label
                      htmlFor='close-register'
                      className='new-cash-register-page__form-label'
                    >
                      {t('cashRegister.close.register', 'Caja')}
                    </label>
                    <Input
                      id='close-register'
                      type='text'
                      value={activeCashRegister.name || ''}
                      disabled
                      className='new-cash-register-page__form-input'
                    />
                  </div>

                  {/* Closing Date */}
                  <div className='new-cash-register-page__form-field'>
                    <label
                      htmlFor='close-date'
                      className='new-cash-register-page__form-label'
                    >
                      {t('cashRegister.close.closingDate', 'Fecha de Cierre')}
                    </label>
                    <Input
                      id='close-date'
                      type='date'
                      value={closeForm.closingDate}
                      onChange={e =>
                        handleCloseFormChange('closingDate', e.target.value)
                      }
                      className='new-cash-register-page__form-input'
                    />
                  </div>

                  {/* Final Balance */}
                  <div className='new-cash-register-page__form-field'>
                    <label
                      htmlFor='close-balance'
                      className='new-cash-register-page__form-label'
                    >
                      {t('cashRegister.close.finalBalance', 'Saldo Final')}
                    </label>
                    <div className='new-cash-register-page__form-input-wrapper'>
                      <span className='new-cash-register-page__form-input-prefix'>
                        {t('cashRegister.field.currency', '₲')}
                      </span>
                      <Input
                        id='close-balance'
                        type='text'
                        inputMode='numeric'
                        value={formatNumber(closeForm.finalBalance)}
                        onChange={e =>
                          handleAmountChange(
                            setCloseForm,
                            'finalBalance',
                            e.target.value
                          )
                        }
                        placeholder={formatNumber(getSystemBalance()) || '0'}
                        className='new-cash-register-page__form-input new-cash-register-page__form-input--with-prefix'
                        required
                      />
                    </div>
                    <p
                      style={{
                        fontSize: '14px',
                        marginTop: '4px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {t(
                        'cashRegister.close.systemBalance',
                        'Saldo del Sistema'
                      )}
                      : ₲{getSystemBalance().toLocaleString('es-PY')}
                    </p>
                    {closeForm.finalBalance && (
                      <p
                        style={{
                          fontSize: '14px',
                          marginTop: '4px',
                          fontWeight: 600,
                          color:
                            calculateDifference() >= 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {t('cashRegister.close.difference', 'Diferencia')}: ₲
                        {calculateDifference().toLocaleString('es-PY')}
                      </p>
                    )}
                  </div>

                  {/* Closing Notes */}
                  <div className='new-cash-register-page__form-field new-cash-register-page__form-field--full'>
                    <label
                      htmlFor='close-notes'
                      className='new-cash-register-page__form-label'
                    >
                      {t('cashRegister.close.closingNotes', 'Notas de Cierre')}
                    </label>
                    <Textarea
                      id='close-notes'
                      value={closeForm.closingNotes}
                      onChange={e =>
                        handleCloseFormChange('closingNotes', e.target.value)
                      }
                      placeholder={t(
                        'cashRegister.close.closingNotes.placeholder',
                        'Observaciones del cierre (opcional)'
                      )}
                      className='new-cash-register-page__form-textarea'
                      rows={3}
                    />
                  </div>

                  {/* Error Message */}
                  {formError && activeTab === 'close' && (
                    <div className='new-cash-register-page__form-field new-cash-register-page__form-field--full'>
                      <div
                        style={{
                          padding: '12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                        }}
                      >
                        <p style={{ fontSize: '14px', color: '#dc2626' }}>
                          {formError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className='new-cash-register-page__form-field new-cash-register-page__form-field--full'>
                    <div className='new-cash-register-page__form-actions'>
                      <button
                        type='submit'
                        disabled={isClosingCashRegister}
                        className='new-cash-register-page__form-button new-cash-register-page__form-button--primary'
                      >
                        {isClosingCashRegister
                          ? t('cashRegister.closing', 'Cerrando caja...')
                          : t('cashRegister.close.action', 'Cerrar Caja')}
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setCloseForm({
                            cashier: '',
                            register: '',
                            closingDate: new Date().toISOString().split('T')[0],
                            finalBalance: '',
                            closingNotes: '',
                          })
                          setFormError('')
                        }}
                        className='new-cash-register-page__form-button new-cash-register-page__form-button--secondary'
                      >
                        {t('action.cancel', 'Cancelar')}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <DataState
                variant='empty'
                title={t('cashRegister.status.noActive', 'No hay caja activa')}
                description={t(
                  'cashRegister.empty.message',
                  'No hay cajas registradas. Abre una nueva caja para comenzar.'
                )}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default NewCashRegister
