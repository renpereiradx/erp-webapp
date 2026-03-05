import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Loader2,
  Wallet,
  Receipt,
  ArrowRight,
  Coins,
  Banknote,
  ArrowUpRight,
  User,
  Hash,
  ChevronRight,
  CreditCard,
  Building
} from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
import { CurrencyService } from '@/services/currencyService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'

const DEFAULT_CURRENCY_CODE = 'PYG'
const CASH_REGISTER_NONE_VALUE = '__none__'

const getNormalizedPendingAmount = (pendingAmount, currencyCode) => {
  if (pendingAmount === null || pendingAmount === undefined) return null
  const raw = Number(pendingAmount)
  if (!Number.isFinite(raw)) return null
  const code = normalizeCurrencyCode(currencyCode)
  if (code === 'PYG') {
    return Math.round(raw)
  }
  return Math.round(raw * 100) / 100
}

const RegisterPaymentModal = ({ open, onOpenChange, order, onSubmit }) => {
  const { t, lang } = useI18n()

  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [currencyCode, setCurrencyCode] = useState(
    (order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase()
  )
  const [cashRegister, setCashRegister] = useState('')
  const [amountError, setAmountError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [cashRegisters, setCashRegisters] = useState([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState(false)
  const [cashRegistersError, setCashRegistersError] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [isPaymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState(null)
  const [currencies, setCurrencies] = useState([])
  const [isCurrenciesLoading, setCurrenciesLoading] = useState(false)
  const [currenciesError, setCurrenciesError] = useState(null)

  const resetForm = useCallback(() => {
    setAmount('')
    setReference('')
    setNotes('')
    setPaymentMethodId('')
    setCurrencyCode((order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase())
    setCashRegister('')
    setAmountError(null)
    setFormError(null)
    setSubmitting(false)
  }, [order?.currency])

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
    const code = normalizeCurrencyCode(order?.currency)
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'PYG' ? 0 : 2,
      maximumFractionDigits: code === 'PYG' ? 0 : 2,
    })
  }, [lang, order?.currency])

  const pendingLabel = useMemo(() => {
    if (
      !order ||
      order.pendingAmount === null ||
      order.pendingAmount === undefined
    ) {
      return null
    }
    return formatter.format(Number(order.pendingAmount || 0))
  }, [formatter, order])

  const numericAmount = useMemo(() => {
    const val = Number.parseFloat(amount)
    return Number.isFinite(val) ? val : 0
  }, [amount])

  const projectedBalance = useMemo(() => {
    if (!order || order.pendingAmount === null) return 0
    const pending = Number(order.pendingAmount)
    return Math.max(0, pending - numericAmount)
  }, [order, numericAmount])

  const exceededPendingAmount = useMemo(() => {
    if (
      !order ||
      order.pendingAmount === null ||
      order.pendingAmount === undefined
    ) {
      return false
    }
    const pending = getNormalizedPendingAmount(order.pendingAmount, order.currency)
    if (pending === null) {
      return false
    }
    return numericAmount > pending
  }, [numericAmount, order])

  const formatLocalizedCurrency = useCallback(
    (value, currencyCode = 'PYG') => {
      const locale = lang === 'en' ? 'en-US' : 'es-PY'
      const code = normalizeCurrencyCode(currencyCode)
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: code === 'PYG' ? 0 : 2,
        maximumFractionDigits: code === 'PYG' ? 0 : 2,
      })
      return formatter.format(Number(value || 0))
    },
    [lang]
  )

  const loadPaymentMethods = useCallback(async () => {
    setPaymentMethodsLoading(true)
    setPaymentMethodsError(null)

    try {
      const methods = await PaymentMethodService.getAll()
      setPaymentMethods(methods)

      setPaymentMethodId(currentValue => {
        if (currentValue) return currentValue
        const defaultMethod =
          methods.find(m => m.is_default) ||
          methods.find(m => m.method_code?.toUpperCase().includes('CASH')) ||
          methods[0]
        return defaultMethod?.id ? String(defaultMethod.id) : ''
      })
    } catch (error) {
      console.error('Error loading payment methods', error)
      setPaymentMethods([])
      setPaymentMethodsError(t('purchasePaymentsMvp.registerModal.method.loadError'))
    } finally {
      setPaymentMethodsLoading(false)
    }
  }, [t])

  const loadCurrencies = useCallback(async () => {
    setCurrenciesLoading(true)
    setCurrenciesError(null)

    try {
      const currencyList = await CurrencyService.getAll()
      setCurrencies(currencyList)

      setCurrencyCode(currentValue => {
        if (currentValue) return currentValue
        const defaultCurrency = order?.currency || currencyList[0]?.currency_code || DEFAULT_CURRENCY_CODE
        return String(defaultCurrency).toUpperCase()
      })
    } catch (error) {
      console.error('Error loading currencies', error)
      setCurrencies([])
      setCurrenciesError(t('purchasePaymentsMvp.registerModal.currency.loadError'))
    } finally {
      setCurrenciesLoading(false)
    }
  }, [order?.currency, t])

  const loadCashRegisters = useCallback(async () => {
    setCashRegistersLoading(true)
    setCashRegistersError(null)

    try {
      const [allCashRegisters, activeCashRegister] = await Promise.all([
        cashRegisterService.getCashRegisters(),
        cashRegisterService.getActiveCashRegister().catch(() => null),
      ])

      const openCashRegisters = allCashRegisters?.filter(cr => {
        const s = (cr?.status || cr?.state || '').toUpperCase()
        return s === 'OPEN' || s === 'ACTIVE'
      }) || []

      const cashRegistersWithBalance = await Promise.all(
        openCashRegisters.map(async cr => {
          if (typeof cr.current_balance === 'number' && cr.current_balance > 0) return cr
          try {
            const movs = await cashRegisterService.getMovements(cr.id)
            return calculateCashRegisterBalance(cr, movs)
          } catch {
            return cr
          }
        })
      )

      setCashRegisters(cashRegistersWithBalance)
      const preferredId = activeCashRegister?.id || cashRegistersWithBalance[0]?.id || null
      if (preferredId) setCashRegister(c => c || String(preferredId))
    } catch (error) {
      console.error('Error loading cash registers', error)
      setCashRegisters([])
      setCashRegistersError(t('purchasePaymentsMvp.registerModal.cashRegister.loadError'))
    } finally {
      setCashRegistersLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!open) return
    loadCashRegisters()
    loadPaymentMethods()
    loadCurrencies()
  }, [loadCashRegisters, loadPaymentMethods, loadCurrencies, open])

  const currencySelectorData = useMemo(() => {
    const list = currencies.map(c => {
      const code = (c.currency_code || c.code || c.currencyCode || c.value || '').toUpperCase()
      if (!code) return null
      const name = c.currency_name || c.currencyName || c.name || code
      return { ...c, currency_code: code, currency_name: name, name }
    }).filter(Boolean)

    if (list.length) return list
    const fallback = (order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase()
    return [{ id: fallback, currency_code: fallback, currency_name: fallback, name: fallback }]
  }, [currencies, order?.currency])

  const paymentMethodOptions = useMemo(() => paymentMethods.map(m => {
    const id = String(m?.id ?? m?.payment_method_id ?? m?.value ?? m?.method_code)
    if (!id) return null
    return { id, label: m?.display_name || m?.name || m?.method_name || id }
  }).filter(Boolean), [paymentMethods])

  const cashRegisterOptions = useMemo(() => cashRegisters.map(cr => ({
    value: String(cr.id),
    label: cr.name || cr.description || `Caja #${cr.id}`,
    balanceLabel: typeof cr.current_balance === 'number' 
      ? formatLocalizedCurrency(cr.current_balance, cr.currency || 'PYG') 
      : null,
    meta: cr.location || cr.branch_name || null
  })), [cashRegisters, formatLocalizedCurrency])

  const isSubmitDisabled = !order || isSubmitting || isCashRegistersLoading || isPaymentMethodsLoading || 
    isCurrenciesLoading || !paymentMethodId || !currencyCode

  const handleSubmit = async event => {
    event.preventDefault()
    setAmountError(null)
    setFormError(null)

    if (!order) return
    const num = Number.parseFloat(amount)
    if (!Number.isFinite(num) || num <= 0) {
      setAmountError(t('purchasePaymentsMvp.registerModal.amount.errorRequired'))
      return
    }

    const pending = getNormalizedPendingAmount(order.pendingAmount, order.currency)
    if (pending !== null && num > pending) {
      setAmountError(t('purchasePaymentsMvp.registerModal.amount.errorExceeded'))
      return
    }

    if (!paymentMethodId) {
      setFormError(t('purchasePaymentsMvp.registerModal.method.errorRequired'))
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        orderId: order.id,
        amount: Number(num.toFixed(2)),
        paymentMethodId: Number(paymentMethodId),
        currencyCode: String(currencyCode).toUpperCase(),
        reference: reference.trim() || null,
        cashRegisterId: cashRegister ? Number(cashRegister) : undefined,
        notes: notes.trim() || null,
      })
      resetForm()
      handleDialogChange(false)
    } catch (error) {
      setFormError(error?.message || t('purchasePaymentsMvp.registerModal.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const paymentPercentage = useMemo(() => {
    if (!order || order.pendingAmount === null || order.pendingAmount === 0) return 0
    const total = Number(order.pendingAmount)
    return Math.min(100, Math.round((numericAmount / total) * 100))
  }, [order, numericAmount])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='max-w-5xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl sm:rounded-3xl'>
        <DialogTitle className='sr-only'>Registrar Pago Proveedor</DialogTitle>
        <DialogDescription className='sr-only'>Registre el pago a un proveedor para la factura correspondiente.</DialogDescription>
        <form onSubmit={handleSubmit} className='flex flex-col md:flex-row h-full max-h-[90vh]'>
          {/* Columna Izquierda: Resumen Visual Premium */}
          <div className='w-full md:w-[42%] bg-slate-900 border-r border-white/5 text-white p-8 md:p-10 flex flex-col relative overflow-hidden'>
            <div className='relative z-10 flex flex-col h-full'>
              <header className='mb-10'>
                <div className='size-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 ring-1 ring-primary/40'>
                  <Building size={32} />
                </div>
                <h2 className='text-3xl font-black tracking-tighter uppercase leading-tight mb-2'>
                  Registrar Pago <br />
                  <span className='text-primary'>Proveedor</span>
                </h2>
                <div className='flex items-center gap-2 text-white/60 font-black uppercase text-[10px] tracking-widest'>
                  <Receipt size={14} className='text-primary' /> Factura #{order?.id || '---'}
                </div>
              </header>

              <div className='space-y-8 flex-1'>
                {/* Card de Proveedor */}
                <div className='bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10'>
                  <div className='flex items-center gap-4 mb-3'>
                    <div className='size-10 bg-white/10 rounded-xl flex items-center justify-center text-white/50 ring-1 ring-white/20'>
                      <User size={20} />
                    </div>
                    <div>
                      <p className='text-[9px] font-black text-white/40 uppercase tracking-widest'>Proveedor</p>
                      <p className='font-black text-white truncate max-w-[180px]'>{order?.supplierName || 'Empresa Proveedora'}</p>
                    </div>
                  </div>
                </div>

                {/* Resumen de Montos */}
                <div className='space-y-5'>
                  <div>
                    <div className='flex justify-between items-end mb-2'>
                      <p className='text-[10px] font-black text-white/50 uppercase tracking-widest'>Deuda Pendiente</p>
                      <p className='text-xl font-black text-white tabular-nums'>{pendingLabel || '0 PYG'}</p>
                    </div>
                    <div className='h-2 bg-slate-800 rounded-full overflow-hidden'>
                      <div 
                        className='h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_12px_rgba(var(--primary),0.6)]' 
                        style={{ width: `${paymentPercentage}%` }}
                      />
                    </div>
                    <div className='mt-2 text-[9px] font-black text-primary uppercase tracking-widest text-right'>
                      Cubriendo {paymentPercentage}% del saldo
                    </div>
                  </div>

                  <div className='flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20'>
                    <div className='flex items-center gap-3'>
                      <div className='size-8 bg-primary rounded-lg flex items-center justify-center text-white'>
                        <ArrowUpRight size={18} />
                      </div>
                      <div>
                        <p className='text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1'>Saldo Proyectado</p>
                        <p className={cn(
                          "text-lg font-black tabular-nums transition-colors leading-none",
                          projectedBalance === 0 ? "text-green-400" : "text-white"
                        )}>
                          {formatLocalizedCurrency(projectedBalance, order?.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <footer className='mt-10 pt-6 border-t border-white/10'>
                <p className='text-[10px] text-white/30 font-bold leading-relaxed italic uppercase tracking-tighter'>
                  * Verifique la cuenta y el método de pago antes de confirmar.
                </p>
              </footer>
            </div>
          </div>

          {/* Columna Derecha: Formulario Premium */}
          <div className='w-full md:w-[58%] bg-white dark:bg-slate-900 p-8 md:p-10 flex flex-col'>
            <div className='flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-thin'>
              {/* Sección de Pago */}
              <section className='space-y-6'>
                <div className='flex items-center gap-3 border-b border-slate-100 pb-3'>
                  <div className='size-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500'>
                    <Coins size={18} />
                  </div>
                  <h3 className='text-xs font-black uppercase tracking-widest text-slate-800'>Detalles de la Transacción</h3>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                  {/* Monto a Pagar */}
                  <div className='space-y-2 group'>
                    <div className='flex items-center justify-between'>
                      <label htmlFor='purchase-amount' className='text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1'>
                        Monto a Pagar
                      </label>
                      <button 
                        type='button' 
                        onClick={() => setAmount(String(getNormalizedPendingAmount(order?.pendingAmount, order?.currency)))}
                        className='text-[9px] font-black uppercase text-primary hover:underline'
                      >
                        Pagar Todo
                      </button>
                    </div>
                    <div className='relative'>
                      <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'>
                        <DollarSign size={18} />
                      </div>
                      <Input
                        id='purchase-amount'
                        type='number'
                        step='0.01'
                        value={amount}
                        onChange={e => {
                        const val = e.target.value
                        setAmount(val)
                        // Sincronización manual básica similar al otro modal para consistencia
                        const numericVal = Number.parseFloat(val)
                        if (Number.isFinite(numericVal)) {
                           // No forzamos amountToApply aquí para evitar el bug de React
                        }
                        if (amountError) setAmountError(null)
                      }}
  className='h-14 pl-12 rounded-xl bg-slate-50 border-slate-100 font-bold text-lg focus:ring-primary shadow-inner'
                      />
                    </div>
                    {amountError && <p className='text-[10px] text-rose-500 font-bold ml-1'>{amountError}</p>}
                  </div>

                  {/* Moneda */}
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1'>Divisa</label>
                    <Select value={currencyCode} onValueChange={setCurrencyCode}>
                      <SelectTrigger className='h-14 rounded-xl bg-slate-50 border-slate-100 font-black uppercase tracking-widest text-[10px] shadow-inner transition-all'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='rounded-xl border-slate-100 shadow-2xl p-1'>
                        {currencySelectorData.map(c => (
                          <SelectItem key={c.currency_code} value={c.currency_code} className='rounded-lg font-bold uppercase text-[10px] tracking-widest py-3 focus:bg-primary/5 focus:text-primary transition-colors'>
                            {c.currency_code} · {c.currency_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Método de Pago */}
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1'>Método de Pago</label>
                    <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                      <SelectTrigger className='h-14 rounded-xl bg-slate-50 border-slate-100 font-black uppercase tracking-widest text-[10px] shadow-inner transition-all'>
                        <SelectValue placeholder='Seleccione...' />
                      </SelectTrigger>
                      <SelectContent className='rounded-xl border-slate-100 shadow-2xl p-1'>
                        {paymentMethodOptions.map(m => (
                          <SelectItem key={m.id} value={m.id} className='rounded-lg font-bold uppercase text-[10px] tracking-widest py-3 focus:bg-primary/5 focus:text-primary transition-colors'>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Referencia */}
                  <div className='space-y-2'>
                    <label htmlFor='purchase-reference' className='text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1'>Referencia / N° Recibo</label>
                    <div className='relative'>
                      <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'>
                        <Hash size={18} />
                      </div>
                      <Input
                        id='purchase-reference'
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                        placeholder='Opcional...'
                        className='h-14 pl-12 rounded-xl bg-slate-50 border-slate-100 font-bold text-[13px] shadow-inner'
                      />
                    </div>
                  </div>
                </div>

                {/* Caja Registradora */}
                <div className='space-y-2'>
                  <label className='text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1 flex items-center gap-2'>
                    <Banknote size={12} /> Caja para Desembolso
                  </label>
                  <Select value={cashRegister} onValueChange={setCashRegister}>
                    <SelectTrigger className='h-14 rounded-xl bg-slate-50 border-slate-100 font-bold shadow-inner transition-all'>
                      <SelectValue placeholder='Seleccionar caja...' />
                    </SelectTrigger>
                    <SelectContent className='rounded-xl border-slate-100 shadow-2xl p-1 max-h-[300px]'>
                      <SelectItem value={CASH_REGISTER_NONE_VALUE} className='rounded-lg font-bold uppercase text-[10px] tracking-widest py-3 mb-1 bg-slate-50'>
                        Sin Caja Seleccionada
                      </SelectItem>
                      {cashRegisterOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className='rounded-lg py-4 focus:bg-primary/5 transition-colors'>
                          <div className='flex flex-col gap-1'>
                            <span className='font-black uppercase text-[10px] tracking-widest text-slate-800 leading-none'>{opt.label}</span>
                            <div className='flex items-center gap-2'>
                              {opt.balanceLabel && <span className='text-[10px] font-black text-primary uppercase'>{opt.balanceLabel}</span>}
                              {opt.meta && <span className='text-[9px] font-medium text-slate-400 uppercase tracking-tighter'> • {opt.meta}</span>}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notas */}
                <div className='space-y-2'>
                  <label htmlFor='purchase-notes' className='text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 ml-1'>Observaciones Internas</label>
                  <Textarea
                    id='purchase-notes'
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder='Añadir detalles sobre este pago...'
                    rows={2}
                    className='rounded-xl bg-slate-50 border-slate-100 font-medium text-sm focus:ring-primary shadow-inner resize-none'
                  />
                </div>
              </section>

              {/* Errores del Formulario */}
              {formError && (
                <div className='p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-black uppercase flex items-center gap-3'>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}
            </div>

            {/* Footer de Acciones */}
            <footer className='mt-8 flex gap-4 pt-6 border-t border-slate-100'>
              <Button
                type='button'
                variant='outline'
                disabled={isSubmitting}
                onClick={() => handleDialogChange(false)}
                className='flex-1 h-14 rounded-xl font-black uppercase tracking-widest text-[10px] border-slate-200'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitDisabled}
                className='flex-[2] h-14 rounded-xl bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95'
              >
                {isSubmitting ? (
                  <div className='flex items-center gap-2 uppercase'>
                    <Loader2 size={16} className='animate-spin' /> Procesando...
                  </div>
                ) : (
                  <div className='flex items-center gap-2 uppercase'>
                    <CheckCircle2 size={16} /> Confirmar Pago
                  </div>
                )}
              </Button>
            </footer>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterPaymentModal
