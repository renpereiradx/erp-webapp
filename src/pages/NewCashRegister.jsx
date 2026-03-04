/**
 * Cash Register Management Page - Fluent Design System
 * Gestión de Cajas Registradoras (Apertura y Cierre)
 *
 * Design: Fluent 2.0 Design System
 * Features:
 * - Panel lateral con estado de caja activa
 * - Formularios optimizados con validación
 * - Animaciones y transiciones fluidas
 * - i18n completo
 */

import React, { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { useCashRegisterStore } from '@/store/useCashRegisterStore'
import useDashboardStore from '@/store/useDashboardStore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import DataState from '@/components/ui/DataState'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'
import {
  Calculator,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
  Store
} from 'lucide-react'

const NewCashRegister = () => {
  const { t } = useI18n()
  const { fetchDashboardData } = useDashboardStore()
  const toast = useToast()

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

  const [activeTab, setActiveTab] = useState('open')

  const [openForm, setOpenForm] = useState({
    name: '',
    location: '',
    openingDate: new Date().toISOString().split('T')[0],
    initialBalance: '',
    openingNotes: '',
  })

  const [closeForm, setCloseForm] = useState({
    cashier: '',
    register: '',
    closingDate: new Date().toISOString().split('T')[0],
    finalBalance: '',
    closingNotes: '',
  })

  const [formError, setFormError] = useState('')

  useEffect(() => {
    getActiveCashRegister()
  }, [getActiveCashRegister])

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

  const handleAmountChange = (formSetter, field, value) => {
    const numericValue = parseFormattedNumber(value)
    formSetter(prev => ({ ...prev, [field]: numericValue }))
    setFormError('')
  }

  const handleOpenFormChange = (field, value) => {
    setOpenForm(prev => ({ ...prev, [field]: value }))
    setFormError('')
  }

  const handleOpenSubmit = async e => {
    e.preventDefault()
    setFormError('')

    if (!openForm.name || openForm.name.trim() === '') {
      setFormError(t('cashRegister.error.noName', 'Debe ingresar un nombre para la caja'))
      return
    }

    if (!openForm.initialBalance || parseFloat(openForm.initialBalance) <= 0) {
      setFormError(t('cashRegister.error.invalidBalance', 'El saldo inicial debe ser mayor a 0'))
      return
    }

    try {
      await openCashRegister({
        name: openForm.name.trim(),
        initial_balance: parseFloat(openForm.initialBalance),
        location: openForm.location?.trim() || null,
        description: openForm.openingNotes?.trim() || null,
      })

      toast.success(t('cashRegister.success.opened', 'Caja registradora abierta exitosamente'), 4000)
      fetchDashboardData()

      setOpenForm({
        name: '',
        location: '',
        openingDate: new Date().toISOString().split('T')[0],
        initialBalance: '',
        openingNotes: '',
      })

      await getActiveCashRegister()
    } catch (error) {
      toast.error(error.message || t('cashRegister.error.opening', 'Error al abrir la caja registradora'), 5000)
      setFormError(error.message || t('cashRegister.error.opening', 'Error al abrir la caja registradora'))
    }
  }

  const handleCloseFormChange = (field, value) => {
    setCloseForm(prev => ({ ...prev, [field]: value }))
    setFormError('')
  }

  const handleCloseSubmit = async e => {
    e.preventDefault()
    setFormError('')

    if (!activeCashRegister) {
      setFormError(t('cashRegister.status.noActive', 'No hay caja activa'))
      return
    }

    if (!closeForm.finalBalance || parseFloat(closeForm.finalBalance) < 0) {
      setFormError(t('cashRegister.error.invalidBalance', 'El saldo ingresado no es válido'))
      return
    }

    try {
      const closedRegisterName = activeCashRegister.name
      await closeCashRegister(activeCashRegister.id, {
        final_balance: parseFloat(closeForm.finalBalance),
        notes: closeForm.closingNotes || null,
      })

      toast.success(t('cashRegister.success.closed', 'Caja registradora cerrada exitosamente') + ` — ${closedRegisterName}`, 4000)
      fetchDashboardData()

      setCloseForm({
        cashier: '',
        register: '',
        closingDate: new Date().toISOString().split('T')[0],
        finalBalance: '',
        closingNotes: '',
      })

      setActiveTab('open')
      await getActiveCashRegister()
    } catch (error) {
      toast.error(error.message || t('cashRegister.error.closing', 'Error al cerrar la caja registradora'), 5000)
      setFormError(error.message || t('cashRegister.error.closing', 'Error al cerrar la caja registradora'))
    }
  }

  const calculateDifference = () => {
    if (!activeCashRegister || !closeForm.finalBalance) return 0
    const finalBalance = parseFloat(closeForm.finalBalance)
    const currentBalance = activeCashRegister.current_balance || activeCashRegister.initial_balance || 0
    return finalBalance - currentBalance
  }

  const getSystemBalance = () => {
    if (!activeCashRegister) return 0
    return activeCashRegister.current_balance || activeCashRegister.initial_balance || 0
  }

  const formatTimeOpen = () => {
    if (!activeCashRegister?.opened_at) return null
    const openedDate = new Date(activeCashRegister.opened_at)
    const now = new Date()
    const diffMs = now - openedDate
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m`
    }
    return `${diffMins}m`
  }

  if (isActiveCashRegisterLoading) {
    return <DataState variant='loading' skeletonVariant='list' count={3} />
  }

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
    <div className='flex flex-col gap-6 animate-in fade-in duration-500'>
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />

      {/* Header Section */}
      <div className='flex flex-col md:flex-row md:items-start justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='size-12 bg-primary/10 rounded-xl flex items-center justify-center'>
            <Calculator className='text-primary' size={28} />
          </div>
          <div className='space-y-0.5'>
            <h1 className='text-2xl md:text-3xl font-black text-text-main tracking-tight'>
              {t('cashRegister.title', 'Cajas Registradoras')}
            </h1>
            <p className='text-sm text-text-secondary font-medium'>
              {t('cashRegister.subtitle', 'Gestiona la apertura y cierre de cajas')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
        
        {/* Active Cash Register Panel - Sidebar */}
        {activeCashRegister && (
          <div className='xl:col-span-4'>
            <div className='bg-surface rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden sticky top-24'>
              {/* Status Header */}
              <div className='bg-success/10 px-5 py-4 border-b border-success/20'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='size-2 rounded-full bg-success animate-pulse' />
                    <span className='text-[10px] font-black uppercase tracking-[0.15em] text-success'>
                      {t('cashRegister.status.active', 'Caja Activa')}
                    </span>
                  </div>
                  {formatTimeOpen() && (
                    <div className='flex items-center gap-1 text-xs text-text-secondary'>
                      <Clock size={14} />
                      <span>{formatTimeOpen()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cash Register Info */}
              <div className='p-5 space-y-4'>
                <div>
                  <p className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1'>
                    {t('cashRegister.field.name', 'Nombre')}
                  </p>
                  <h3 className='text-lg font-bold text-text-main'>{activeCashRegister.name}</h3>
                </div>

                {activeCashRegister.location && (
                  <div className='flex items-start gap-2'>
                    <MapPin size={18} className='text-text-secondary mt-0.5' />
                    <div>
                      <p className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400'>
                        {t('cashRegister.field.location', 'Ubicación')}
                      </p>
                      <p className='text-sm font-medium text-text-main'>{activeCashRegister.location}</p>
                    </div>
                  </div>
                )}

                {/* Balance Card */}
                <div className='bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/10'>
                  <p className='text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1'>
                    {t('cashRegister.field.currentBalance', 'Saldo Actual')}
                  </p>
                  <p className='text-3xl font-black text-primary tracking-tight'>
                    ₲{getSystemBalance().toLocaleString('es-PY')}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className='grid grid-cols-2 gap-3'>
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <p className='text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5'>
                      {t('cashRegister.field.initialBalance', 'Saldo Inicial')}
                    </p>
                    <p className='text-sm font-bold text-text-main'>
                      ₲{(activeCashRegister.initial_balance || 0).toLocaleString('es-PY')}
                    </p>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <p className='text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5'>
                      {t('cashRegister.field.openedAt', 'Abierta')}
                    </p>
                    <p className='text-sm font-bold text-text-main'>
                      {activeCashRegister.opened_at 
                        ? new Date(activeCashRegister.opened_at).toLocaleDateString('es-PY', { 
                            day: '2-digit', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'
                      }
                    </p>
                  </div>
                </div>

                {/* Quick Action */}
                <Button
                  onClick={() => setActiveTab('close')}
                  variant='primary'
                  className='w-full'
                >
                  {t('cashRegister.tab.close', 'Cerrar Caja')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Panel */}
        <div className={activeCashRegister ? 'xl:col-span-8' : 'xl:col-span-12'}>
          <div className='bg-surface rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden'>
            
            {/* Tabs Header */}
            <div className='flex border-b border-border-subtle bg-gray-50/50'>
              <button
                onClick={() => setActiveTab('open')}
                className={`flex items-center justify-center gap-2 flex-1 py-4 px-6 text-sm font-bold transition-all ${
                  activeTab === 'open'
                    ? 'text-primary border-b-2 border-primary bg-white'
                    : 'text-text-secondary hover:text-text-main hover:bg-gray-100'
                }`}
              >
                <Calculator size={20} />
                {t('cashRegister.tab.open', 'Abrir Caja')}
              </button>
              <button
                onClick={() => setActiveTab('close')}
                className={`flex items-center justify-center gap-2 flex-1 py-4 px-6 text-sm font-bold transition-all ${
                  activeTab === 'close'
                    ? 'text-primary border-b-2 border-primary bg-white'
                    : 'text-text-secondary hover:text-text-main hover:bg-gray-100'
                }`}
              >
                <CheckCircle2 size={20} />
                {t('cashRegister.tab.close', 'Cerrar Caja')}
              </button>
            </div>

            {/* Tab Content */}
            <div className='p-6'>
              {/* Open Tab */}
              {activeTab === 'open' && (
                <div className='space-y-6'>
                  {/* Warning Banner */}
                  {activeCashRegister && (
                    <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3'>
                      <AlertTriangle size={24} className='text-amber-600 flex-shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <p className='font-bold text-amber-800 text-sm'>
                          {t('cashRegister.warning.alreadyOpen', 'Ya tienes una caja abierta')}
                        </p>
                        <p className='text-amber-700 text-sm mt-1'>
                          {t('cashRegister.warning.closeFirst', 'Debes cerrar la caja actual antes de abrir una nueva.')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleOpenSubmit} className='space-y-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                      {/* Name */}
                      <div className='md:col-span-2'>
                        <label htmlFor='open-name' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <Calculator size={16} className='text-primary' />
                          {t('cashRegister.open.name', 'Nombre de la Caja')} *
                        </label>
                        <Input
                          id='open-name'
                          type='text'
                          value={openForm.name}
                          onChange={e => handleOpenFormChange('name', e.target.value)}
                          placeholder={t('cashRegister.open.name.placeholder', 'Ej: Caja Principal - Turno Mañana')}
                          className='h-11'
                          required
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label htmlFor='open-location' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <Store size={16} className='text-primary' />
                          {t('cashRegister.open.location', 'Ubicación')}
                        </label>
                        <Input
                          id='open-location'
                          type='text'
                          value={openForm.location}
                          onChange={e => handleOpenFormChange('location', e.target.value)}
                          placeholder={t('cashRegister.open.location.placeholder', 'Ej: Punto de Venta 1')}
                          className='h-11'
                        />
                      </div>

                      {/* Opening Date */}
                      <div>
                        <label htmlFor='open-date' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <Calendar size={16} className='text-primary' />
                          {t('cashRegister.open.openingDate', 'Fecha de Apertura')}
                        </label>
                        <Input
                          id='open-date'
                          type='date'
                          value={openForm.openingDate}
                          onChange={e => handleOpenFormChange('openingDate', e.target.value)}
                          className='h-11'
                        />
                      </div>

                      {/* Initial Balance */}
                      <div className='md:col-span-2'>
                        <label htmlFor='open-balance' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <DollarSign size={16} className='text-primary' />
                          {t('cashRegister.open.initialBalance', 'Saldo Inicial')} *
                        </label>
                        <div className='relative'>
                          <span className='absolute inset-y-0 left-0 pl-4 flex items-center text-text-secondary font-bold text-lg'>
                            ₲
                          </span>
                          <Input
                            id='open-balance'
                            type='text'
                            inputMode='numeric'
                            value={formatNumber(openForm.initialBalance)}
                            onChange={e => handleAmountChange(setOpenForm, 'initialBalance', e.target.value)}
                            placeholder='0'
                            className='h-12 pl-10 text-lg font-semibold'
                            required
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className='md:col-span-2'>
                        <label htmlFor='open-notes' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <FileText size={16} className='text-primary' />
                          {t('cashRegister.open.openingNotes', 'Notas de Apertura')}
                        </label>
                        <Textarea
                          id='open-notes'
                          value={openForm.openingNotes}
                          onChange={e => handleOpenFormChange('openingNotes', e.target.value)}
                          placeholder={t('cashRegister.open.openingNotes.placeholder', 'Añadir una descripción o nota (opcional)')}
                          className='resize-none'
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {formError && activeTab === 'open' && (
                      <div className='bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2'>
                        <Info size={18} className='text-red-500' />
                        <p className='text-sm text-red-600 font-medium'>{formError}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className='flex gap-3 pt-2'>
                      <Button
                        type='submit'
                        disabled={isOpeningCashRegister || !!activeCashRegister}
                        variant='primary'
                        className='flex-1 h-11'
                      >
                        {isOpeningCashRegister
                          ? t('cashRegister.opening', 'Abriendo caja...')
                          : t('cashRegister.open.action', 'Abrir Caja')}
                      </Button>
                      <Button
                        type='button'
                        variant='secondary'
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
                        className='h-11'
                      >
                        {t('action.cancel', 'Limpiar')}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Close Tab */}
              {activeTab === 'close' && (
                <div className='space-y-6'>
                  {activeCashRegister ? (
                    <form onSubmit={handleCloseSubmit} className='space-y-5'>
                      {/* Info Card */}
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3'>
                        <Info size={24} className='text-info flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <p className='font-bold text-text-main text-sm'>
                            {t('cashRegister.close.info', 'Cerrando caja')}: {activeCashRegister.name}
                          </p>
                          <p className='text-text-secondary text-sm mt-1'>
                            {t('cashRegister.close.systemBalance', 'Saldo del Sistema')}: 
                            <span className='font-bold ml-1'>₲{getSystemBalance().toLocaleString('es-PY')}</span>
                          </p>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                        {/* Location (read-only) */}
                        <div>
                        <label htmlFor='close-location' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <MapPin size={16} className='text-text-secondary' />
                            {t('cashRegister.close.location', 'Ubicación')}
                          </label>
                          <Input
                            id='close-location'
                            type='text'
                            value={activeCashRegister.location || '-'}
                            disabled
                            className='h-11 bg-gray-100 text-text-secondary'
                          />
                        </div>

                        {/* Register (read-only) */}
                        <div>
                        <label htmlFor='close-register' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <Calculator size={16} className='text-text-secondary' />
                            {t('cashRegister.close.register', 'Caja')}
                          </label>
                          <Input
                            id='close-register'
                            type='text'
                            value={activeCashRegister.name || ''}
                            disabled
                            className='h-11 bg-gray-100 text-text-secondary'
                          />
                        </div>

                        {/* Closing Date */}
                        <div>
                        <label htmlFor='close-date' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <Calendar size={16} className='text-primary' />
                            {t('cashRegister.close.closingDate', 'Fecha de Cierre')}
                          </label>
                          <Input
                            id='close-date'
                            type='date'
                            value={closeForm.closingDate}
                            onChange={e => handleCloseFormChange('closingDate', e.target.value)}
                            className='h-11'
                          />
                        </div>

                        {/* Final Balance */}
                        <div>
                        <label htmlFor='close-balance' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <DollarSign size={16} className='text-primary' />
                            {t('cashRegister.close.finalBalance', 'Saldo Final')} *
                          </label>
                          <div className='relative'>
                            <span className='absolute inset-y-0 left-0 pl-4 flex items-center text-text-secondary font-bold text-lg'>
                              ₲
                            </span>
                            <Input
                              id='close-balance'
                              type='text'
                              inputMode='numeric'
                              value={formatNumber(closeForm.finalBalance)}
                              onChange={e => handleAmountChange(setCloseForm, 'finalBalance', e.target.value)}
                              placeholder={formatNumber(getSystemBalance()) || '0'}
                              className='h-12 pl-10 text-lg font-semibold'
                              required
                            />
                          </div>
                        </div>

                        {/* Difference Display */}
                        {closeForm.finalBalance && (
                          <div className='md:col-span-2'>
                            <div className={`rounded-lg p-4 flex items-center gap-3 ${
                              calculateDifference() >= 0 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              {calculateDifference() >= 0 ? (
                                <TrendingUp size={24} className='text-success' />
                              ) : (
                                <TrendingDown size={24} className='text-error' />
                              )}
                              <div>
                                <p className={`text-sm font-medium ${
                                  calculateDifference() >= 0 ? 'text-success' : 'text-error'
                                }`}>
                                  {t('cashRegister.close.difference', 'Diferencia')}
                                </p>
                                <p className={`text-2xl font-black ${
                                  calculateDifference() >= 0 ? 'text-success' : 'text-error'
                                }`}>
                                  {calculateDifference() >= 0 ? '+' : ''}₲{calculateDifference().toLocaleString('es-PY')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Closing Notes */}
                        <div className='md:col-span-2'>
                        <label htmlFor='close-notes' className='flex items-center gap-1.5 text-sm font-semibold text-text-main mb-2'>
                          <FileText size={16} className='text-primary' />
                            {t('cashRegister.close.closingNotes', 'Notas de Cierre')}
                          </label>
                          <Textarea
                            id='close-notes'
                            value={closeForm.closingNotes}
                            onChange={e => handleCloseFormChange('closingNotes', e.target.value)}
                            placeholder={t('cashRegister.close.closingNotes.placeholder', 'Observaciones del cierre (opcional)')}
                            className='resize-none'
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Error */}
                      {formError && activeTab === 'close' && (
                        <div className='bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2'>
                          <InfoOutlined sx={{ fontSize: 18 }} className='text-red-500' />
                          <p className='text-sm text-red-600 font-medium'>{formError}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className='flex gap-3 pt-2'>
                        <Button
                          type='submit'
                          disabled={isClosingCashRegister}
                          variant='primary'
                          className='flex-1 h-11'
                        >
                          {isClosingCashRegister
                            ? t('cashRegister.closing', 'Cerrando caja...')
                            : t('cashRegister.close.action', 'Cerrar Caja')}
                        </Button>
                        <Button
                          type='button'
                          variant='secondary'
                          onClick={() => {
                            setCloseForm({
                              cashier: '',
                              register: '',
                              closingDate: new Date().toISOString().split('T')[0],
                              finalBalance: '',
                              closingNotes: '',
                            })
                            setFormError('')
                            setActiveTab('open')
                          }}
                          className='h-11'
                        >
                          {t('action.cancel', 'Cancelar')}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className='py-12'>
                      <DataState
                        variant='empty'
                        title={t('cashRegister.status.noActive', 'No hay caja activa')}
                        description={t('cashRegister.empty.message', 'Abre una nueva caja para comenzar a registrar movimientos.')}
                      />
                      <div className='flex justify-center mt-6'>
                        <Button onClick={() => setActiveTab('open')} variant='primary'>
                          {t('cashRegister.tab.open', 'Abrir Caja')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewCashRegister
