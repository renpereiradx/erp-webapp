import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Wallet, 
  Receipt, 
  ArrowRight, 
  Coins, 
  Banknote,
  ArrowUpRight,
  User,
  Hash,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useI18n } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cashRegisterService } from '@/services/cashRegisterService'
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

const CASH_REGISTER_NONE_VALUE = '__none__'

/**
 * Normaliza el saldo pendiente para que coincida con el valor mostrado al usuario.
 * Para PYG (guaraníes): redondea a entero (sin decimales).
 * Esto asegura que la validación use el mismo valor que se muestra al usuario.
 */
const getNormalizedBalanceDue = (balanceDue, currency) => {
  if (balanceDue === null || balanceDue === undefined) return null
  const raw = Number(balanceDue)
  if (!Number.isFinite(raw)) return null
  
  const code = normalizeCurrencyCode(currency)
  // PYG siempre sin decimales
  if (code === 'PYG') {
    return Math.round(raw)
  }
  // Otras monedas con 2 decimales
  return Math.round(raw * 100) / 100
}

/**
 * Modal para registrar pagos de órdenes de venta
 * Siguiendo el patrón MVP y Fluent Design System
 *
 * @param {boolean} open - Estado de apertura del modal
 * @param {function} onOpenChange - Callback para cambiar estado del modal
 * @param {object} sale - Objeto de venta con: { id, balance_due, total_amount, client_name }
 * @param {function} onSubmit - Callback para enviar el pago
 */
const RegisterSalePaymentModal = ({ open, onOpenChange, sale, onSubmit }) => {
  const { t, lang } = useI18n()

  // Form state
  const [amountReceived, setAmountReceived] = useState('')
  const [amountToApply, setAmountToApply] = useState('')
  const [notes, setNotes] = useState('')
  const [cashRegisterId, setCashRegisterId] = useState('')

  // Rastrear si el usuario editó manualmente el "Monto a Aplicar"
  const userEditedAmountToApply = useRef(false)

  // Validation and UI state
  const [amountReceivedError, setAmountReceivedError] = useState(null)
  const [amountToApplyError, setAmountToApplyError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setSubmitting] = useState(false)

  // Cash registers state
  const [cashRegisters, setCashRegisters] = useState([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState(false)
  const [cashRegistersError, setCashRegistersError] = useState(null)

  const resetForm = useCallback(() => {
    setAmountReceived('')
    setAmountToApply('')
    setNotes('')
    setCashRegisterId('')
    setAmountReceivedError(null)
    setAmountToApplyError(null)
    setFormError(null)
    setSubmitting(false)
    userEditedAmountToApply.current = false
  }, [])

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  const handleDialogChange = nextOpen => {
    if (!nextOpen) {
      resetForm()
    }
    if (onOpenChange) {
      onOpenChange(nextOpen)
    }
  }

  const formatter = useMemo(() => {
    const locale = lang === 'en' ? 'en-US' : 'es-PY'
    let currencyCode = 'PYG'
    
    try {
      currencyCode = normalizeCurrencyCode(sale?.currency)
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currencyCode === 'PYG' ? 0 : 2,
        maximumFractionDigits: currencyCode === 'PYG' ? 0 : 2,
      })
    } catch (e) {
      console.error('Error creating NumberFormat for currency:', sale?.currency, e)
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    }
  }, [lang, sale?.currency])

  const formatLocalizedCurrency = useCallback(
    value => {
      return formatter.format(Number(value || 0))
    },
    [formatter]
  )

  // Formatear número con puntos cada tres dígitos (ej: 1.000, 10.000)
  const formatNumberWithDots = useCallback(value => {
    if (!value) return ''
    // Remover todo excepto dígitos
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    // Agregar puntos cada tres dígitos
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }, [])

  // Parsear número con puntos a número puro
  const parseNumberWithDots = useCallback(value => {
    if (!value) return ''
    return value.toString().replace(/\./g, '')
  }, [])

  // Validaciones en tiempo real
  const validationErrors = useMemo(() => {
    const errors = {
      amountReceived: null,
      amountToApply: null,
      hasErrors: false,
    }

    // Si no hay sale, no validar aún
    if (!sale) return errors

    // Validar monto recibido
    if (amountReceived) {
      const numericReceived = Number.parseFloat(
        parseNumberWithDots(amountReceived)
      )
      if (!Number.isFinite(numericReceived)) {
        errors.amountReceived = 'Monto inválido'
        errors.hasErrors = true
      } else if (numericReceived < 0) {
        errors.amountReceived = 'El monto recibido no puede ser negativo'
        errors.hasErrors = true
      } else if (numericReceived === 0) {
        errors.amountReceived = 'El monto recibido debe ser mayor a 0'
        errors.hasErrors = true
      }
    }

    // Validar monto a aplicar
    if (amountToApply && amountReceived) {
      const numericReceived = Number.parseFloat(
        parseNumberWithDots(amountReceived)
      )
      const numericToApply = Number.parseFloat(
        parseNumberWithDots(amountToApply)
      )
      const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)

      if (!Number.isFinite(numericToApply)) {
        errors.amountToApply = 'Monto inválido'
        errors.hasErrors = true
      } else if (numericToApply < 0) {
        errors.amountToApply = 'El monto a aplicar no puede ser negativo'
        errors.hasErrors = true
      } else if (numericToApply === 0) {
        errors.amountToApply = 'El monto a aplicar debe ser mayor a 0'
        errors.hasErrors = true
      } else if (numericToApply > numericReceived) {
        errors.amountToApply =
          'No puedes aplicar más dinero del que has recibido'
        errors.hasErrors = true
      } else if (balanceDue !== null && numericToApply > balanceDue) {
        errors.amountToApply = 'No puedes pagar más de lo que debes'
        errors.hasErrors = true
      }
    }

    return errors
  }, [amountReceived, amountToApply, sale, parseNumberWithDots])

  // Calcular vuelto (change)
  const change = useMemo(() => {
    const received = Number.parseFloat(parseNumberWithDots(amountReceived)) || 0
    const toApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || 0
    const calculatedChange = received - toApply
    return calculatedChange > 0 ? calculatedChange : 0
  }, [amountReceived, amountToApply, parseNumberWithDots])

  // Verificar si la factura ya está completamente pagada
  const isAlreadyPaid = useMemo(() => {
    if (!sale) return false
    const balanceDue = Number(sale.balance_due || 0)
    return balanceDue <= 0
  }, [sale])

  // Cálculo de balance proyectado
  const projectedBalance = useMemo(() => {
    if (!sale) return 0
    const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency) || 0
    const toApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || 0
    const result = balanceDue - toApply
    return result > 0 ? result : 0
  }, [sale, amountToApply, parseNumberWithDots])

  const loadCashRegisters = useCallback(async () => {
    setCashRegistersLoading(true)
    setCashRegistersError(null)

    try {
      const [allCashRegisters, activeCashRegister] = await Promise.all([
        cashRegisterService.getCashRegisters(),
        cashRegisterService.getActiveCashRegister().catch(() => null),
      ])

      const openCashRegisters =
        allCashRegisters?.filter(cashRegisterItem => {
          const status =
            cashRegisterItem?.status || cashRegisterItem?.state || ''
          return (
            status.toUpperCase() === 'OPEN' || status.toUpperCase() === 'ACTIVE'
          )
        }) || []

      const cashRegistersWithBalance = await Promise.all(
        openCashRegisters.map(async cashRegisterItem => {
          if (
            typeof cashRegisterItem.current_balance === 'number' &&
            cashRegisterItem.current_balance > 0
          ) {
            return cashRegisterItem
          }

          try {
            const movements = await cashRegisterService.getMovements(
              cashRegisterItem.id
            )
            return calculateCashRegisterBalance(cashRegisterItem, movements)
          } catch (movementError) {
            console.warn(
              'Unable to calculate cash register balance from movements',
              movementError
            )
            return cashRegisterItem
          }
        })
      )

      setCashRegisters(cashRegistersWithBalance)

      const preferredRegisterId =
        activeCashRegister?.id || cashRegistersWithBalance[0]?.id || null

      if (preferredRegisterId) {
        setCashRegisterId(current => current || String(preferredRegisterId))
      }
    } catch (error) {
      console.error('Error loading cash registers for sale payments', error)
      setCashRegisters([])
      setCashRegistersError(
        error?.message || t('sales.registerPaymentModal.cashRegister.loadError')
      )
    } finally {
      setCashRegistersLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!open) return
    loadCashRegisters()
  }, [loadCashRegisters, open])

  useEffect(() => {
    if (!cashRegisterId) return
    const exists = cashRegisters.some(
      register => String(register.id) === String(cashRegisterId)
    )
    if (!exists) {
      setCashRegisterId('')
    }
  }, [cashRegisterId, cashRegisters])

  // Efecto eliminado para permitir tipado manual sin interrupciones destructivas

  const cashRegisterOptions = useMemo(
    () =>
      cashRegisters.map(register => {
        const currencyCode = register.currency || 'PYG'
        const label =
          register.name ||
          register.description ||
          register.label ||
          `Caja #${register.id}`

        const status = register.status || register.state || ''
        const isOpen =
          status.toUpperCase() === 'OPEN' || status.toUpperCase() === 'ACTIVE'

        return {
          value: String(register.id),
          label,
          balanceLabel:
            typeof register.current_balance === 'number'
              ? t('sales.registerPaymentModal.cashRegister.balance', {
                  amount: formatLocalizedCurrency(register.current_balance),
                })
              : null,
          meta:
            register.location ||
            register.branch ||
            register.branch_name ||
            register.site ||
            null,
          isOpen,
        }
      }),
    [cashRegisters, formatLocalizedCurrency, t]
  )

  const selectedCashRegister = useMemo(() => {
    if (!cashRegisterId) return null
    return cashRegisters.find(
      register => String(register.id) === String(cashRegisterId)
    )
  }, [cashRegisterId, cashRegisters])

  const isCashRegisterClosed = useMemo(() => {
    if (!selectedCashRegister) return false
    const status = selectedCashRegister.status || selectedCashRegister.state || ''
    return (
      status.toUpperCase() !== 'OPEN' && status.toUpperCase() !== 'ACTIVE'
    )
  }, [selectedCashRegister])

  const disableForm = !sale || isAlreadyPaid
  const isFormDisabled = disableForm || isSubmitting
  const resolvedCashRegisterValue = cashRegisterId || CASH_REGISTER_NONE_VALUE

  // Deshabilitar submit si:
  // - Formulario deshabilitado
  // - Cajas están cargando
  // - Hay errores de validación en tiempo real
  // - Falta monto recibido o monto a aplicar
  // - Factura ya está pagada
  const isSubmitDisabled =
    isFormDisabled ||
    isCashRegistersLoading ||
    validationErrors.hasErrors ||
    !amountReceived ||
    !amountToApply ||
    isAlreadyPaid

  const handleSubmit = async event => {
    event.preventDefault()
    setAmountReceivedError(null)
    setAmountToApplyError(null)
    setFormError(null)

    if (!sale) {
      setFormError(t('sales.registerPaymentModal.feedback.selectSale'))
      return
    }

    // Validar amount_received (parsear valor formateado)
    const numericAmountReceived = Number.parseFloat(
      parseNumberWithDots(amountReceived)
    )
    if (
      !Number.isFinite(numericAmountReceived) ||
      numericAmountReceived < 0
    ) {
      setAmountReceivedError(
        t('sales.registerPaymentModal.amountReceived.errorRequired')
      )
      return
    }

    // amount_to_apply es opcional - si está vacío, se usa amount_received
    const parsedAmountToApply = amountToApply
      ? Number.parseFloat(parseNumberWithDots(amountToApply))
      : null
    const numericAmountToApply =
      parsedAmountToApply !== null
        ? parsedAmountToApply
        : numericAmountReceived

    // Si amount_to_apply está especificado, validar que sea > 0
    if (parsedAmountToApply !== null && parsedAmountToApply <= 0) {
      setAmountToApplyError(
        t('sales.registerPaymentModal.amountToApply.errorRequired')
      )
      return
    }

    // Validar que amount_to_apply no exceda balance_due
    const normalizedBalanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)
    if (normalizedBalanceDue !== null && numericAmountToApply > normalizedBalanceDue) {
      setAmountToApplyError(
        t('sales.registerPaymentModal.amountToApply.errorExceeded')
      )
      return
    }

    // Validar que amount_to_apply no exceda amount_received
    if (numericAmountToApply > numericAmountReceived) {
      setAmountToApplyError(
        t('sales.registerPaymentModal.amountToApply.errorExceedsReceived')
      )
      return
    }

    // Cash register es opcional - el sistema puede manejarlo automáticamente
    const parsedCashRegisterId = cashRegisterId ? Number(cashRegisterId) : null

    setSubmitting(true)

    try {
      const payload = {
        sales_order_id: sale.id || sale.sale_id,
        amount_received: Number(numericAmountReceived.toFixed(2)),
        payment_notes: notes.trim() || null,
      }

      // amount_to_apply es opcional
      if (parsedAmountToApply !== null) {
        payload.amount_to_apply = Number(numericAmountToApply.toFixed(2))
      }

      // cash_register_id es opcional
      if (parsedCashRegisterId !== null && Number.isFinite(parsedCashRegisterId)) {
        payload.cash_register_id = parsedCashRegisterId
      }

      await onSubmit(payload)
      resetForm()
      handleDialogChange(false)
    } catch (error) {
      setFormError(
        error?.message || t('sales.registerPaymentModal.submitError')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const balanceDueLabel = useMemo(() => {
    if (
      !sale ||
      sale.balance_due === null ||
      sale.balance_due === undefined
    ) {
      return null
    }
    return formatLocalizedCurrency(sale.balance_due)
  }, [formatLocalizedCurrency, sale])


  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='register-sale-payment-modal max-w-5xl p-0 overflow-hidden border-none shadow-2xl'>
        <DialogTitle className='sr-only'>Registrar Pago de Venta</DialogTitle>
        <DialogDescription className='sr-only'>Registre el cobro de la venta seleccionada.</DialogDescription>
        <form
          className='flex flex-col h-full max-h-[90vh]'
          onSubmit={handleSubmit}
        >
          <div className='flex flex-col lg:flex-row h-full overflow-hidden'>
            {/* PANEL IZQUIERDO: RESUMEN (Estilo Premium) */}
            <div className='w-full lg:w-2/5 bg-slate-900 p-8 text-white flex flex-col justify-between overflow-y-auto relative border-r border-white/5'>
              <div className='space-y-8'>
                <div className='flex items-center gap-3 opacity-90 transition-all'>
                  <div className='p-2 bg-white/20 rounded-lg backdrop-blur-md ring-1 ring-white/30'>
                    <Wallet size={20} className='text-primary-foreground' />
                  </div>
                  <span className='text-xs font-black uppercase tracking-[0.2em] text-white/90'>
                    Resumen de Pago
                  </span>
                </div>

                <div className='space-y-1.5'>
                  <div className='flex items-center gap-2 text-white/70'>
                    <User size={14} className='text-primary-foreground' />
                    <span className='text-sm font-bold'>{sale?.client_name || 'Cliente'}</span>
                  </div>
                  <h2 className='text-3xl font-black tracking-tight leading-none text-white'>
                    {sale?.id || sale?.sale_id || 'ID Desconocido'}
                  </h2>
                </div>

                <div className='p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md space-y-4 shadow-2xl'>
                  <div className='space-y-1'>
                    <span className='text-xs font-black text-white/60 uppercase tracking-widest'>Deuda Actual</span>
                    <p className='text-3xl font-black text-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.3)]'>
                      {balanceDueLabel || formatLocalizedCurrency(0)}
                    </p>
                  </div>

                  {amountToApply && !validationErrors.amountToApply && projectedBalance < (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0) && (
                    <div className='pt-4 border-t border-white/20 flex items-center justify-between'>
                      <div className='space-y-1'>
                        <span className='text-[10px] font-black text-white/60 uppercase tracking-widest'>Nuevo Saldo</span>
                        <p className={cn(
                          'text-xl font-black transition-all drop-shadow-sm',
                          projectedBalance <= 0 ? 'text-lime-300' : 'text-orange-300'
                        )}>
                          {formatLocalizedCurrency(projectedBalance)}
                        </p>
                      </div>
                      <div className='p-2 bg-white/10 rounded-full'>
                        <ArrowUpRight size={18} className='text-white/50' />
                      </div>
                    </div>
                  )}
                </div>

                <div className='space-y-4'>
                   <div className='flex items-center justify-between text-xs font-black uppercase tracking-widest text-white/50'>
                      <span>Progreso del Cobro</span>
                      <span className='text-white/90'>{Math.round((Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100)}%</span>
                   </div>
                   <div className='h-2 bg-slate-700/50 rounded-full overflow-hidden'>
                      <div 
                        className='h-full bg-lime-400 transition-all duration-500'
                        style={{ width: `${Math.min(100, Math.round((Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100))}%` }}
                      ></div>
                   </div>
                </div>
              </div>

              <div className='mt-8 pt-6 border-t border-white/10 hidden lg:block'>
                <p className='text-[10px] leading-relaxed text-white/40 uppercase font-black tracking-widest italic'>
                  SISTEMA DE GESTIÓN EMPRESARIAL <br /> <span className='text-white/20'>FACTURACIÓN Y COBRANZAS V2.0</span>
                </p>
              </div>
            </div>

            {/* PANEL DERECHO: FORMULARIO */}
            <div className='w-full lg:w-3/5 p-8 bg-white flex flex-col gap-6 overflow-y-auto'>
              <header className='flex justify-between items-start'>
                <div>
                  <h3 className='text-xl font-black text-slate-900 uppercase tracking-tighter'>Registrar Pago</h3>
                  <p className='text-sm font-medium text-slate-500'>Complete los detalles de la transacción</p>
                </div>
              </header>

              <div className='space-y-6'>
                {/* Monto Recibido */}
                <div className='space-y-2'>
                  <div className='flex justify-between items-end'>
                    <label className='text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2'>
                      <Banknote size={14} className='text-primary' /> Monto Recibido
                    </label>
                    <button
                      type='button'
                      onClick={() => {
                        const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)
                        if (balanceDue !== null) {
                          setAmountReceived(formatNumberWithDots(String(balanceDue)))
                          setAmountReceivedError(null)
                          userEditedAmountToApply.current = false
                        }
                      }}
                      className='text-[10px] font-black uppercase text-primary hover:text-primary-hover underline underline-offset-4 tracking-tighter'
                    >
                      Cobrar todo
                    </button>
                  </div>
                  <div className='relative group'>
                    <Input
                      type='text'
                      inputMode='numeric'
                      value={amountReceived}
                      onChange={e => {
                        const value = e.target.value
                        const numeric = parseNumberWithDots(value)
                        const formatted = formatNumberWithDots(numeric)
                        setAmountReceived(formatted)
                        
                        // Lógica manual de sincronización para evitar loops de efectos
                        if (!userEditedAmountToApply.current) {
                          const balanceDue = getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0
                          const numericValue = Number.parseFloat(numeric) || 0
                          const autoToApply = Math.min(numericValue, balanceDue)
                          setAmountToApply(formatNumberWithDots(String(Math.round(autoToApply))))
                        }
                        
                        setAmountReceivedError(null)
                      }}
                      placeholder='0'
                      className='h-14 text-2xl font-black bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white transition-all rounded-xl pl-12 pr-6'
                    />
                    <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg'>
                      ₲
                    </div>
                  </div>
                  {amountReceivedError && (
                    <p className='text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1 mt-1'>
                      <AlertCircle size={10} /> {amountReceivedError}
                    </p>
                  )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {/* Monto a Aplicar */}
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2'>
                      <Coins size={12} className='text-orange-500' /> Monto Aplicar
                    </label>
                    <Input
                      type='text'
                      inputMode='numeric'
                      value={amountToApply}
                      onChange={e => {
                        setAmountToApply(formatNumberWithDots(parseNumberWithDots(e.target.value)))
                        userEditedAmountToApply.current = true
                        setAmountToApplyError(null)
                      }}
                      className='h-12 font-bold bg-slate-50 rounded-xl border-dashed border-2 hover:border-slate-300'
                    />
                    {amountToApplyError && <p className='text-[10px] font-bold text-rose-500 mt-1 uppercase'>{amountToApplyError}</p>}
                  </div>

                  {/* Vuelto / Diferencia */}
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2'>
                      Vuelto / Saldo
                    </label>
                    <div className='h-12 flex items-center px-4 bg-orange-50 text-orange-700 font-black rounded-xl border border-orange-100'>
                      {formatLocalizedCurrency(change)}
                    </div>
                  </div>
                </div>

                {/* Caja Registradora */}
                <div className='space-y-2'>
                  <label className='text-[10px] font-black text-slate-800 uppercase tracking-widest'>Caja de Cobro</label>
                  <Select
                    value={resolvedCashRegisterValue}
                    onValueChange={v => v === CASH_REGISTER_NONE_VALUE ? setCashRegisterId('') : setCashRegisterId(v)}
                    modal={false}
                  >
                    <SelectTrigger className='h-12 rounded-xl bg-slate-50 border-slate-100'>
                      <SelectValue placeholder='Seleccione Caja' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CASH_REGISTER_NONE_VALUE}>Sin asignar caja</SelectItem>
                      {cashRegisterOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className='flex justify-between gap-4 w-full min-w-[200px]'>
                            <span className='font-bold'>{opt.label}</span>
                            <span className='text-[10px] opacity-70'>{opt.balanceLabel}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notas */}
                <div className='space-y-2'>
                  <label className='text-[10px] font-black text-slate-800 uppercase tracking-widest'>Comentarios</label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder='Notas internas del cobro...'
                    className='min-h-[80px] rounded-xl bg-slate-50 border-slate-100 text-sm'
                  />
                </div>
              </div>

              {/* Errores del Servidor */}
              {formError && (
                <div className='p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-black uppercase flex items-center gap-3'>
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <footer className='mt-4 flex gap-3 pt-6 border-t border-slate-100'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => handleDialogChange(false)}
                  className='flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]'
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitDisabled}
                  className='flex-[2] h-12 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95'
                >
                  {isSubmitting ? (
                    <div className='flex items-center gap-2'>
                      <Loader2 size={16} className='animate-spin' />
                      Procesando...
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 uppercase'>
                      <CheckCircle2 size={16} /> Confirmar Transacción
                    </div>
                  )}
                </Button>
              </footer>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterSalePaymentModal
