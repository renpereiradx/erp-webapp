import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Receipt,
  Coins,
  ArrowUpRight,
  User,
  Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useI18n } from '@/lib/i18n'
import { toApiError } from '@/utils/ApiError'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CurrencyService } from '@/services/currencyService'
import { ExchangeRateService } from '@/services/exchangeRateService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { normalizeCurrencyCode, formatPYG } from '@/utils/currencyUtils'
import { round2, computeForeignDue } from '@/domain/sale/calculations/foreignPayment'

const DEFAULT_CURRENCY_CODE = 'PYG'
const CASH_REGISTER_NONE_VALUE = '__none__'

const getNormalizedBalanceDue = (balanceDue: any, currency: any) => {
  if (balanceDue === null || balanceDue === undefined) return null
  const raw = Number(balanceDue)
  if (!Number.isFinite(raw)) return null
  const code = normalizeCurrencyCode(currency)
  if (code === 'PYG') return Math.round(raw)
  return Math.round(raw * 100) / 100
}

interface RegisterSalePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
  onSubmit: (data: any) => Promise<void>;
}

/**
 * Registro de cobro para ventas pendientes, alineado con la política de
 * "cobro en divisa" del SaleCheckoutWizard: el saldo de la venta se salda
 * SIEMPRE en la moneda del documento (base), y la divisa elegida describe
 * qué se recibió físicamente. Con divisa ≠ documento: la tasa se precarga y
 * es editable, el "Importe Entregado" se tipea en ESA divisa y su
 * equivalente en base se CALCULA (no se tipea). El vuelto se entrega en la
 * moneda del documento.
 */
const RegisterSalePaymentModal = ({ open, onOpenChange, sale, onSubmit }: RegisterSalePaymentModalProps) => {
  const { lang, t } = useI18n()

  const [amountReceived, setAmountReceived] = useState<string | number>('')
  const [amountToApply, setAmountToApply] = useState<string | number>('')
  const [exchangeRate, setExchangeRate] = useState<string | number>('')
  const [notes, setNotes] = useState<string>('')
  const [paymentMethodId, setPaymentMethodId] = useState<string>('')
  // Id (numérico como string) de la moneda de COBRO; default: la del documento.
  const [currencyId, setCurrencyId] = useState<string>('')
  const [cashRegisterId, setCashRegisterId] = useState<string>('')

  const userEditedAmountToApply = useRef<boolean>(false)

  const [, setAmountReceivedError] = useState<string | null>(null)
  const [, setAmountToApplyError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState<boolean>(false)

  const [cashRegisters, setCashRegisters] = useState<any[]>([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState<boolean>(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  // Moneda del documento (en la que está el saldo). Bajo la política actual
  // es la base, pero el cobro en divisa se compara contra la del documento.
  const docCurrencyCode = useMemo(
    () => normalizeCurrencyCode(sale?.currency || DEFAULT_CURRENCY_CODE),
    [sale?.currency],
  )

  const resolveDefaultCurrencyId = useCallback((list: any[]) => {
    const byCode = list.find(c => normalizeCurrencyCode(c.code || c.currency_code) === docCurrencyCode)
    return byCode ? String(byCode.id) : ''
  }, [docCurrencyCode])

  const resetForm = useCallback(() => {
    setAmountReceived('')
    setAmountToApply('')
    setExchangeRate('')
    setNotes('')
    setPaymentMethodId('')
    setCurrencyId(resolveDefaultCurrencyId(currencies))
    setCashRegisterId('')
    setAmountReceivedError(null)
    setAmountToApplyError(null)
    setFormError(null)
    setSubmitting(false)
    userEditedAmountToApply.current = false
  }, [currencies, resolveDefaultCurrencyId])

  // Reset al abrir. Vía ref: resetForm cambia de identidad cuando cargan las
  // monedas y el efecto NO debe re-dispararse entonces (borraría lo tipeado).
  const resetFormRef = useRef(resetForm)
  resetFormRef.current = resetForm
  useEffect(() => { if (open) resetFormRef.current() }, [open])

  const handleDialogChange = nextOpen => {
    if (!nextOpen) resetForm()
    if (onOpenChange) onOpenChange(nextOpen)
  }

  const formatLocalizedCurrency = useCallback((value, code = 'PYG') => {
    const normalized = normalizeCurrencyCode(code)
    if (normalized === 'PYG') {
      return formatPYG(Number(value || 0));
    }
    const formatter = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency', currency: normalized,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(Number(value || 0))
  }, [lang])

  const formatNumberWithDots = useCallback(value => {
    if (!value) return ''
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }, [])

  const parseNumberWithDots = useCallback(value => {
    if (!value) return ''
    return value.toString().replace(/\./g, '')
  }, [])

  const loadData = useCallback(async () => {
    setCashRegistersLoading(true)
    try {
      const [methods, currencyList, registersData] = await Promise.all([
        PaymentMethodService.getAll().catch(() => []),
        CurrencyService.getAll().catch(() => []),
        Promise.all([
          cashRegisterService.getCashRegisters().catch(() => []),
          cashRegisterService.getActiveCashRegister().catch(() => null)
        ])
      ])

      const validMethods = Array.isArray(methods) ? methods : []
      setPaymentMethods(validMethods)
      if (validMethods.length > 0) {
        const def = validMethods.find(m => m.is_default) || validMethods[0]
        setPaymentMethodId(curr => curr || String(def.id || def.payment_method_id))
      }

      const normalized = Array.isArray(currencyList) ? currencyList : []
      setCurrencies(normalized)
      setCurrencyId(curr => curr || resolveDefaultCurrencyId(normalized))

      const [allRegs, activeReg] = registersData
      const openRegs = Array.isArray(allRegs) ? allRegs.filter(cr => {
        const s = (cr?.status || cr?.state || '').toUpperCase()
        return s === 'OPEN' || s === 'ACTIVE'
      }) : []
      setCashRegisters(openRegs)

      if (activeReg?.id) {
        const isActiveInBranch = openRegs.some(cr => String(cr.id) === String(activeReg.id));
        if (isActiveInBranch) {
          setCashRegisterId(c => c || String(activeReg.id))
        }
      }
    } catch (e) { console.error('Error loading modal data:', e) }
    finally { setCashRegistersLoading(false) }
  }, [docCurrencyCode])

  useEffect(() => { if (open) loadData() }, [loadData, open])

  // ─── Cobro en divisa: derivaciones ────────────────────────────────────────
  const selectedCurrency = useMemo(
    () => currencies.find(c => String(c.id) === String(currencyId)),
    [currencies, currencyId],
  )
  const selectedCurrencyCode = normalizeCurrencyCode(selectedCurrency?.code || selectedCurrency?.currency_code)
  // Cobro en divisa activo cuando la moneda elegida difiere de la del documento.
  const isForeign = !!selectedCurrency && selectedCurrencyCode !== docCurrencyCode
  const rate = useMemo(() => Number(exchangeRate) || 0, [exchangeRate])
  // En divisa el input admite decimales (number); en base mantiene el formato
  // con puntos de miles del input legado.
  const foreignReceived = useMemo(() => Number(amountReceived) || 0, [amountReceived])
  const baseNumericReceived = useMemo(() => (
    isForeign && rate > 0
      ? round2(foreignReceived * rate)
      : Number.parseFloat(parseNumberWithDots(amountReceived)) || 0
  ), [isForeign, rate, foreignReceived, amountReceived, parseNumberWithDots])
  const calculatedForeignDue = useMemo(
    () => (isForeign && rate > 0 ? computeForeignDue(getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0, rate) : 0),
    [isForeign, rate, sale?.balance_due, sale?.currency],
  )

  // Precarga de la tasa al elegir una divisa distinta de la del documento.
  useEffect(() => {
    if (!isForeign || !selectedCurrency || exchangeRate) return
    let cancelled = false
    ExchangeRateService.getLatest(selectedCurrency.id)
      .then((r: any) => {
        if (cancelled || !r) return
        const value = r.rate_to_base ?? r.rate
        if (value) setExchangeRate(String(value))
      })
      .catch(() => { /* sin tasa cargada: el operador la tipea; sin tasa no se puede registrar */ })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForeign, selectedCurrency?.id])

  const handleCurrencyChange = (code: string) => {
    // Al cambiar la divisa los montos tipeados cambian de unidad: se limpian
    // para no enviar guaraníes como si fueran dólares (y viceversa).
    setExchangeRate('')
    setAmountReceived('')
    setAmountToApply('')
    userEditedAmountToApply.current = false
    setCurrencyId(code)
  }

  const currencySelectorData = useMemo(() => {
    if (currencies.length) {
      return currencies.map(c => ({
        id: String(c.id),
        code: normalizeCurrencyCode(c.code || c.currency_code),
        name: c.currency_name || c.name,
      }))
    }
    return [{ id: '', code: docCurrencyCode, name: docCurrencyCode }]
  }, [currencies, docCurrencyCode])

  const paymentMethodOptions = useMemo(() => paymentMethods.map(m => {
    const id = String(m.id || m.payment_method_id)
    // Alineado con API v1.1: usar description y method_code
    const label = m.description || m.method_code || m.display_name || m.name || id
    return { id, label }
  }).filter(o => o.id !== 'undefined'), [paymentMethods])

  const validationErrors = useMemo(() => {
    const errors: { amountReceived: string | null, exchangeRate: string | null, amountToApply: string | null, hasErrors: boolean } = { amountReceived: null, exchangeRate: null, amountToApply: null, hasErrors: false }
    if (!sale) return errors

    // Cobro en divisa sin tasa: se bloquea el submit (el backend nunca debe
    // recibir un monto en divisa convertido con una tasa inexistente).
    if (isForeign && rate <= 0) {
      errors.exchangeRate = t('sales.registerPaymentModal.rateRequired', 'Cargá la tasa de cambio para cobrar en {currency}', { currency: selectedCurrencyCode })
      errors.hasErrors = true
    }

    const numericReceived = isForeign ? foreignReceived : Number.parseFloat(parseNumberWithDots(amountReceived))
    if (amountReceived !== '' && amountReceived !== undefined && amountReceived !== null) {
      if (!Number.isFinite(numericReceived) || numericReceived <= 0) {
        errors.amountReceived = 'Monto inválido'
        errors.hasErrors = true
      }
    }

    if (amountToApply && amountReceived) {
      const numericToApply = Number.parseFloat(parseNumberWithDots(amountToApply))
      const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)

      if (!Number.isFinite(numericToApply) || numericToApply <= 0) {
        errors.amountToApply = 'Monto inválido'
        errors.hasErrors = true
      } else if (numericToApply > baseNumericReceived) {
        errors.amountToApply = 'Excede el recibido'
        errors.hasErrors = true
      } else if (balanceDue !== null && numericToApply > balanceDue) {
        errors.amountToApply = 'Excede la deuda'
        errors.hasErrors = true
      }
    }
    return errors
  }, [sale, amountReceived, amountToApply, isForeign, rate, foreignReceived, baseNumericReceived, selectedCurrencyCode, parseNumberWithDots, t])

  // Vuelto: SIEMPRE en la moneda del documento (recibido convertido a base
  // menos lo aplicado).
  const change = useMemo(() => (
    Math.max(0, baseNumericReceived - (Number.parseFloat(parseNumberWithDots(amountToApply)) || 0))
  ), [baseNumericReceived, amountToApply, parseNumberWithDots])

  const projectedBalance = useMemo(() => {
    if (!sale) return 0
    const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency) || 0
    const toApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || 0
    return Math.max(0, balanceDue - toApply)
  }, [sale, amountToApply, parseNumberWithDots])

  const cashRegisterOptions = useMemo(() => cashRegisters.map(cr => ({
    value: String(cr.id),
    label: cr.name || cr.description || `Caja #${cr.id}`,
    balanceLabel: typeof cr.current_balance === 'number' ? formatLocalizedCurrency(cr.current_balance, cr.currency) : null,
    meta: cr.location || cr.branch_name || null
  })), [cashRegisters, formatLocalizedCurrency])

  const isSubmitDisabled = !sale || isSubmitting || isCashRegistersLoading || validationErrors.hasErrors || !amountReceived || !amountToApply || !paymentMethodId || !cashRegisterId

  // Caja REQUERIDA para cobrar (decisión de producto): el backend responde 409
  // "no hay una caja registradora abierta" (CashRegisterRequired). El modal no
  // debe dejar enviar sin caja: se bloquea el submit y se muestra guía.
  const cashRegisterHint = useMemo(() => {
    if (isCashRegistersLoading) return ''
    if (cashRegisters.length === 0) {
      return t('sales.registerPaymentModal.cashRegister.empty', 'No hay cajas registradoras abiertas disponibles. Abrí una caja antes de cobrar.')
    }
    if (!cashRegisterId) {
      return t('sales.registerPaymentModal.cashRegister.errorRequired', 'Debe seleccionar una caja registradora')
    }
    return ''
  }, [isCashRegistersLoading, cashRegisters.length, cashRegisterId, t])

  const handleSubmit = async event => {
    event.preventDefault()
    if (!sale) return
    // Caja requerida: el submit se bloquea sin caja seleccionada (defensa extra
    // ante submit vía Enter; el botón ya está disabled).
    if (!cashRegisterId) return
    // Defensa extra ante submit con divisa sin tasa (el botón ya está disabled).
    if (isForeign && rate <= 0) return
    const numericAmountToApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || baseNumericReceived

    setSubmitting(true)
    try {
      const selectedMethod = paymentMethods.find(m => String(m.id || m.payment_method_id) === String(paymentMethodId))

      await onSubmit({
        sales_order_id: sale.id || sale.sale_id,
        // amount_received SIEMPRE en la moneda del documento: con cobro en
        // divisa es foreignReceived × tasa (convertido acá y re-validado por
        // el backend).
        amount_received: Number(baseNumericReceived.toFixed(2)),
        amount_to_apply: Number(numericAmountToApply.toFixed(2)),
        payment_method_id: Number(paymentMethodId),
        payment_method_name: selectedMethod ? (selectedMethod.name || selectedMethod.description || 'CASH').toUpperCase() : 'CASH',
        // Metadatos del cobro en divisa (auditoría; el saldo se salda en base).
        currency_id: isForeign && selectedCurrency ? Number(selectedCurrency.id) : undefined,
        exchange_rate: isForeign ? rate : undefined,
        original_amount: isForeign ? Number(foreignReceived.toFixed(2)) : undefined,
        cash_register_id: cashRegisterId ? Number(cashRegisterId) : undefined,
        payment_notes: notes.trim() || null,
      })
      resetForm()
      handleDialogChange(false)
    } catch (error: any) {
      const norm = toApiError(error)
      if (norm.code === 'CONFLICT') {
        setFormError(t('sales.errors.cashRegisterRequired', 'Necesitás una caja abierta para cobrar. Abrí una caja e intentá de nuevo.'))
      } else {
        setFormError(error?.message || 'Error al registrar')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const balanceDueLabel = useMemo(() => sale ? formatLocalizedCurrency(sale.balance_due, sale.currency) : null, [formatLocalizedCurrency, sale])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='register-sale-payment-modal w-[95vw] lg:!w-[1100px] lg:!max-w-[calc(95vw-288px)] p-0 overflow-hidden border border-border-subtle shadow-fluent-16 rounded-xl bg-surface'>
        <DialogTitle className='sr-only'>Registrar Cobro de Venta</DialogTitle>
        <DialogDescription className='sr-only'>Registre el cobro de la venta seleccionada.</DialogDescription>
        <form className='flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[90vh] overflow-hidden' onSubmit={handleSubmit}>
          {/* PANEL IZQUIERDO: RESUMEN OPERATIVO */}
          <div className='w-full md:w-[32%] bg-[#001a33] text-white p-8 md:p-10 flex flex-col relative overflow-hidden border-r border-white/5'>
            {/* Elementos decorativos Fluent */}
            <div className='absolute -top-24 -right-24 size-64 bg-primary/10 rounded-full blur-3xl opacity-50' />
            <div className='absolute -bottom-24 -left-24 size-64 bg-primary/5 rounded-full blur-3xl opacity-30' />

            <div className='relative z-10 flex flex-col h-full'>
              <header className='mb-12'>
                <div className='size-12 bg-primary rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/30'>
                  <Building size={24} />
                </div>
                <h2 className='text-3xl font-black tracking-tighter uppercase leading-[0.85] mb-3'>
                  Estado de <br />
                  <span className='text-primary'>Cobro</span>
                </h2>
                <div className='inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 font-black text-[9px] uppercase tracking-widest'>
                  <Receipt size={12} className='text-primary' /> Venta #{sale?.id || sale?.sale_id || '---'}
                </div>
              </header>

              {/* FLUJO DE SALDOS: Entrada -> Operación -> Salida */}
              <div className='flex-1 flex flex-col gap-8'>
                {/* 1. Estado Actual */}
                <div className='relative pl-6 border-l-2 border-white/10'>
                  <div className='absolute -left-[9px] top-0 size-4 rounded-full bg-[#001a33] border-2 border-white/20' />
                  <p className='text-[10px] font-black uppercase tracking-widest text-white/40 mb-1'>Saldo Inicial</p>
                  <p className='text-2xl font-black text-white tabular-nums font-mono'>{balanceDueLabel || formatLocalizedCurrency(0)}</p>
                </div>

                {/* 2. Operación (Barra de progreso integrada) */}
                <div className='bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-fluent-2'>
                  <div className='flex justify-between items-center mb-4'>
                    <p className='text-[10px] font-black uppercase tracking-widest text-primary'>Aplicando Pago</p>
                    <span className='text-xs font-black text-white bg-primary/20 px-2 py-0.5 rounded'>
                      {Math.round((Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100)}%
                    </span>
                  </div>
                  <div className='h-2 bg-white/5 rounded-full overflow-hidden mb-4'>
                    <div
                      className='h-full bg-primary shadow-[0_0_12px_rgba(19,127,236,0.5)] transition-all duration-1000'
                      style={{ width: `${Math.min(100, Math.round((Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100))}%` }}
                    />
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='size-8 rounded-full bg-white/10 flex items-center justify-center text-white/60'>
                      <User size={14} />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-[9px] font-black uppercase text-white/30 truncate'>Cliente</p>
                      <p className='text-xs font-bold text-white truncate'>{sale?.client_name || 'Consumidor Final'}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Resultado Final */}
                <div className='relative pl-6 border-l-2 border-primary/30'>
                  <div className='absolute -left-[9px] top-0 size-4 rounded-full bg-primary shadow-[0_0_8px_rgba(19,127,236,0.5)]' />
                  <p className='text-[10px] font-black uppercase tracking-widest text-primary mb-1'>Nuevo Saldo</p>
                  <p className={cn(
                    "text-3xl font-black tabular-nums transition-colors font-mono tracking-tighter",
                    projectedBalance <= 0 ? "text-success" : "text-white"
                  )}>
                    {formatLocalizedCurrency(projectedBalance)}
                  </p>
                </div>
              </div>

              <footer className='mt-12 pt-8 border-t border-white/5 hidden md:block opacity-30'>
                <p className='text-[9px] uppercase font-black tracking-[0.2em] leading-relaxed'>
                  SISTEMA DE GESTIÓN OPERATIVA <br /> FLUENT ERP v2.0
                </p>
              </footer>
            </div>
          </div>

          {/* PANEL DERECHO: FORMULARIO ESTRUCTURADO */}
          <div className='w-full md:w-[68%] bg-[#f8fafc] p-6 md:p-10 flex flex-col'>
            <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6'>

              {/* SECCIÓN 1: ORIGEN Y MONEDA (CARD) */}
              <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
                <div className='px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3'>
                  <div className='size-7 bg-primary/10 rounded flex items-center justify-center text-primary'>
                    <Coins size={16} />
                  </div>
                  <h3 className='text-[11px] font-black uppercase text-slate-500 tracking-widest'>Origen de Fondos</h3>
                </div>
                <div className='p-6 space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
                    {/* Monto Recibido - Principal (en la divisa de cobro) */}
                    <div className='md:col-span-7 space-y-2'>
                      <div className='flex justify-between items-center'>
                        <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>
                          {isForeign
                            ? t('sales.registerPaymentModal.amountReceivedForeign', 'Importe Entregado ({currency})', { currency: selectedCurrencyCode })
                            : 'Importe Entregado'}
                        </label>
                        <button
                          type='button'
                          onClick={() => {
                            const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)
                            if (balanceDue === null) return
                            if (isForeign && rate > 0) {
                              // En divisa: recibido = equivalente del saldo en la
                              // divisa; lo aplicado sigue siendo el saldo en base.
                              setAmountReceived(String(computeForeignDue(balanceDue, rate)))
                              setAmountToApply(formatNumberWithDots(String(balanceDue)))
                            } else {
                              setAmountReceived(formatNumberWithDots(String(balanceDue)))
                              setAmountToApply(formatNumberWithDots(String(balanceDue)))
                            }
                            userEditedAmountToApply.current = false
                          }}
                          className='text-[9px] font-black uppercase text-primary hover:underline'
                        >
                          Cubrir Saldo Total
                        </button>
                      </div>
                      <div className='relative group'>
                        <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl font-mono'>
                          {isForeign ? selectedCurrencyCode : '₲'}
                        </div>
                        <Input
                          type={isForeign ? 'number' : 'text'}
                          inputMode={isForeign ? 'decimal' : 'numeric'}
                          step={isForeign ? '0.01' : undefined}
                          min='0'
                          value={amountReceived}
                          onChange={e => {
                            if (isForeign) {
                              const numeric = Number(e.target.value) || 0
                              setAmountReceived(e.target.value)
                              if (!userEditedAmountToApply.current) {
                                const balanceDue = getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0
                                const converted = rate > 0 ? round2(numeric * rate) : 0
                                setAmountToApply(formatNumberWithDots(String(Math.round(Math.min(converted, balanceDue)))))
                              }
                              return
                            }
                            const val = formatNumberWithDots(parseNumberWithDots(e.target.value))
                            setAmountReceived(val)
                            if (!userEditedAmountToApply.current) {
                              const balanceDue = getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0
                              const numeric = Number.parseFloat(parseNumberWithDots(val)) || 0
                              setAmountToApply(formatNumberWithDots(String(Math.round(Math.min(numeric, balanceDue)))))
                            }
                          }}
                          className='h-14 pl-12 rounded-lg bg-slate-50/50 border-slate-200 font-black font-mono text-2xl focus:ring-primary focus:bg-white transition-all shadow-inner'
                        />
                      </div>
                      {isForeign && (
                        <p className='text-[10px] font-bold text-slate-400 font-mono'>
                          {t('sales.registerPaymentModal.baseEquivalent', 'Equivale a {amount} (el saldo se salda en {base})', {
                            amount: formatLocalizedCurrency(baseNumericReceived, docCurrencyCode),
                            base: docCurrencyCode,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Divisa de cobro */}
                    <div className='md:col-span-5 space-y-2'>
                      <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>
                        {t('sales.registerPaymentModal.currencyLabel', 'Divisa de cobro')}
                      </label>
                      <Select value={currencyId} onValueChange={handleCurrencyChange}>
                        <SelectTrigger className='h-14 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-sm'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='rounded-xl border-slate-200 shadow-fluent-16'>
                          {currencySelectorData.map(c => (
                            <SelectItem key={c.id || c.code} value={c.id || c.code} className='font-bold text-xs uppercase py-3'>{c.code} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tasa de cambio (solo divisa ≠ documento): precargada, editable; equivalente calculado */}
                  {isForeign && (
                    <div className='grid grid-cols-2 gap-6 p-5 bg-primary/5 rounded-lg border border-primary/10 animate-in fade-in zoom-in-95 duration-300'>
                      <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-primary/60 tracking-widest'>
                          {t('sales.registerPaymentModal.exchangeRate', 'Tasa de Cambio')}
                        </label>
                        <Input
                          type='number'
                          step='any'
                          min='0'
                          value={exchangeRate}
                          onChange={e => setExchangeRate(e.target.value)}
                          className='h-10 rounded-md bg-white border-primary/20 font-mono font-black text-primary'
                        />
                        <p className='text-[9px] font-bold text-slate-400'>
                          {t('sales.registerPaymentModal.exchangeRateHint', '1 {currency} = ? {base}. Precargada del día; ajustala si tu cotización es otra.', {
                            currency: selectedCurrencyCode, base: docCurrencyCode,
                          })}
                        </p>
                        {validationErrors.exchangeRate && (
                          <p className='flex items-center gap-1.5 text-[10px] font-black uppercase text-error tracking-wide'>
                            <AlertCircle size={13} className='shrink-0' />
                            <span>{validationErrors.exchangeRate}</span>
                          </p>
                        )}
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-primary/60 tracking-widest'>
                          {t('sales.registerPaymentModal.foreignDueLabel', 'A cobrar ({currency})', { currency: selectedCurrencyCode })}
                        </label>
                        <div className='h-10 flex items-center px-3 rounded-md bg-white border border-primary/20 font-mono font-black text-primary text-sm'>
                          {calculatedForeignDue > 0
                            ? formatLocalizedCurrency(calculatedForeignDue, selectedCurrencyCode)
                            : t('sales.registerPaymentModal.ratePending', 'Cargá la tasa para ver el equivalente')}
                        </div>
                        <p className='text-[9px] font-bold text-slate-400'>
                          {t('sales.registerPaymentModal.foreignDueHint', 'Equivalente del saldo calculado con la tasa. El vuelto se entrega en {base}.', { base: docCurrencyCode })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: REGISTRO Y CAJA (CARD) */}
              <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
                <div className='px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3'>
                  <div className='size-7 bg-primary/10 rounded flex items-center justify-center text-primary'>
                    <Building size={16} />
                  </div>
                  <h3 className='text-[11px] font-black uppercase text-slate-500 tracking-widest'>Registro Contable</h3>
                </div>
                <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Método de Pago</label>
                    <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                      <SelectTrigger className='h-12 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-sm'>
                        <SelectValue placeholder='Seleccionar...' />
                      </SelectTrigger>
                      <SelectContent className='rounded-xl border-slate-200 shadow-fluent-16'>
                        {paymentMethodOptions.map(m => (
                          <SelectItem key={m.id} value={m.id} className='font-bold text-xs uppercase py-3'>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Caja Operativa</label>
                    <Select value={cashRegisterId || CASH_REGISTER_NONE_VALUE} onValueChange={v => setCashRegisterId(v === CASH_REGISTER_NONE_VALUE ? '' : v)}>
                      <SelectTrigger className='h-12 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-sm'>
                        <SelectValue placeholder={t('sales.registerPaymentModal.cashRegister.placeholder', 'Seleccionar caja...')} />
                      </SelectTrigger>
                      <SelectContent className='rounded-xl border-slate-200 shadow-fluent-16 min-w-[300px]'>
                        {cashRegisterOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className='py-4 border-b border-slate-50 last:border-none'>
                            <div className='flex flex-col gap-1'>
                              <span className='font-black text-[11px] uppercase text-text-main'>{opt.label}</span>
                              <div className='text-[10px] font-bold text-text-secondary font-mono bg-slate-100 px-2 py-0.5 rounded-md w-fit'>{opt.balanceLabel}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cashRegisterHint && (
                      <p className='flex items-start gap-1.5 text-[10px] font-black uppercase text-warning tracking-wide mt-1'>
                        <AlertCircle size={13} className='mt-[1px] shrink-0' />
                        <span>{cashRegisterHint}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: RESULTADO Y APLICACIÓN (PROMINENTE) */}
              <div className='bg-white rounded-xl border border-primary/20 shadow-md overflow-hidden ring-1 ring-primary/5'>
                <div className='px-6 py-4 border-b border-primary/10 bg-primary/5 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='size-7 bg-primary rounded flex items-center justify-center text-white'>
                      <ArrowUpRight size={16} />
                    </div>
                    <h3 className='text-[11px] font-black uppercase text-primary tracking-widest'>Resumen de Aplicación</h3>
                  </div>
                </div>
                <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-8'>
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>
                      {t('sales.registerPaymentModal.amountToApplyLabel', 'Monto a Aplicar a la Venta ({currency})', { currency: docCurrencyCode })}
                    </label>
                    <Input
                      type='text'
                      inputMode='numeric'
                      value={amountToApply}
                      onChange={e => {
                        setAmountToApply(formatNumberWithDots(parseNumberWithDots(e.target.value)))
                        userEditedAmountToApply.current = true
                      }}
                      className='h-12 rounded-lg bg-slate-50 border-slate-200 font-black font-mono text-xl focus:ring-primary focus:bg-white'
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>
                      {t('sales.registerPaymentModal.changeLabel', 'Vuelto a Entregar')}
                      {isForeign && (
                        <span className='ml-1 normal-case font-bold text-slate-300'>
                          {t('sales.registerPaymentModal.changeInDoc', '(en {base})', { base: docCurrencyCode })}
                        </span>
                      )}
                    </label>
                    <div className='h-12 flex items-center px-5 bg-green-50 text-success font-black rounded-lg border border-green-100 text-xl tabular-nums font-mono shadow-inner'>
                      {formatLocalizedCurrency(change, sale?.currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES */}
              <div className='space-y-2 px-1'>
                <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Notas del Operador</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder='Detalles operativos del cobro...'
                  rows={2}
                  className='rounded-xl bg-white border-slate-200 text-sm p-4 resize-none font-medium focus:ring-primary transition-all'
                />
              </div>

              {formError && (
                <div className='p-5 bg-error/5 border border-error/20 rounded-xl flex items-center gap-4 animate-in shake duration-500'>
                  <AlertCircle className="text-error" size={20} />
                  <span className='text-[11px] font-black uppercase text-error tracking-tight'>{formError}</span>
                </div>
              )}
            </div>

            <footer className='mt-10 flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-200'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleDialogChange(false)}
                className='h-12 rounded-lg border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all sm:flex-1'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitDisabled}
                className='h-12 rounded-lg bg-primary hover:bg-primary-hover text-white font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-[0.98] sm:flex-[2]'
              >
                {isSubmitting ? (
                  <div className='flex items-center gap-2'><Loader2 size={18} className='animate-spin' /> Procesando...</div>
                ) : (
                  <div className='flex items-center gap-2'><CheckCircle2 size={18} /> Registrar Cobro</div>
                )}
              </Button>
            </footer>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterSalePaymentModal
